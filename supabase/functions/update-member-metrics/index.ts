import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Starting metrics update...");
    const today = new Date().toISOString().split('T')[0];

    // Buscar todas as empresas ativas
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id')
      .eq('is_active', true);

    if (companiesError) {
      console.error("Error fetching companies:", companiesError);
      throw companiesError;
    }

    console.log(`Processing ${companies?.length || 0} companies`);

    for (const company of companies || []) {
      console.log(`Processing company ${company.id}`);
      
      // Buscar membros ativos
      const { data: members, error: membersError } = await supabase
        .from('company_members')
        .select('id, user_id')
        .eq('company_id', company.id)
        .eq('is_active', true);

      if (membersError) {
        console.error(`Error fetching members for company ${company.id}:`, membersError);
        continue;
      }

      console.log(`Processing ${members?.length || 0} members for company ${company.id}`);

      for (const member of members || []) {
        console.log(`Processing member ${member.id}`);
        
        try {
          // 1. Métricas de Chat
          const { data: conversations, error: convError } = await supabase
            .from('conversations')
            .select('id, status, created_at, last_message_time')
            .eq('company_id', company.id)
            .eq('assigned_to', member.user_id)
            .gte('created_at', `${today}T00:00:00`)
            .lte('created_at', `${today}T23:59:59`);

          if (convError) {
            console.error(`Error fetching conversations for member ${member.id}:`, convError);
          }

          const conversationsAssigned = conversations?.length || 0;
          const conversationsResolved = conversations?.filter(c => c.status === 'resolved').length || 0;
          
          // Calcular tempo de primeira resposta
          let avgFirstResponseTime = 0;
          if (conversations && conversations.length > 0) {
            const responseTimes = [];
            for (const conv of conversations) {
              // Buscar primeira mensagem enviada pelo membro nesta conversa
              const { data: firstResponse } = await supabase
                .from('messages')
                .select('timestamp')
                .eq('conversation_id', conv.id)
                .eq('is_from_me', true)
                .order('timestamp', { ascending: true })
                .limit(1);

              if (firstResponse && firstResponse.length > 0) {
                const created = new Date(conv.created_at).getTime();
                const responded = new Date(firstResponse[0].timestamp).getTime();
                const diff = (responded - created) / 1000; // em segundos
                if (diff > 0) responseTimes.push(diff);
              }
            }
            
            if (responseTimes.length > 0) {
              avgFirstResponseTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
            }
          }

          // 2. Mensagens enviadas
          const { count: messagesSent, error: msgError } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('company_id', company.id)
            .eq('user_id', member.user_id)
            .eq('is_from_me', true)
            .gte('created_at', `${today}T00:00:00`)
            .lte('created_at', `${today}T23:59:59`);

          if (msgError) {
            console.error(`Error counting messages for member ${member.id}:`, msgError);
          }

          // 3. Métricas de Deals
          const { data: dealsCreated, error: dealsCreatedError } = await supabase
            .from('deals')
            .select('id')
            .eq('company_id', company.id)
            .eq('assigned_to', member.user_id)
            .gte('created_at', `${today}T00:00:00`)
            .lte('created_at', `${today}T23:59:59`);

          if (dealsCreatedError) {
            console.error(`Error fetching created deals for member ${member.id}:`, dealsCreatedError);
          }

          const { data: dealsWon, error: dealsWonError } = await supabase
            .from('deals')
            .select('id, value')
            .eq('company_id', company.id)
            .eq('assigned_to', member.user_id)
            .eq('status', 'won')
            .gte('won_at', `${today}T00:00:00`)
            .lte('won_at', `${today}T23:59:59`);

          if (dealsWonError) {
            console.error(`Error fetching won deals for member ${member.id}:`, dealsWonError);
          }

          const { data: dealsLost, error: dealsLostError } = await supabase
            .from('deals')
            .select('id, value')
            .eq('company_id', company.id)
            .eq('assigned_to', member.user_id)
            .eq('status', 'lost')
            .gte('lost_at', `${today}T00:00:00`)
            .lte('lost_at', `${today}T23:59:59`);

          if (dealsLostError) {
            console.error(`Error fetching lost deals for member ${member.id}:`, dealsLostError);
          }

          const dealsValueWon = dealsWon?.reduce((acc, d) => acc + (Number(d.value) || 0), 0) || 0;
          const dealsValueLost = dealsLost?.reduce((acc, d) => acc + (Number(d.value) || 0), 0) || 0;

          // 4. Contatos criados (se houver campo created_by no futuro)
          // Por enquanto, deixar como 0
          const contactsCreated = 0;

          // 5. Satisfação (quando implementado)
          const csatResponses = 0;
          const csatSum = 0;
          const npsPromoters = 0;
          const npsPassives = 0;
          const npsDetractors = 0;

          // Upsert métricas
          const { error: upsertError } = await supabase
            .from('member_metrics_daily')
            .upsert({
              member_id: member.id,
              company_id: company.id,
              metric_date: today,
              conversations_assigned: conversationsAssigned,
              conversations_resolved: conversationsResolved,
              messages_sent: messagesSent || 0,
              avg_first_response_time: avgFirstResponseTime,
              avg_response_time: avgFirstResponseTime,
              contacts_created: contactsCreated,
              deals_created: dealsCreated?.length || 0,
              deals_won: dealsWon?.length || 0,
              deals_lost: dealsLost?.length || 0,
              deals_value_won: dealsValueWon,
              deals_value_lost: dealsValueLost,
              csat_responses: csatResponses,
              csat_sum: csatSum,
              nps_promoters: npsPromoters,
              nps_passives: npsPassives,
              nps_detractors: npsDetractors,
            }, {
              onConflict: 'member_id,metric_date',
            });

          if (upsertError) {
            console.error(`Error upserting metrics for member ${member.id}:`, upsertError);
          } else {
            console.log(`Successfully updated metrics for member ${member.id}`);
          }

          // Atualizar progresso das metas
          const { data: goals, error: goalsError } = await supabase
            .from('sales_goals')
            .select('id, goal_type, goal_value')
            .eq('member_id', member.id)
            .lte('period_start', today)
            .gte('period_end', today);

          if (goalsError) {
            console.error(`Error fetching goals for member ${member.id}:`, goalsError);
          }

          for (const goal of goals || []) {
            let currentValue = 0;
            
            switch (goal.goal_type) {
              case 'deals_count':
                currentValue = dealsWon?.length || 0;
                break;
              case 'deals_value':
                currentValue = dealsValueWon;
                break;
              case 'conversations':
                currentValue = conversationsAssigned;
                break;
            }

            const { error: goalUpdateError } = await supabase
              .from('sales_goals')
              .update({
                current_value: currentValue,
                status: currentValue >= goal.goal_value ? 'achieved' : 'in_progress',
                achieved_at: currentValue >= goal.goal_value ? new Date().toISOString() : null,
              })
              .eq('id', goal.id);

            if (goalUpdateError) {
              console.error(`Error updating goal ${goal.id}:`, goalUpdateError);
            }
          }
        } catch (memberError) {
          console.error(`Error processing member ${member.id}:`, memberError);
          continue;
        }
      }
    }

    console.log("Metrics update completed successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Metrics updated successfully",
      processed_companies: companies?.length || 0,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in update-member-metrics:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";
    return new Response(JSON.stringify({ 
      error: errorMessage,
      stack: errorStack,
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
