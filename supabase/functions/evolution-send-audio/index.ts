import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { conversationId, audioUrl, audioBase64 } = await req.json();

    // Buscar configurações da instância
    const { data: conversation } = await supabaseClient
      .from("conversations")
      .select("contact_id, company_id, contact_number")
      .eq("id", conversationId)
      .single();

    if (!conversation) {
      throw new Error("Conversa não encontrada");
    }

    // Usar segredos globais
    const apiUrl = Deno.env.get('EVOLUTION_API_URL');
    const apiKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!apiUrl || !apiKey) {
      throw new Error('Evolution API não configurada no backend');
    }

    const { data: settings } = await supabaseClient
      .from("evolution_settings")
      .select("*")
      .eq("company_id", conversation.company_id)
      .single();

    if (!settings || !settings.is_connected) {
      throw new Error("Instância não conectada");
    }

    const phone = conversation.contact_number.replace(/\D/g, "");

    // Preparar payload
    const payload: any = {
      number: phone,
      audioMessage: {},
      options: {
        delay: 1200,
        presence: "recording"
      }
    };

    // Usar URL ou base64
    if (audioUrl) {
      payload.audioMessage.audio = audioUrl;
    } else if (audioBase64) {
      payload.audioMessage.audio = audioBase64;
    } else {
      throw new Error("Forneça audioUrl ou audioBase64");
    }

    // Enviar para Evolution API
    const response = await fetch(
      `${apiUrl}/message/sendWhatsAppAudio/${settings.instance_name}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": apiKey,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Evolution API error: ${error}`);
    }

    const result = await response.json();

    // Extrair message ID da resposta
    const externalId = result?.key?.id || null;

    // Salvar mensagem no banco
    const { data: message } = await supabaseClient
      .from("messages")
      .insert({
        conversation_id: conversationId,
        content: "[Áudio]",
        message_type: "audio",
        media_url: audioUrl || null,
        is_from_me: true,
        status: "sent",
        company_id: conversation.company_id,
        external_id: externalId,
      })
      .select()
      .single();

    // Atualizar conversa
    await supabaseClient
      .from("conversations")
      .update({ 
        last_message_time: new Date().toISOString(),
        last_message: "🎤 Áudio"
      })
      .eq("id", conversationId);

    return new Response(JSON.stringify({ success: true, message, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
