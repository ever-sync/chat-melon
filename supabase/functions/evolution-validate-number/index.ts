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
      number: z.string().regex(/^\d{10,15}$/, 'Invalid phone number format'),
    });
    
    const { number } = requestSchema.parse(await req.json());

    // Usar segredos globais
    const apiUrl = Deno.env.get('EVOLUTION_API_URL');
    const apiKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!apiUrl || !apiKey) {
      throw new Error('Evolution API não configurada no backend');
    }

    // Get evolution settings
    const { data: settings } = await supabase
      .from('evolution_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!settings || !settings.is_connected) {
      throw new Error('Evolution API não configurado ou não conectado');
    }

    // Validate number via Evolution API
    const response = await fetch(
      `${apiUrl}/chat/whatsappNumbers/${settings.instance_name}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
        },
        body: JSON.stringify({
          numbers: [number]
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erro ao validar número');
    }

    // Check if number exists on WhatsApp
    const isValid = result && result.length > 0 && result[0].exists;

    return new Response(JSON.stringify({ 
      valid: isValid,
      number: result[0]?.jid || number,
      data: result[0]
    }), {
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