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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting insights generation...");

    // Get all active companies
    const { data: companies, error: companiesError } = await supabase
      .from("companies")
      .select("id, name")
      .eq("is_active", true);

    if (companiesError) throw companiesError;

    const generatedInsights = [];

    for (const company of companies || []) {
      console.log(`Generating insights for company: ${company.name}`);

      // 1. Check for deals at risk (no activity for 7+ days)
      const { data: dealsAtRisk } = await supabase
        .from("deals")
        .select("id, title, last_activity, created_at, contact_id, contacts(name)")
        .eq("company_id", company.id)
        .eq("status", "open")
        .lt("last_activity", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      for (const deal of dealsAtRisk || []) {
        const lastActivityDate = deal.last_activity || (deal as any).created_at;
        const daysSinceActivity = Math.floor(
          (Date.now() - new Date(lastActivityDate).getTime()) / (24 * 60 * 60 * 1000)
        );

        await supabase.from("ai_insights").insert({
          company_id: company.id,
          insight_type: "deal_at_risk",
          title: `Negócio "${deal.title}" em risco`,
          description: `Parado há ${daysSinceActivity} dias sem atividade`,
          priority: daysSinceActivity > 14 ? "high" : "medium",
          action_type: "view_deal",
          action_data: { deal_id: deal.id },
          data: { deal_id: deal.id, days_inactive: daysSinceActivity },
        });

        generatedInsights.push({ type: "deal_at_risk", deal_id: deal.id });
      }

      // 2. Check for contacts needing follow-up (no interaction for 7+ days)
      const { data: contactsNeedingFollowup } = await supabase
        .from("conversations")
        .select("id, contact_name, contact_id, last_message_time")
        .eq("company_id", company.id)
        .eq("status", "open")
        .lt("last_message_time", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(5);

      if (contactsNeedingFollowup && contactsNeedingFollowup.length > 0) {
        await supabase.from("ai_insights").insert({
          company_id: company.id,
          insight_type: "follow_up_needed",
          title: `${contactsNeedingFollowup.length} contatos precisam de follow-up`,
          description: `Sem interação há mais de 7 dias`,
          priority: "medium",
          action_type: "view_details",
          action_data: { contact_ids: contactsNeedingFollowup.map(c => c.contact_id) },
          data: { count: contactsNeedingFollowup.length },
        });

        generatedInsights.push({ type: "follow_up_needed", count: contactsNeedingFollowup.length });
      }

      // 3. Check goal progress
      const { data: goals } = await supabase
        .from("goals")
        .select("*")
        .eq("company_id", company.id)
        .eq("status", "active")
        .gte("end_date", new Date().toISOString().split('T')[0]);

      for (const goal of goals || []) {
        const currentValue = goal.current_value || 0;
        const targetValue = goal.target_value;
        const remaining = targetValue - currentValue;
        const percentage = (currentValue / targetValue) * 100;

        if (percentage >= 80 && percentage < 100) {
          await supabase.from("ai_insights").insert({
            company_id: company.id,
            insight_type: "goal_progress",
            title: `Quase lá! Faltam ${percentage >= 90 ? 'apenas' : ''} ${Math.round(remaining)} para bater a meta`,
            description: `Você está a ${Math.round(100 - percentage)}% da sua meta de ${goal.goal_type}`,
            priority: "medium",
            action_type: "view_details",
            action_data: { goal_id: goal.id },
            data: { goal_id: goal.id, percentage, remaining },
          });

          generatedInsights.push({ type: "goal_progress", goal_id: goal.id });
        }
      }

      // 4. Detect trends (week over week lead increase)
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

      const { count: lastWeekLeads } = await supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("company_id", company.id)
        .gte("created_at", oneWeekAgo);

      const { count: previousWeekLeads } = await supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("company_id", company.id)
        .gte("created_at", twoWeeksAgo)
        .lt("created_at", oneWeekAgo);

      if (lastWeekLeads && previousWeekLeads && lastWeekLeads > previousWeekLeads) {
        const increase = ((lastWeekLeads - previousWeekLeads) / previousWeekLeads) * 100;
        if (increase >= 20) {
          await supabase.from("ai_insights").insert({
            company_id: company.id,
            insight_type: "trend_detected",
            title: `Tendência: +${Math.round(increase)}% de leads esta semana`,
            description: `Comparado com a semana anterior (${previousWeekLeads} → ${lastWeekLeads})`,
            priority: "low",
            action_type: "view_details",
            data: { last_week: lastWeekLeads, previous_week: previousWeekLeads, increase },
          });

          generatedInsights.push({ type: "trend_detected", increase });
        }
      }
    }

    console.log(`Generated ${generatedInsights.length} insights`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: generatedInsights.length,
        insights: generatedInsights 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating insights:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
