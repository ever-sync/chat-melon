import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TranscriptionRequest {
  messageId: string;
  audioUrl: string;
  language?: string;
  provider?: 'groq' | 'openai';
}

interface GroqTranscriptionResponse {
  text: string;
  language?: string;
  duration?: number;
  segments?: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { messageId, audioUrl, language = 'pt', provider = 'groq' }: TranscriptionRequest = await req.json();

    console.log(`Starting transcription for message ${messageId}`);

    // Update status to processing
    await supabase
      .from("messages")
      .update({ transcription_status: "processing" })
      .eq("id", messageId);

    // Download audio file
    console.log(`Downloading audio from: ${audioUrl}`);
    const audioResponse = await fetch(audioUrl);

    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.statusText}`);
    }

    const audioBlob = await audioResponse.blob();

    // Convert blob to array buffer for Groq API
    const audioBuffer = await audioBlob.arrayBuffer();
    const audioFile = new File([audioBuffer], "audio.ogg", { type: audioBlob.type });

    let transcription: GroqTranscriptionResponse;

    if (provider === 'groq') {
      transcription = await transcribeWithGroq(audioFile, language);
    } else if (provider === 'openai') {
      transcription = await transcribeWithOpenAI(audioFile, language);
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    console.log(`Transcription completed: ${transcription.text.substring(0, 100)}...`);

    // Update message with transcription
    const { error: updateError } = await supabase
      .from("messages")
      .update({
        audio_transcription: transcription.text,
        transcription_status: "completed",
        transcription_language: transcription.language || language,
        transcription_duration: transcription.duration,
        transcription_provider: provider,
      })
      .eq("id", messageId);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        transcription: transcription.text,
        language: transcription.language,
        duration: transcription.duration,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Transcription error:", error);

    // Update status to failed if we have a messageId
    try {
      const { messageId } = await req.json();
      if (messageId) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        await supabase
          .from("messages")
          .update({ transcription_status: "failed" })
          .eq("id", messageId);
      }
    } catch (e) {
      console.error("Failed to update error status:", e);
    }

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

async function transcribeWithGroq(
  audioFile: File,
  language: string
): Promise<GroqTranscriptionResponse> {
  const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY not configured");
  }

  const formData = new FormData();
  formData.append("file", audioFile);
  formData.append("model", "whisper-large-v3");
  formData.append("response_format", "verbose_json");

  // Set language if not auto-detect
  if (language && language !== 'auto') {
    formData.append("language", language);
  }

  const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  return {
    text: result.text,
    language: result.language,
    duration: result.duration,
    segments: result.segments,
  };
}

async function transcribeWithOpenAI(
  audioFile: File,
  language: string
): Promise<GroqTranscriptionResponse> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const formData = new FormData();
  formData.append("file", audioFile);
  formData.append("model", "whisper-1");
  formData.append("response_format", "verbose_json");

  if (language && language !== 'auto') {
    formData.append("language", language);
  }

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  return {
    text: result.text,
    language: result.language,
    duration: result.duration,
    segments: result.segments,
  };
}
