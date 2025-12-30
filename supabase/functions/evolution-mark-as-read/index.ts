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

    const { conversationId, messageIds } = await req.json();

    // Usar segredos globais
    const apiUrl = Deno.env.get('EVOLUTION_API_URL');
    const apiKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!apiUrl || !apiKey) {
      throw new Error('Evolution API não configurada no backend');
    }

    // Buscar conversa
    const { data: conversation } = await supabaseClient
      .from("conversations")
      .select("contact_number, company_id")
      .eq("id", conversationId)
      .single();

    if (!conversation) {
      throw new Error("Conversa não encontrada");
    }

    const { data: settings } = await supabaseClient
      .from("evolution_settings")
      .select("*")
      .eq("company_id", conversation.company_id)
      .maybeSingle();

    // Se não houver settings, ainda assim atualiza o banco local
    const canCallEvolutionApi = settings && settings.is_connected && settings.instance_name;

    if (!canCallEvolutionApi) {
      console.log("⚠️ Instância não conectada ou não configurada, apenas atualizando banco local");
    }

    // Buscar mensagens não lidas
    let query = supabaseClient
      .from("messages")
      .select("id, external_id, is_from_me")
      .eq("conversation_id", conversationId)
      .eq("is_from_me", false)
      .neq("status", "read");

    if (messageIds && messageIds.length > 0) {
      query = query.in("id", messageIds);
    }

    const { data: messages } = await query;

    if (!messages || messages.length === 0) {
      // Mesmo sem mensagens para marcar, zerar o contador
      await supabaseClient
        .from("conversations")
        .update({ unread_count: 0 })
        .eq("id", conversationId);

      return new Response(JSON.stringify({ success: true, marked: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const phone = conversation.contact_number.replace(/\D/g, "");
    const remoteJid = `${phone}@s.whatsapp.net`;

    // Preparar mensagens para marcar como lidas (usar external_id para Evolution API)
    const readMessages = messages
      .filter(msg => msg.external_id) // Só mensagens com external_id
      .map(msg => ({
        remoteJid,
        fromMe: false,
        id: msg.external_id
      }));

    // Enviar para Evolution API (apenas se houver mensagens com external_id E instância conectada)
    if (readMessages.length > 0 && canCallEvolutionApi) {
      try {
        const response = await fetch(
          `${apiUrl}/chat/markMessageAsRead/${settings!.instance_name}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "apikey": apiKey,
            },
            body: JSON.stringify({ read_messages: readMessages }),
          }
        );

        if (!response.ok) {
          const error = await response.text();
          console.error("⚠️ Erro ao marcar como lido na Evolution API:", error);
        } else {
          console.log(`✅ ${readMessages.length} mensagens marcadas como lidas na Evolution API`);
        }
      } catch (evolutionError) {
        console.error("⚠️ Erro ao chamar Evolution API:", evolutionError);
        // Continua para atualizar o banco local mesmo se Evolution falhar
      }
    }

    // Atualizar status no banco local
    const { error: updateMessagesError } = await supabaseClient
      .from("messages")
      .update({ status: "read" })
      .in("id", messages.map(m => m.id));

    if (updateMessagesError) {
      console.error("❌ Erro ao atualizar mensagens:", updateMessagesError);
    } else {
      console.log(`✅ ${messages.length} mensagens atualizadas para 'read' no banco`);
    }

    // Atualizar contador de não lidas na conversa
    const { error: updateConvError } = await supabaseClient
      .from("conversations")
      .update({ unread_count: 0 })
      .eq("id", conversationId);

    if (updateConvError) {
      console.error("❌ Erro ao zerar unread_count:", updateConvError);
    } else {
      console.log(`✅ unread_count zerado para conversa ${conversationId}`);
    }

    return new Response(JSON.stringify({ success: true, marked: messages.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
