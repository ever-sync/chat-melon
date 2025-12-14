import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  type: string;
  table: string;
  record: any;
  schema: string;
  old_record: any;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload: WebhookPayload = await req.json();

    // Only process INSERT events for messages table
    if (payload.type !== "INSERT" || payload.table !== "messages") {
      return new Response(
        JSON.stringify({ message: "Not a message insert event" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const message = payload.record;

    // Check if message is audio type
    const isAudioMessage = message.type === "audio" || message.media_type?.startsWith("audio/");

    if (!isAudioMessage || !message.media_url) {
      return new Response(
        JSON.stringify({ message: "Not an audio message or no media URL" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`New audio message detected: ${message.id}`);

    // Get conversation to find company_id
    const { data: conversation } = await supabase
      .from("conversations")
      .select("company_id")
      .eq("id", message.conversation_id)
      .single();

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Get transcription config for the company
    const { data: config } = await supabase
      .from("transcription_configs")
      .select("*")
      .eq("company_id", conversation.company_id)
      .single();

    // If auto_transcribe is disabled, skip
    if (!config || !config.auto_transcribe) {
      console.log(`Auto-transcribe disabled for company ${conversation.company_id}`);
      return new Response(
        JSON.stringify({ message: "Auto-transcribe disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Triggering transcription for message ${message.id}`);

    // Mark as pending first
    await supabase
      .from("messages")
      .update({ transcription_status: "pending" })
      .eq("id", message.id);

    // Call transcribe-audio function
    const transcribeUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/transcribe-audio`;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    const transcribeResponse = await fetch(transcribeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        messageId: message.id,
        audioUrl: message.media_url,
        language: config.language || 'pt',
        provider: config.provider || 'groq',
      }),
    });

    const transcribeResult = await transcribeResponse.json();

    if (!transcribeResult.success) {
      console.error(`Transcription failed: ${transcribeResult.error}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Transcription triggered",
        transcription: transcribeResult,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Auto-transcribe webhook error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
