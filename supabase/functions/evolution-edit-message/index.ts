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
      newContent: z.string().min(1).max(4096).trim(),
    });
    
    const { messageId, newContent } = requestSchema.parse(await req.json());

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

    // Check if message is within 15 minutes
    const messageTime = new Date(message.timestamp).getTime();
    const now = new Date().getTime();
    const fifteenMinutes = 15 * 60 * 1000;

    if (now - messageTime > fifteenMinutes) {
      throw new Error('Mensagens só podem ser editadas em até 15 minutos após o envio');
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

    // Update message locally
    const { error: updateError } = await supabase
      .from('messages')
      .update({
        content: newContent,
        edited_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    if (updateError) {
      throw updateError;
    }

    // Update conversation last message if this is the last message
    await supabase
      .from('conversations')
      .update({
        last_message: newContent,
      })
      .eq('id', message.conversation_id)
      .eq('last_message', message.content);

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