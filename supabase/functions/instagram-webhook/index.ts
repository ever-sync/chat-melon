// Instagram Webhook - Recebe mensagens do Instagram DM
// Deploy: supabase functions deploy instagram-webhook
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
                return new Response("Not Instagram", { status: 200 });
            }

            const supabase = createClient(
                Deno.env.get("SUPABASE_URL")!,
                Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
            );

            // Process each entry
            for (const entry of body.entry || []) {
                const igId = entry.id; // Instagram Business Account ID

                // Find company by Instagram ID
                const { data: channel } = await supabase
                    .from("channels")
                    .select("id, company_id, credentials")
                    .eq("type", "instagram")
                    .filter("credentials->instagram_id", "eq", igId)
                    .single();

                if (!channel) {
                    console.log(`⚠️ No channel found for Instagram ID: ${igId}`);
                    continue;
                }

                // Process messaging events
                for (const messaging of entry.messaging || []) {
                    const senderId = messaging.sender.id;
                    const recipientId = messaging.recipient.id;
                    const timestamp = messaging.timestamp;

                    // Skip if it's our own message
                    if (senderId === igId) continue;

                    // Get or create contact
                    let { data: contact } = await supabase
                        .from("contacts")
                        .select("id")
                        .eq("company_id", channel.company_id)
                        .eq("external_id", senderId)
                        .eq("channel_type", "instagram")
                        .single();

                    if (!contact) {
                        // Fetch Instagram user profile
                        const accessToken = channel.credentials?.access_token;
                        let userName = `Instagram User ${senderId.slice(-4)}`;

                        try {
                            const profileRes = await fetch(
                                `https://graph.facebook.com/v18.0/${senderId}?fields=name,username,profile_pic&access_token=${accessToken}`
                            );
                            if (profileRes.ok) {
                                const profile = await profileRes.json();
                                userName = profile.name || profile.username || userName;
                            }
                        } catch (e) {
                            console.log("Could not fetch Instagram profile:", e);
                        }

                        const { data: newContact } = await supabase
                            .from("contacts")
                            .insert({
                                company_id: channel.company_id,
                                name: userName,
                                external_id: senderId,
                                channel_type: "instagram",
                                source: "instagram_dm",
                            })
                            .select()
                            .single();

                        contact = newContact;
                    }

                    // Get or create conversation
                    let { data: conversation } = await supabase
                        .from("conversations")
                        .select("id")
                        .eq("channel_id", channel.id)
                        .eq("contact_id", contact?.id)
                        .eq("status", "open")
                        .single();

                    if (!conversation) {
                        const { data: newConv } = await supabase
                            .from("conversations")
                            .insert({
                                company_id: channel.company_id,
                                channel_id: channel.id,
                                channel_type: "instagram",
                                contact_id: contact?.id,
                                external_id: senderId,
                                status: "open",
                            })
                            .select()
                            .single();

                        conversation = newConv;
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
                            messageType = attachment.type; // image, video, audio, file
                            mediaUrl = attachment.payload?.url;

                            if (!content) {
                                content = `[${messageType}]`;
                            }
                        }

                        // Handle story replies
                        if (msg.reply_to?.story) {
                            content = `[Respondeu ao story] ${content}`;
                        }

                        // Save message
                        await supabase.from("messages").insert({
                            conversation_id: conversation?.id,
                            contact_id: contact?.id,
                            content,
                            message_type: messageType,
                            direction: "incoming",
                            channel_type: "instagram",
                            external_id: msg.mid,
                            media_url: mediaUrl,
                            metadata: {
                                timestamp,
                                raw: msg,
                            },
                        });

                        // Update conversation
                        await supabase
                            .from("conversations")
                            .update({
                                last_message_at: new Date().toISOString(),
                                last_message: content.substring(0, 255),
                                unread_count: supabase.rpc("increment_unread", { conv_id: conversation?.id }),
                            })
                            .eq("id", conversation?.id);
                    }

                    // Handle message reactions
                    if (messaging.reaction) {
                        console.log("📌 Instagram reaction:", messaging.reaction);
                        // Could update message with reaction info
                    }

                    // Handle read receipts
                    if (messaging.read) {
                        console.log("👁️ Instagram read receipt");
                    }
                }
            }

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
