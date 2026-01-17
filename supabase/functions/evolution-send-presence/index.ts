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

    const { conversationId, presence } = await req.json();
    
    // Validar tipo de presença
    const validPresences = ['composing', 'recording', 'paused'];
    if (!validPresences.includes(presence)) {
      throw new Error('Presença inválida. Use: composing, recording ou paused');
    }

    // Usar segredos globais
    const apiUrl = Deno.env.get('EVOLUTION_API_URL');
    const apiKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!apiUrl || !apiKey) {
      throw new Error('Evolution API não configurada no backend');
    }

    // Buscar dados da conversa
    const { data: conversation } = await supabaseClient
      .from("conversations")
      .select("contact_number, company_id")
      .eq("id", conversationId)
      .single();

    if (!conversation) {
      throw new Error("Conversa não encontrada");
    }

    // Buscar configurações da Evolution
    const { data: settings } = await supabaseClient
      .from("evolution_settings")
      .select("*")
      .eq("company_id", conversation.company_id)
      .single();

    if (!settings || !settings.is_connected) {
      throw new Error("Instância não conectada");
    }

    const phone = conversation.contact_number.replace(/\D/g, "");

    // Enviar presença para Evolution API
    const response = await fetch(
      `${apiUrl}/chat/sendPresence/${settings.instance_name}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": apiKey,
        },
        body: JSON.stringify({
          number: phone,
          presence: presence
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        // failed to parse
      }

      // Check for connection closed error
      const isConnectionClosed = 
        (errorJson?.response?.message && Array.isArray(errorJson.response.message) && errorJson.response.message.includes("Error: Connection Closed")) ||
        (typeof errorText === 'string' && errorText.includes("Connection Closed"));

      if (isConnectionClosed) {
        console.log('Detectado erro de conexão fechada em send-presence. Atualizando status do banco....');
        await supabaseClient
          .from('evolution_settings')
          .update({ 
            is_connected: false, 
            instance_status: 'disconnected' 
          })
          .eq('instance_name', settings.instance_name);
        
        throw new Error('A conexão com o WhatsApp foi perdida. Por favor, reconecte escaneando o QR Code novamente.');
      }

      console.error("Erro ao enviar presença:", errorText);
      throw new Error(`Erro na API Evolution: ${errorJson?.error || errorText}`);
    }

    return new Response(JSON.stringify({ success: true }), {
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
