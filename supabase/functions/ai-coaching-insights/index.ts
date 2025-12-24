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
        const { agent_id, company_id, manager_id, geminiApiKey, openaiApiKey, groqApiKey } = await req.json();

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        console.log(`Generating coaching insights for Agent: ${agent_id}`);

        // Fetch last 24h data
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { data: scores } = await supabase
            .from('conversation_quality_scores')
            .select('overall_score, empathy_score, analyzed_at')
            .eq('agent_id', agent_id)
            .gte('analyzed_at', yesterday);

        const { data: performance } = await supabase
            .from('agent_performance_snapshots')
            .select('avg_response_time, conversations_handled_today')
            .eq('agent_id', agent_id)
            .gte('snapshot_at', yesterday)
            .order('snapshot_at', { ascending: false })
            .limit(1);

        const { data: patterns } = await supabase
            .from('detected_patterns')
            .select('pattern_name, pattern_type')
            .eq('agent_id', agent_id)
            .limit(3);

        const latestPerf = performance?.[0] || {};
        const avgScore = scores && scores.length > 0
            ? scores.reduce((acc, curr) => acc + (curr.overall_score || 0), 0) / scores.length
            : 0;

        const systemPrompt = `Você é um Team Leader / Coach de Atendimento.
Analise os dados do agente nas últimas 24h e gere INSIGHTS de coaching.

DADOS:
- Conversas analisadas: ${scores?.length || 0}
- Score Qualidade Médio: ${avgScore.toFixed(0)}/100
- Tempo Médio Resposta: ${latestPerf.avg_response_time || '?'}s
- Conversas Atendidas: ${latestPerf.conversations_handled_today || '?'}
- Padrões Recentes: ${JSON.stringify(patterns || [])}

OBJETIVO:
Gere 1 a 3 insights (Pontos Fortes, Áreas de Melhoria, Conquistas ou Preocupações).
Seja motivador e direto.

Retorne JSON:
[
  {
    "category": "strength",
    "title": "Empatia em alta",
    "description": "Você manteve um score de empatia acima de 90 hoje.",
    "recommended_action": "Continue assim! Compartilhe suas dicas com o time.",
    "priority": "low"
  },
  {
    "category": "improvement_area",
    "title": "Tempo de resposta oscilando",
    "description": "Houve picos de demora à tarde.",
    "recommended_action": "Tente usar mais Respostas Rápidas.",
    "priority": "medium"
  }
]`;

        let insights = [];

        // Prompt LLM (Groq)
        if (groqApiKey) {
            try {
                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${groqApiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'llama-3.3-70b-versatile',
                        messages: [{ role: 'system', content: systemPrompt }],
                        temperature: 0.6,
                        response_format: { type: "json_object" }
                    }),
                });
                if (response.ok) {
                    const data = await response.json();
                    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
                    insights = parsed.insights || (Array.isArray(parsed) ? parsed : []);
                }
            } catch (e) {
                console.error('Groq error:', e);
            }
        }

        // OpenAI Fallback
        if (insights.length === 0 && openaiApiKey) {
            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${openaiApiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini',
                        messages: [{ role: 'system', content: systemPrompt }],
                        temperature: 0.6,
                    }),
                });
                if (response.ok) {
                    const data = await response.json();
                    const match = data.choices?.[0]?.message?.content.match(/\[[\s\S]*\]/);
                    insights = match ? JSON.parse(match[0]) : [];
                }
            } catch (e) {
                console.error('OpenAI error:', e);
            }
        }

        // Save insights
        if (insights.length > 0) {
            const records = insights.map((i: any) => ({
                agent_id,
                company_id,
                manager_id,
                category: i.category,
                title: i.title,
                description: i.description,
                recommended_action: i.recommended_action,
                priority: i.priority,
                status: 'new'
            }));

            await supabase.from('coaching_insights').insert(records);
        }

        return new Response(JSON.stringify({ success: true, insights }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error in ai-coaching-insights:', error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
