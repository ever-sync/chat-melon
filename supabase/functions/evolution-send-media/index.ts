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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate input
    const requestSchema = z.object({
      conversationId: z.string().uuid(),
      mediaUrl: z.string().url().max(2048),
      mediaType: z.enum(['image', 'video', 'audio', 'document']),
      caption: z.string().max(1024).optional(),
    });
    
    const { conversationId, mediaUrl, mediaType, caption } = requestSchema.parse(await req.json());

    // Usar segredos globais
    const apiUrl = Deno.env.get('EVOLUTION_API_URL');
    const apiKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!apiUrl || !apiKey) {
      throw new Error('Evolution API não configurada no backend');
    }

    // Get evolution settings and conversation
    const { data: settings } = await supabase
      .from('evolution_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!settings) {
      throw new Error('Evolution API não configurado');
    }

    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      throw new Error('Conversa não encontrada');
    }

    // Validar que não é lista ou grupo
    if (conversation.contact_number.includes('@lid') || conversation.contact_number.includes('@g.us')) {
      throw new Error('Não é possível enviar mensagens para listas de transmissão ou grupos via este método');
    }

    const body: any = {
      number: conversation.contact_number,
      mediatype: mediaType.split('/')[0],
      media: mediaUrl,
    };

    if (caption) {
      body.caption = caption;
    }

    // Send media via Evolution API
    const response = await fetch(
      `${apiUrl}/message/sendMedia/${settings.instance_name}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
        },
        body: JSON.stringify(body),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erro ao enviar mídia');
    }
    
    // Extrair message ID da resposta
    const externalId = result?.key?.id || null;

    // Save message to database
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        company_id: conversation.company_id,
        content: caption || `[${mediaType}]`,
        is_from_me: true,
        message_type: mediaType.split('/')[0],
        media_url: mediaUrl,
        media_type: mediaType,
        status: 'sent',
        external_id: externalId,
      });

    if (messageError) {
      console.error('Erro ao salvar mensagem:', messageError);
    }

    // Update conversation last message
    await supabase
      .from('conversations')
      .update({
        last_message: caption || `[${mediaType}]`,
        last_message_time: new Date().toISOString(),
      })
      .eq('id', conversationId);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});