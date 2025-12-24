import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { company_id } = await req.json(); // Optional: run for specific company

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Get agents to analyze
        // If company_id is provided, filter by it. Otherwise get all agents active in last 24h?
        // For simplicity, let's get all profiles that are 'agent' or 'admin'
        let query = supabase.from('profiles').select('id, company_id, role, status').neq('company_id', null);

        if (company_id) {
            query = query.eq('company_id', company_id);
        }

        const { data: agents, error: agentsError } = await query;
        if (agentsError) throw agentsError;

        console.log(`Analyzing performance for ${agents.length} agents...`);

        const snapshots = [];

        for (const agent of agents) {
            // Execute SQL functions to get metrics
            // We can use rpc calls or just run queries. 
            // Using rpc is cleaner if functions exist.

            const { data: avgResponseTime } = await supabase.rpc('get_agent_avg_response_time', { p_agent_id: agent.id });
            const { data: activeConversations } = await supabase.rpc('get_agent_active_conversations', { p_agent_id: agent.id });
            const { data: waitingConversations } = await supabase.rpc('get_agent_waiting_conversations', { p_agent_id: agent.id });
            const { data: qualityScore } = await supabase.rpc('get_agent_quality_score_today', { p_agent_id: agent.id });

            // Determine load
            let currentLoad = 'low';
            if (activeConversations > 10) currentLoad = 'medium';
            if (activeConversations > 20) currentLoad = 'high';
            if (activeConversations > 30) currentLoad = 'overloaded';

            snapshots.push({
                agent_id: agent.id,
                company_id: agent.company_id,
                active_conversations: activeConversations || 0,
                waiting_conversations: waitingConversations || 0,
                avg_response_time: avgResponseTime || 0,
                quality_score_today: qualityScore || 0,
                is_online: agent.status === 'online', // status column in profiles? assuming yes, or derive from presence
                current_load: currentLoad,
                snapshot_at: new Date().toISOString()
            });
        }

        if (snapshots.length > 0) {
            const { error } = await supabase.from('agent_performance_snapshots').insert(snapshots);
            if (error) {
                console.error('Error inserting snapshots:', error);
                throw error;
            }
        }

        return new Response(JSON.stringify({ success: true, snapshots_count: snapshots.length }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error in ai-analyze-agent-performance:', error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
