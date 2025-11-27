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
    const { proposalId, clientName, clientDocument, signatureData } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Buscar proposta com deal
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select(`
        *,
        deals (
          id,
          pipeline_id,
          company_id,
          assigned_to,
          contact_id,
          title,
          contacts (
            name
          )
        )
      `)
      .eq('id', proposalId)
      .single();

    if (proposalError) throw proposalError;

    // Atualizar proposta
    await supabase
      .from('proposals')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        client_name: clientName,
        client_document: clientDocument,
        signature_data: signatureData,
      })
      .eq('id', proposalId);

    // Buscar stage de "Fechado Ganho"
    const { data: wonStage } = await supabase
      .from('pipeline_stages')
      .select('id')
      .eq('pipeline_id', proposal.deals.pipeline_id)
      .eq('is_closed_won', true)
      .single();

    // Mover deal para Fechado Ganho
    if (wonStage) {
      await supabase
        .from('deals')
        .update({
          stage_id: wonStage.id,
          status: 'won',
          won_at: new Date().toISOString(),
        })
        .eq('id', proposal.deal_id);

      // Registrar atividade
      await supabase.from('deal_activities').insert({
        deal_id: proposal.deal_id,
        user_id: proposal.deals.assigned_to,
        activity_type: 'won',
        description: `Proposta aprovada por ${clientName}`,
        metadata: { proposal_id: proposalId },
      });
    }

    // Criar notificação para vendedor
    if (proposal.deals.assigned_to) {
      await supabase.rpc('create_notification', {
        p_user_id: proposal.deals.assigned_to,
        p_company_id: proposal.deals.company_id,
        p_title: '🎉 Proposta Aprovada!',
        p_message: `${proposal.deals.contacts.name} aprovou a proposta de ${formatCurrency(proposal.total)}!`,
        p_type: 'success',
        p_entity_type: 'proposal',
        p_entity_id: proposalId,
        p_action_url: '/proposals',
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error approving proposal:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
