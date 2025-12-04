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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { company_id } = await req.json();

    console.log('🧪 Testando chamada do N8N para company:', company_id);

    // Buscar configurações de IA
    const { data: aiSettings, error: aiError } = await supabase
      .from('ai_settings')
      .select('is_enabled, n8n_webhook_url, n8n_api_key, default_mode')
      .eq('company_id', company_id)
      .maybeSingle();

    console.log('📊 Configurações de IA:', {
      encontrado: !!aiSettings,
      is_enabled: aiSettings?.is_enabled,
      tem_url: !!aiSettings?.n8n_webhook_url,
      url: aiSettings?.n8n_webhook_url,
      erro: aiError
    });

    if (!aiSettings) {
      return new Response(
        JSON.stringify({ error: 'Configurações de IA não encontradas', aiError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    if (!aiSettings.is_enabled) {
      return new Response(
        JSON.stringify({ error: 'IA não está habilitada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!aiSettings.n8n_webhook_url) {
      return new Response(
        JSON.stringify({ error: 'URL do N8N não configurada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Tentar chamar o N8N
    console.log('🤖 Chamando N8N:', aiSettings.n8n_webhook_url);

    const testPayload = {
      test: true,
      company_id,
      message_content: 'Teste de integração N8N',
      timestamp: new Date().toISOString()
    };

    const n8nResponse = await fetch(aiSettings.n8n_webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': aiSettings.n8n_api_key || '',
        'x-company-id': company_id,
      },
      body: JSON.stringify(testPayload),
    });

    const n8nStatus = n8nResponse.status;
    const n8nBody = await n8nResponse.text();

    console.log('📥 Resposta do N8N:', {
      status: n8nStatus,
      ok: n8nResponse.ok,
      body: n8nBody.substring(0, 200)
    });

    if (n8nResponse.ok) {
      return new Response(
        JSON.stringify({
          success: true,
          message: '✅ N8N chamado com sucesso!',
          n8n_status: n8nStatus,
          n8n_response: n8nBody.substring(0, 200)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: '❌ N8N retornou erro',
          n8n_status: n8nStatus,
          n8n_response: n8nBody
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
