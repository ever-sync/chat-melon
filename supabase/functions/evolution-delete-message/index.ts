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
      messageId: z.string().uuid(),
      deleteForEveryone: z.boolean().optional(),
    });
    
    const { messageId, deleteForEveryone } = requestSchema.parse(await req.json());

    // Get message and verify ownership
    const { data: message } = await supabase
      .from('messages')
      .select('*, conversations(*)')
      .eq('id', messageId)
      .eq('user_id', user.id)
      .eq('is_from_me', true)
      .single();

    if (!message) {
      throw new Error('Mensagem não encontrada ou você não tem permissão');
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

    // Mark message as deleted
    const { error: updateError } = await supabase
      .from('messages')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_for_everyone: deleteForEveryone,
        content: deleteForEveryone ? '[Mensagem apagada]' : message.content,
      })
      .eq('id', messageId);

    if (updateError) {
      throw updateError;
    }

    return new Response(JSON.stringify({ success: true }), {
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