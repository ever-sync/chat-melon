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
    // Get auth header
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Decode JWT to get user ID (the token was already validated by Supabase infra)
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Invalid token - no user ID' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User ID from JWT:', userId);

    // Validate input
    const requestSchema = z.object({
      number: z.string().regex(/^\d{10,15}$/, 'Invalid phone number format'),
      type: z.enum(['voice', 'video']),
    });

    const { number, type } = requestSchema.parse(await req.json());

    // Use service role to access database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get evolution settings for this user
    const { data: settings, error: settingsError } = await supabase
      .from('evolution_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!settings || settingsError) {
      console.log('Settings error:', settingsError?.message);
      throw new Error('Evolution API não configurado para este usuário');
    }

    if (!settings.is_connected) {
      throw new Error('Instância Evolution API não está conectada');
    }

    // Use env vars for Evolution API
    const apiUrl = Deno.env.get('EVOLUTION_API_URL');
    const apiKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!apiUrl || !apiKey) {
      throw new Error('Evolution API não configurada no backend');
    }

    console.log('Calling Evolution API:', `${apiUrl}/call/offer/${settings.instance_name}`);

    // Call Evolution API to initiate call
    const response = await fetch(
      `${apiUrl}/call/offer/${settings.instance_name}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
        },
        body: JSON.stringify({
          number: number,
          isVideo: type === 'video',
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Evolution API error:', errorText);
      throw new Error(`Falha ao iniciar chamada: ${response.statusText}`);
    }

    const result = await response.json();

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error initiating call:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});