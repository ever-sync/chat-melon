import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Thresholds para determinar nível de carga
const LOAD_THRESHOLDS = {
    low: 5,
    medium: 10,
    high: 15,
    overloaded: 20
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const body = await req.json().catch(() => ({}));
        const { company_id, agent_id } = body;

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Get agents to analyze
        let query = supabase
            .from('profiles')
            .select('id, company_id, role, full_name, avatar_url')
            .neq('company_id', null)
            .in('role', ['agent', 'admin', 'manager']);

        if (company_id) {
            query = query.eq('company_id', company_id);
        }

        if (agent_id) {
            query = query.eq('id', agent_id);
        }

        const { data: agents, error: agentsError } = await query;
        if (agentsError) throw agentsError;

        console.log(`Analyzing performance for ${agents?.length || 0} agents...`);

        const snapshots = [];
        const results = [];

        for (const agent of agents || []) {
            try {
                // Buscar métricas diretamente quando RPC não existir
                // Conversas ativas
                const { count: activeConversations } = await supabase
                    .from('conversations')
                    .select('*', { count: 'exact', head: true })
                    .eq('assigned_to', agent.id)
                    .in('status', ['open', 'pending']);

                // Conversas aguardando resposta (última mensagem é do cliente há mais de 5 min)
                const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
                const { data: waitingConvs } = await supabase
                    .from('conversations')
                    .select(`
                        id,
                        messages!inner(is_from_me, created_at)
                    `)
                    .eq('assigned_to', agent.id)
                    .in('status', ['open', 'pending'])
                    .eq('messages.is_from_me', false)
                    .lt('messages.created_at', fiveMinutesAgo)
                    .order('created_at', { foreignTable: 'messages', ascending: false })
                    .limit(1, { foreignTable: 'messages' });

                const waitingConversations = waitingConvs?.length || 0;

                // Conversas atendidas hoje
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);

                const { count: conversationsToday } = await supabase
                    .from('messages')
                    .select('conversation_id', { count: 'exact', head: true })
                    .eq('sender_id', agent.id)
                    .eq('is_from_me', true)
                    .gte('created_at', todayStart.toISOString());

                // Score de qualidade médio hoje
                const { data: qualityScores } = await supabase
                    .from('conversation_quality_scores')
                    .select('overall_score')
                    .eq('agent_id', agent.id)
                    .gte('analyzed_at', todayStart.toISOString());

                const qualityScoreToday = qualityScores && qualityScores.length > 0
                    ? qualityScores.reduce((sum, s) => sum + (s.overall_score || 0), 0) / qualityScores.length
                    : null;

                // Tempo médio de resposta (últimos snapshots ou calcular)
                const { data: recentSnapshots } = await supabase
                    .from('agent_performance_snapshots')
                    .select('avg_response_time')
                    .eq('agent_id', agent.id)
                    .gte('snapshot_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
                    .order('snapshot_at', { ascending: false })
                    .limit(5);

                const avgResponseTime = recentSnapshots && recentSnapshots.length > 0
                    ? recentSnapshots.reduce((sum, s) => sum + (s.avg_response_time || 0), 0) / recentSnapshots.length
                    : 0;

                // Verificar se está online (baseado em atividade recente)
                const { data: recentActivity } = await supabase
                    .from('messages')
                    .select('created_at')
                    .eq('sender_id', agent.id)
                    .order('created_at', { ascending: false })
                    .limit(1);

                const lastActivityTime = recentActivity?.[0]?.created_at
                    ? new Date(recentActivity[0].created_at)
                    : null;
                const isOnline = lastActivityTime
                    ? (Date.now() - lastActivityTime.getTime()) < 30 * 60 * 1000 // Ativo nos últimos 30 min
                    : false;

                // Determinar nível de carga
                let currentLoad = 'low';
                const activeCount = activeConversations || 0;
                if (activeCount >= LOAD_THRESHOLDS.overloaded) currentLoad = 'overloaded';
                else if (activeCount >= LOAD_THRESHOLDS.high) currentLoad = 'high';
                else if (activeCount >= LOAD_THRESHOLDS.medium) currentLoad = 'medium';

                const snapshot = {
                    agent_id: agent.id,
                    company_id: agent.company_id,
                    active_conversations: activeCount,
                    waiting_conversations: waitingConversations,
                    avg_response_time: Math.round(avgResponseTime),
                    conversations_handled_today: conversationsToday || 0,
                    quality_score_today: qualityScoreToday ? Math.round(qualityScoreToday * 100) / 100 : null,
                    is_online: isOnline,
                    current_load: currentLoad,
                    snapshot_at: new Date().toISOString()
                };

                snapshots.push(snapshot);
                results.push({
                    agent_id: agent.id,
                    agent_name: agent.full_name,
                    ...snapshot
                });

            } catch (agentError) {
                console.error(`Error processing agent ${agent.id}:`, agentError);
            }
        }

        // Inserir snapshots
        if (snapshots.length > 0) {
            const { error } = await supabase.from('agent_performance_snapshots').insert(snapshots);
            if (error) {
                console.error('Error inserting snapshots:', error);
                // Não lançar erro, continuar com retorno parcial
            }
        }

        // Limpar snapshots antigos (manter últimas 24h)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        await supabase
            .from('agent_performance_snapshots')
            .delete()
            .lt('snapshot_at', oneDayAgo);

        return new Response(JSON.stringify({
            success: true,
            snapshots_count: snapshots.length,
            results
        }), {
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
