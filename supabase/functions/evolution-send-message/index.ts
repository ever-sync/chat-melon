import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Validate input
    const requestSchema = z.object({
      conversationId: z.string().uuid(),
      message: z.string().min(1).max(4096).trim(),
    });
    
    const { conversationId, message } = requestSchema.parse(await req.json());

    // Usar segredos globais
    const apiUrl = Deno.env.get('EVOLUTION_API_URL');
    const apiKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!apiUrl || !apiKey) {
      return new Response(
        JSON.stringify({ error: 'Evolution API não configurada no backend' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: settings, error: settingsError } = await supabase
      .from('evolution_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (settingsError || !settings) {
      return new Response(
        JSON.stringify({ error: 'Configurações da API Evolution não encontradas' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se a instância está conectada
    if (settings.instance_status !== 'connected' || !settings.is_connected) {
      return new Response(
        JSON.stringify({ 
          error: 'Instância WhatsApp não está conectada. Por favor, escaneie o QR Code.',
          needsConnection: true,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      throw new Error('Conversa não encontrada');
    }

    const evolutionResponse = await fetch(
      `${apiUrl}/message/sendText/${settings.instance_name}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
        },
        body: JSON.stringify({
          number: conversation.contact_number,
          text: message,
        }),
      }
    );

    if (!evolutionResponse.ok) {
      const errorText = await evolutionResponse.text();
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
        console.log('Detectado erro de conexão fechada. Atualizando status do banco....');
        await supabase
          .from('evolution_settings')
          .update({ 
            is_connected: false, 
            instance_status: 'disconnected' 
          })
          .eq('instance_name', settings.instance_name);
          
        throw new Error('A conexão com o WhatsApp foi perdida. Por favor, reconecte escaneando o QR Code novamente.');
      }

      throw new Error(`Erro na API Evolution: ${errorJson?.error || errorText}`);
    }

    const evolutionData = await evolutionResponse.json();
    
    // Extrair message ID da resposta
    const externalId = evolutionData?.key?.id || null;

    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        company_id: conversation.company_id,
        content: message,
        is_from_me: true,
        status: 'sent',
        external_id: externalId,
      });

    if (messageError) {
      console.error('Erro ao salvar mensagem:', messageError);
    }

    await supabase
      .from('conversations')
      .update({
        last_message: message,
        last_message_time: new Date().toISOString(),
      })
      .eq('id', conversationId);

    return new Response(
      JSON.stringify({ success: true, data: evolutionData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});