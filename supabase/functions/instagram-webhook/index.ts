// Instagram Webhook - Recebe mensagens do Instagram DM
// Deploy: supabase functions deploy instagram-webhook --no-verify-jwt
// Docs: https://developers.facebook.com/docs/messenger-platform/instagram

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VERIFY_TOKEN = Deno.env.get("META_VERIFY_TOKEN") || "melon_chat_verify_token";

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(req.url);

    // Webhook Verification (GET request from Meta)
    if (req.method === "GET") {
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        if (mode === "subscribe" && token === VERIFY_TOKEN) {
            console.log("✅ Instagram webhook verified");
            return new Response(challenge, { status: 200 });
        } else {
            console.error("❌ Instagram webhook verification failed");
            return new Response("Forbidden", { status: 403 });
        }
    }

    // Handle incoming messages (POST request)
    if (req.method === "POST") {
        try {
            const body = await req.json();
            console.log("📥 Instagram webhook received:", JSON.stringify(body));

            // Validate it's from Instagram
            if (body.object !== "instagram") {
                console.log("⚠️ Not an Instagram webhook, object:", body.object);
                return new Response("Not Instagram", { status: 200 });
            }

            const supabase = createClient(
                Deno.env.get("SUPABASE_URL")!,
                Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
            );

            // Process each entry
            for (const entry of body.entry || []) {
                const entryId = entry.id; // Instagram Account ID
                console.log("🔍 Processing entry for Instagram ID:", entryId);
                console.log("📦 Full entry:", JSON.stringify(entry, null, 2));

                // O webhook do Instagram envia o Instagram Account ID no entry.id
                // Buscar pelo external_id OU pelo credentials.instagram_account_id
                const { data: channels, error: channelError } = await supabase
                    .from("channels")
                    .select("id, company_id, credentials, external_id")
                    .eq("type", "instagram");

                if (channelError) {
                    console.error("❌ Error fetching channels:", channelError);
                    continue;
                }

                console.log(`📋 Found ${channels?.length || 0} Instagram channels in database`);

                // Buscar o canal que tem este Instagram Account ID
                const channel = channels?.find(ch => {
                    const igIdInCreds = ch.credentials?.instagram_account_id;
                    const matchByExternalId = ch.external_id === entryId;
                    const matchByCredentials = igIdInCreds === entryId;

                    console.log(`  Checking channel ${ch.id}:`);
                    console.log(`    external_id=${ch.external_id}, match=${matchByExternalId}`);
                    console.log(`    credentials.instagram_account_id=${igIdInCreds}, match=${matchByCredentials}`);

                    return matchByExternalId || matchByCredentials;
                });

                if (!channel) {
                    console.log(`⚠️ No channel found for Instagram Account ID: ${entryId}`);
                    console.log("💡 Available channels:", channels?.map(ch => ({
                        id: ch.id,
                        external_id: ch.external_id,
                        instagram_account_id: ch.credentials?.instagram_account_id
                    })));
                    continue;
                }

                console.log("✅ Found channel:", channel.id, "for company:", channel.company_id);

                // Get a default user for the company (for user_id field)
                const { data: defaultUser } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("company_id", channel.company_id)
                    .limit(1)
                    .single();

                const defaultUserId = defaultUser?.id;
                console.log("👤 Default user for company:", defaultUserId);

                // Process messaging events
                for (const messaging of entry.messaging || []) {
                    const senderId = messaging.sender?.id;
                    const recipientId = messaging.recipient?.id;
                    const timestamp = messaging.timestamp;

                    console.log("📨 Processing message from:", senderId, "to:", recipientId);

                    // Skip if missing sender
                    if (!senderId) {
                        console.log("⚠️ Missing sender ID, skipping");
                        continue;
                    }

                    // Skip if it's our own message (sender is the Instagram account)
                    const instagramAccountId = channel.credentials?.instagram_account_id || channel.external_id;
                    if (senderId === instagramAccountId) {
                        console.log("⏭️ Skipping own message from Instagram account:", senderId);
                        continue;
                    }

                    // Get or create contact
                    let { data: contact, error: contactError } = await supabase
                        .from("contacts")
                        .select("id, name")
                        .eq("company_id", channel.company_id)
                        .eq("external_id", senderId)
                        .eq("channel_type", "instagram")
                        .maybeSingle();

                    if (contactError) {
                        console.error("❌ Error fetching contact:", contactError);
                    }

                    if (!contact) {
                        console.log("👤 Creating new contact for sender:", senderId);

                        // Fetch Instagram user profile
                        const accessToken = channel.credentials?.page_access_token;
                        let userName = `Instagram User ${senderId.slice(-4)}`;
                        let profilePic = null;

                        if (accessToken) {
                            try {
                                const profileRes = await fetch(
                                    `https://graph.facebook.com/v18.0/${senderId}?fields=name,username,profile_pic&access_token=${accessToken}`
                                );

                                const profile = await profileRes.json();

                                if (profileRes.ok) {
                                    userName = profile.name || profile.username || userName;
                                    profilePic = profile.profile_pic;
                                    console.log("📸 Got profile:", userName);
                                    if (profilePic) console.log("📷 Got profile pic:", profilePic.substring(0, 50) + "...");
                                } else {
                                    console.error("⚠️ Instagram API error:", {
                                        status: profileRes.status,
                                        error: profile.error,
                                        senderId: senderId,
                                        hasToken: !!accessToken
                                    });
                                }
                            } catch (e) {
                                console.error("⚠️ Error fetching Instagram profile:", e);
                            }
                        } else {
                            console.log("⚠️ No access token available for profile fetch");
                        }

                        const { data: newContact, error: newContactError } = await supabase
                            .from("contacts")
                            .insert({
                                company_id: channel.company_id,
                                name: userName,
                                phone_number: `ig_${senderId}`, // phone_number é obrigatório, usar ID do Instagram
                                external_id: senderId,
                                channel_type: "instagram",
                                profile_picture_url: profilePic,
                            })
                            .select("id, name")
                            .single();

                        if (newContactError) {
                            console.error("❌ Error creating contact:", newContactError);
                            continue;
                        }

                        contact = newContact;
                        console.log("✅ Created contact:", contact?.id);
                    }

                    if (!contact?.id) {
                        console.error("❌ No contact ID available, skipping message");
                        continue;
                    }

                    // Get or create conversation
                    let { data: conversation, error: convError } = await supabase
                        .from("conversations")
                        .select("id, unread_count")
                        .eq("channel_id", channel.id)
                        .eq("contact_id", contact.id)
                        .in("status", ["waiting", "active", "open", "pending"])
                        .maybeSingle();

                    if (convError) {
                        console.error("❌ Error fetching conversation:", convError);
                    }

                    if (!conversation) {
                        console.log("💬 Creating new conversation for contact:", contact.name);

                        const { data: newConv, error: newConvError } = await supabase
                            .from("conversations")
                            .insert({
                                company_id: channel.company_id,
                                user_id: defaultUserId, // obrigatório
                                channel_id: channel.id,
                                channel_type: "instagram",
                                contact_id: contact.id,
                                contact_name: contact.name || `Instagram User ${senderId.slice(-4)}`,
                                contact_number: `ig_${senderId}`,
                                external_conversation_id: senderId, // campo correto
                                status: "waiting",
                                unread_count: 0,
                            })
                            .select("id, unread_count")
                            .single();

                        if (newConvError) {
                            console.error("❌ Error creating conversation:", newConvError);
                            continue;
                        }

                        conversation = newConv;
                        console.log("✅ Created conversation:", conversation?.id);
                    }

                    if (!conversation?.id) {
                        console.error("❌ No conversation ID available, skipping message");
                        continue;
                    }

                    // Process message
                    if (messaging.message) {
                        const msg = messaging.message;
                        let content = msg.text || "";
                        let messageType = "text";
                        let mediaUrl = null;

                        // Handle attachments
                        if (msg.attachments?.length > 0) {
                            const attachment = msg.attachments[0];
                            messageType = attachment.type || "file";
                            mediaUrl = attachment.payload?.url;

                            if (!content) {
                                content = `[${messageType}]`;
                            }
                        }

                        // Handle story replies
                        if (msg.reply_to?.story) {
                            content = `[Respondeu ao story] ${content}`;
                        }

                        console.log("💾 Saving message:", content.substring(0, 50));

                        // Save message (usando campos corretos da tabela messages)
                        const { error: msgError } = await supabase.from("messages").insert({
                            conversation_id: conversation.id,
                            company_id: channel.company_id,
                            user_id: defaultUserId, // obrigatório
                            content,
                            message_type: messageType,
                            is_from_me: false, // mensagem recebida do cliente
                            external_id: msg.mid,
                            media_url: mediaUrl,
                            timestamp: new Date(timestamp).toISOString(),
                            metadata: {
                                channel_type: "instagram",
                                sender_id: senderId,
                                raw: msg,
                            },
                        });

                        if (msgError) {
                            console.error("❌ Error saving message:", msgError);
                        } else {
                            console.log("✅ Message saved");
                        }

                        // Update conversation
                        const newUnreadCount = (conversation.unread_count || 0) + 1;
                        const { error: updateError } = await supabase
                            .from("conversations")
                            .update({
                                last_message_time: new Date().toISOString(),
                                last_message: content.substring(0, 255),
                                unread_count: newUnreadCount,
                            })
                            .eq("id", conversation.id);

                        if (updateError) {
                            console.error("❌ Error updating conversation:", updateError);
                        } else {
                            console.log("✅ Conversation updated, unread:", newUnreadCount);
                        }
                    }

                    // Handle message reactions
                    if (messaging.reaction) {
                        console.log("📌 Instagram reaction:", messaging.reaction);
                    }

                    // Handle read receipts
                    if (messaging.read) {
                        console.log("👁️ Instagram read receipt");
                    }
                }
            }

            console.log("✅ Webhook processing complete");
            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        } catch (error) {
            console.error("❌ Instagram webhook error:", error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }
    }

    return new Response("Method not allowed", { status: 405 });
});
