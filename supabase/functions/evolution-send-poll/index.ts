import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
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
      question: z.string().min(1).max(255).trim(),
      options: z.array(z.string().min(1).max(100).trim()).min(2).max(12),
    });
    
    const { conversationId, question, options } = requestSchema.parse(await req.json());

    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('contact_number, company_id')
      .eq('id', conversationId)
      .maybeSingle();

    if (!conversation || convError) {
      throw new Error('Conversation not found');
    }

    // Validar que não é lista ou grupo
    if (conversation.contact_number.includes('@lid') || conversation.contact_number.includes('@g.us')) {
      throw new Error('Não é possível enviar enquetes para listas de transmissão ou grupos via este método');
    }

    // Usar segredos globais
    const apiUrl = Deno.env.get('EVOLUTION_API_URL');
    const apiKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!apiUrl || !apiKey) {
      throw new Error('Evolution API não configurada no backend');
    }

    const { data: evolutionSettings, error: settingsError } = await supabase
      .from('evolution_settings')
      .select('*')
      .eq('company_id', conversation.company_id)
      .maybeSingle();

    if (!evolutionSettings || settingsError) {
      throw new Error('Evolution API not configured');
    }

    // Enviar poll via Evolution API
    const response = await fetch(
      `${apiUrl}/message/sendPoll/${evolutionSettings.instance_name}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
        },
        body: JSON.stringify({
          number: conversation.contact_number,
          name: question,
          selectableCount: 1,
          options: options.map((opt: string) => ({ optionName: opt }))
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Evolution API error:', errorText);
      throw new Error(`Failed to send poll: ${response.statusText}`);
    }

    const result = await response.json();

    // Extrair message ID da resposta
    const externalId = result?.key?.id || null;

    // Salvar mensagem no banco
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      content: question,
      message_type: 'poll',
      is_from_me: true,
      user_id: user.id,
      company_id: conversation.company_id,
      external_id: externalId,
      poll_data: {
        question,
        options: options.map((opt: string) => ({ name: opt, votes: 0 })),
        total_votes: 0
      }
    });

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending poll:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});