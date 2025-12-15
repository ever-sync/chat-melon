// Facebook Messenger Webhook - Recebe mensagens do Messenger
// Deploy: supabase functions deploy messenger-webhook
// Docs: https://developers.facebook.com/docs/messenger-platform/webhooks

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VERIFY_TOKEN = Deno.env.get("META_VERIFY_TOKEN") || "melon_chat_verify_token";

serve(async (req) => {
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
            console.log("✅ Messenger webhook verified");
            return new Response(challenge, { status: 200 });
        } else {
            console.error("❌ Messenger webhook verification failed");
            return new Response("Forbidden", { status: 403 });
        }
    }

    // Handle incoming messages (POST request)
    if (req.method === "POST") {
        try {
            const body = await req.json();
            console.log("📥 Messenger webhook received:", JSON.stringify(body));

            // Validate it's from Messenger
            if (body.object !== "page") {
                return new Response("Not Page", { status: 200 });
            }

            const supabase = createClient(
                Deno.env.get("SUPABASE_URL")!,
                Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
            );

            // Process each entry
            for (const entry of body.entry || []) {
                const pageId = entry.id; // Facebook Page ID

                // Find company by Page ID
                const { data: channel } = await supabase
                    .from("channels")
                    .select("id, company_id, credentials")
                    .eq("type", "messenger")
                    .filter("credentials->page_id", "eq", pageId)
                    .single();

                if (!channel) {
                    console.log(`⚠️ No channel found for Page ID: ${pageId}`);
                    continue;
                }

                // Process messaging events
                for (const messaging of entry.messaging || []) {
                    const senderId = messaging.sender.id;
                    const recipientId = messaging.recipient.id;
                    const timestamp = messaging.timestamp;

                    // Skip if it's our own message (from the page)
                    if (senderId === pageId) continue;

                    // Get or create contact
                    let { data: contact } = await supabase
                        .from("contacts")
                        .select("id, name")
                        .eq("company_id", channel.company_id)
                        .eq("external_id", senderId)
                        .eq("channel_type", "messenger")
                        .single();

                    if (!contact) {
                        // Fetch Facebook user profile
                        const accessToken = channel.credentials?.access_token;
                        let userName = `Messenger User ${senderId.slice(-4)}`;
                        let profilePic = null;

                        try {
                            const profileRes = await fetch(
                                `https://graph.facebook.com/v18.0/${senderId}?fields=first_name,last_name,profile_pic&access_token=${accessToken}`
                            );
                            if (profileRes.ok) {
                                const profile = await profileRes.json();
                                userName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || userName;
                                profilePic = profile.profile_pic;
                            }
                        } catch (e) {
                            console.log("Could not fetch Messenger profile:", e);
                        }

                        const { data: newContact } = await supabase
                            .from("contacts")
                            .insert({
                                company_id: channel.company_id,
                                name: userName,
                                external_id: senderId,
                                channel_type: "messenger",
                                source: "facebook_messenger",
                                profile_picture_url: profilePic,
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
                                channel_type: "messenger",
                                contact_id: contact?.id,
                                external_id: senderId,
                                status: "open",
                            })
                            .select()
                            .single();

                        conversation = newConv;
                    }

                    // Process text message
                    if (messaging.message) {
                        const msg = messaging.message;
                        let content = msg.text || "";
                        let messageType = "text";
                        let mediaUrl = null;

                        // Handle attachments
                        if (msg.attachments?.length > 0) {
                            const attachment = msg.attachments[0];
                            messageType = attachment.type; // image, video, audio, file, location, fallback

                            if (attachment.type === "location") {
                                const loc = attachment.payload.coordinates;
                                content = `📍 Localização: ${loc.lat}, ${loc.long}`;
                            } else if (attachment.type === "fallback") {
                                content = attachment.title || "[Conteúdo não suportado]";
                                mediaUrl = attachment.url;
                            } else {
                                mediaUrl = attachment.payload?.url;
                                if (!content) {
                                    content = `[${messageType}]`;
                                }
                            }
                        }

                        // Handle stickers
                        if (msg.sticker_id) {
                            messageType = "sticker";
                            content = `[Sticker: ${msg.sticker_id}]`;
                        }

                        // Handle quick reply
                        if (msg.quick_reply) {
                            content = `${content} [Quick Reply: ${msg.quick_reply.payload}]`;
                        }

                        // Save message
                        await supabase.from("messages").insert({
                            conversation_id: conversation?.id,
                            contact_id: contact?.id,
                            content,
                            message_type: messageType,
                            direction: "incoming",
                            channel_type: "messenger",
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
                            })
                            .eq("id", conversation?.id);
                    }

                    // Handle postback (button clicks)
                    if (messaging.postback) {
                        console.log("📌 Messenger postback:", messaging.postback);
                        const content = `[Botão: ${messaging.postback.title}] ${messaging.postback.payload}`;

                        await supabase.from("messages").insert({
                            conversation_id: conversation?.id,
                            contact_id: contact?.id,
                            content,
                            message_type: "postback",
                            direction: "incoming",
                            channel_type: "messenger",
                            metadata: { postback: messaging.postback },
                        });
                    }

                    // Handle referral (m.me links, ads)
                    if (messaging.referral) {
                        console.log("🔗 Messenger referral:", messaging.referral);
                    }

                    // Handle read receipts
                    if (messaging.read) {
                        console.log("👁️ Messenger read receipt at:", messaging.read.watermark);
                    }

                    // Handle message deliveries
                    if (messaging.delivery) {
                        console.log("📬 Messenger delivery confirmation");
                    }
                }
            }

            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        } catch (error) {
            console.error("❌ Messenger webhook error:", error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }
    }

    return new Response("Method not allowed", { status: 405 });
});
