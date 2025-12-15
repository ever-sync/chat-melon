// Facebook Messenger Send Message - Envia mensagens pelo Messenger
// Deploy: supabase functions deploy messenger-send-message

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendMessageRequest {
    conversationId: string;
    content: string;
    messageType?: "text" | "image" | "video" | "audio" | "file" | "template";
    mediaUrl?: string;
    quickReplies?: Array<{ content_type: string; title: string; payload: string }>;
    buttons?: Array<{ type: string; title: string; payload?: string; url?: string }>;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // Verify authentication
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
        if (!user) {
            return new Response(JSON.stringify({ error: "Invalid token" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const body: SendMessageRequest = await req.json();
        const { conversationId, content, messageType = "text", mediaUrl, quickReplies, buttons } = body;

        if (!conversationId || (!content && !mediaUrl)) {
            return new Response(JSON.stringify({ error: "conversationId and content/mediaUrl are required" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Get conversation with channel info
        const { data: conversation, error: convError } = await supabase
            .from("conversations")
            .select(`
        id,
        external_id,
        contact_id,
        channel:channels(
          id,
          credentials
        )
      `)
            .eq("id", conversationId)
            .single();

        if (convError || !conversation) {
            return new Response(JSON.stringify({ error: "Conversation not found" }), {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const channel = conversation.channel as any;
        const accessToken = channel?.credentials?.access_token;
        const pageId = channel?.credentials?.page_id;
        const recipientId = conversation.external_id;

        if (!accessToken || !pageId) {
            return new Response(JSON.stringify({ error: "Messenger channel not configured" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Build message payload
        let messagePayload: any = {
            recipient: { id: recipientId },
            messaging_type: "RESPONSE",
        };

        if (messageType === "text") {
            messagePayload.message = { text: content };

            // Add quick replies if provided
            if (quickReplies?.length) {
                messagePayload.message.quick_replies = quickReplies;
            }
        } else if (messageType === "image" && mediaUrl) {
            messagePayload.message = {
                attachment: {
                    type: "image",
                    payload: { url: mediaUrl, is_reusable: true },
                },
            };
        } else if (messageType === "video" && mediaUrl) {
            messagePayload.message = {
                attachment: {
                    type: "video",
                    payload: { url: mediaUrl, is_reusable: true },
                },
            };
        } else if (messageType === "audio" && mediaUrl) {
            messagePayload.message = {
                attachment: {
                    type: "audio",
                    payload: { url: mediaUrl, is_reusable: true },
                },
            };
        } else if (messageType === "file" && mediaUrl) {
            messagePayload.message = {
                attachment: {
                    type: "file",
                    payload: { url: mediaUrl, is_reusable: true },
                },
            };
        } else if (messageType === "template" && buttons?.length) {
            // Button template
            messagePayload.message = {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "button",
                        text: content,
                        buttons: buttons.map((btn) => ({
                            type: btn.type,
                            title: btn.title,
                            ...(btn.type === "postback" ? { payload: btn.payload } : {}),
                            ...(btn.type === "web_url" ? { url: btn.url } : {}),
                        })),
                    },
                },
            };
        } else {
            messagePayload.message = { text: content };
        }

        // Send message via Messenger Send API
        const response = await fetch(
            `https://graph.facebook.com/v18.0/${pageId}/messages?access_token=${accessToken}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(messagePayload),
            }
        );

        const result = await response.json();

        if (!response.ok) {
            console.error("❌ Messenger API error:", result);
            return new Response(JSON.stringify({ error: result.error?.message || "Failed to send" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Save message to database
        const { data: message, error: msgError } = await supabase
            .from("messages")
            .insert({
                conversation_id: conversationId,
                content,
                message_type: messageType,
                direction: "outgoing",
                channel_type: "messenger",
                external_id: result.message_id,
                media_url: mediaUrl,
                sender_id: user.id,
                status: "sent",
                metadata: {
                    messenger_response: result,
                    quick_replies: quickReplies,
                    buttons,
                },
            })
            .select()
            .single();

        if (msgError) {
            console.error("❌ Error saving message:", msgError);
        }

        // Update conversation
        await supabase
            .from("conversations")
            .update({
                last_message_at: new Date().toISOString(),
                last_message: content.substring(0, 255),
            })
            .eq("id", conversationId);

        console.log("✅ Messenger message sent:", result.message_id);

        return new Response(JSON.stringify({
            success: true,
            messageId: result.message_id,
            message
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("❌ Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
