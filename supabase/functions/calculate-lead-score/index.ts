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
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { contactId } = await req.json();

    if (!contactId) {
      throw new Error('Contact ID is required');
    }

    console.log('Calculating lead score for contact:', contactId);

    // Get contact with related data
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select(`
        *,
        company_id
      `)
      .eq('id', contactId)
      .single();

    if (contactError) throw contactError;

    // Get active scoring rules for company
    const { data: rules, error: rulesError } = await supabase
      .from('scoring_rules')
      .select('*')
      .eq('company_id', contact.company_id)
      .eq('is_active', true);

    if (rulesError) throw rulesError;

    let totalScore = 0;
    const breakdown: Record<string, number> = {};

    for (const rule of rules) {
      let applies = false;
      let points = 0;

      switch (rule.condition_type) {
        case 'has_email':
          if (contact.enrichment_data?.email || contact.phone_number?.includes('@')) {
            applies = true;
            points = rule.points;
          }
          break;

        case 'has_company':
          if (contact.enrichment_data?.company || contact.company_data?.razao_social) {
            applies = true;
            points = rule.points;
          }
          break;

        case 'response_time': {
          // Get last 2 messages from contact
          const { data: messages } = await supabase
            .from('messages')
            .select('timestamp, is_from_me')
            .eq('conversation_id', (await supabase
              .from('conversations')
              .select('id')
              .eq('contact_id', contactId)
              .single()).data?.id || '')
            .order('timestamp', { ascending: false })
            .limit(2);

          if (messages && messages.length >= 2) {
            const responseTime = new Date(messages[0].timestamp).getTime() - 
                                new Date(messages[1].timestamp).getTime();
            const maxMinutes = parseInt(rule.condition_value || '60');
            if (responseTime < maxMinutes * 60 * 1000) {
              applies = true;
              points = rule.points;
            }
          }
          break;
        }

        case 'messages_count': {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', (await supabase
              .from('conversations')
              .select('id')
              .eq('contact_id', contactId)
              .single()).data?.id || '');

          const minCount = parseInt(rule.condition_value || '5');
          if (count && count >= minCount) {
            applies = true;
            points = rule.points;
          }
          break;
        }

        case 'has_open_deal': {
          const { data: deals } = await supabase
            .from('deals')
            .select('id')
            .eq('contact_id', contactId)
            .eq('status', 'open');

          if (deals && deals.length > 0) {
            applies = true;
            points = rule.points;
          }
          break;
        }

        case 'deal_value': {
          const { data: deals } = await supabase
            .from('deals')
            .select('value')
            .eq('contact_id', contactId)
            .eq('status', 'open');

          const minValue = parseFloat(rule.condition_value || '5000');
          if (deals && deals.some(d => (d.value || 0) >= minValue)) {
            applies = true;
            points = rule.points;
          }
          break;
        }

        case 'days_inactive': {
          // Get last conversation activity
          const { data: conversation } = await supabase
            .from('conversations')
            .select('last_message_time')
            .eq('contact_id', contactId)
            .order('last_message_time', { ascending: false })
            .limit(1)
            .single();

          if (conversation?.last_message_time) {
            const daysSinceLastMessage = Math.floor(
              (Date.now() - new Date(conversation.last_message_time).getTime()) / 
              (1000 * 60 * 60 * 24)
            );
            const inactiveDays = parseInt(rule.condition_value || '7');
            if (daysSinceLastMessage >= inactiveDays) {
              applies = true;
              points = rule.points;
            }
          }
          break;
        }
      }

      if (applies) {
        breakdown[rule.name] = points;
        totalScore += points;
      }
    }

    // Update contact with new score
    const { error: updateError } = await supabase
      .from('contacts')
      .update({
        lead_score: Math.max(0, totalScore), // Minimum 0
        score_breakdown: breakdown,
        score_updated_at: new Date().toISOString(),
      })
      .eq('id', contactId);

    if (updateError) throw updateError;

    console.log('Lead score calculated:', { contactId, score: totalScore, breakdown });

    return new Response(
      JSON.stringify({ 
        success: true, 
        score: Math.max(0, totalScore),
        breakdown 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error calculating lead score:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});