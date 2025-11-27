import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { conversation_id } = await req.json();

    console.log('Enviando pesquisa de satisfação para conversa:', conversation_id);

    // Buscar conversa e configurações
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*, contacts(id)')
      .eq('id', conversation_id)
      .single();

    if (!conversation || !conversation.company_id) {
      throw new Error('Conversa não encontrada');
    }

    const { data: settings } = await supabase
      .from('satisfaction_settings')
      .select('*')
      .eq('company_id', conversation.company_id)
      .maybeSingle();

    if (!settings || !settings.enabled) {
      console.log('Pesquisas de satisfação desabilitadas');
      return new Response(
        JSON.stringify({ message: 'Pesquisas desabilitadas' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se já enviou pesquisa para esta conversa
    const { data: existing } = await supabase
      .from('satisfaction_surveys')
      .select('id')
      .eq('conversation_id', conversation_id)
      .maybeSingle();

    if (existing) {
      console.log('Pesquisa já enviada para esta conversa');
      return new Response(
        JSON.stringify({ message: 'Pesquisa já enviada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar registro da pesquisa
    const { data: survey, error: surveyError } = await supabase
      .from('satisfaction_surveys')
      .insert({
        company_id: conversation.company_id,
        conversation_id: conversation.id,
        contact_id: conversation.contacts?.id || null,
        assigned_to: conversation.assigned_to,
        survey_type: settings.survey_type,
        status: 'sent',
      })
      .select()
      .single();

    if (surveyError) throw surveyError;

    // Montar mensagem
    let message = settings.custom_message;
    
    if (!message) {
      if (settings.survey_type === 'csat') {
        message = `Como você avalia nosso atendimento?

Responda com um número de 1 a 5:
⭐ 1 - Muito ruim
⭐⭐ 2 - Ruim  
⭐⭐⭐ 3 - Regular
⭐⭐⭐⭐ 4 - Bom
⭐⭐⭐⭐⭐ 5 - Excelente`;
      } else {
        message = `De 0 a 10, o quanto você recomendaria nossa empresa?

Responda com um número:
0 - Nunca recomendaria
...
10 - Com certeza recomendaria`;
      }
    }

    // Enviar via WhatsApp
    const { error: sendError } = await supabase.functions.invoke(
      'evolution-send-message',
      {
        body: {
          conversationId: conversation.id,
          message,
        },
      }
    );

    if (sendError) {
      console.error('Erro ao enviar pesquisa:', sendError);
      throw sendError;
    }

    console.log('Pesquisa enviada com sucesso:', survey.id);

    return new Response(
      JSON.stringify({ success: true, survey_id: survey.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
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
