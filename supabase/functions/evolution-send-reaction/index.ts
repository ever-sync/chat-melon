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
      messageKey: z.object({
        remoteJid: z.string(),
        fromMe: z.boolean(),
        id: z.string(),
      }),
      reaction: z.string().max(10),
    });
    
    const { conversationId, messageKey, reaction } = requestSchema.parse(await req.json());

    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('contact_number, company_id')
      .eq('id', conversationId)
      .maybeSingle();

    if (!conversation || convError) {
      throw new Error('Conversation not found');
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

    const response = await fetch(
      `${apiUrl}/message/sendReaction/${evolutionSettings.instance_name}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
        },
        body: JSON.stringify({
          number: conversation.contact_number,
          key: messageKey,
          reaction
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Evolution API error:', errorText);
      throw new Error(`Failed to send reaction: ${response.statusText}`);
    }

    const result = await response.json();

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending reaction:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});