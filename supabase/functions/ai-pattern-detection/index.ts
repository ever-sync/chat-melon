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
        const { company_id, agent_id, geminiApiKey, openaiApiKey, groqApiKey } = await req.json();

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        console.log(`Detecting patterns for Company: ${company_id}, Agent: ${agent_id || 'All'}`);

        // Fetch quality scores from last 7 days
        let query = supabase
            .from('conversation_quality_scores')
            .select('agent_id, overall_score, detected_issues, positive_highlights, sentiment, analyzed_at')
            .eq('company_id', company_id)
            .gte('analyzed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        if (agent_id) {
            query = query.eq('agent_id', agent_id);
        }

        const { data: scores, error } = await query;
        if (error) throw error;

        if (!scores || scores.length === 0) {
            return new Response(JSON.stringify({ message: 'No enough data for pattern detection' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Aggregate data for LLM
        const issues = scores.flatMap(s => s.detected_issues || []);
        const sentiments = scores.map(s => s.sentiment);
        const avgScore = scores.reduce((acc, curr) => acc + (curr.overall_score || 0), 0) / scores.length;

        // Prepare Prompt
        const systemPrompt = `Você é um Analista de Performance de Atendimento IA.
Analise os dados agregados dos últimos 7 dias e identifique PADRÕES.

DADOS:
- Total conversas analisadas: ${scores.length}
- Média Score Geral: ${avgScore.toFixed(2)}
- Principais problemas detectados: ${JSON.stringify(issues.slice(0, 50))}
- Distribuição de sentimento: ${JSON.stringify(sentiments.reduce((acc: any, curr) => {
            acc[curr] = (acc[curr] || 0) + 1;
            return acc;
        }, {}))}

TAREFA:
Identifique até 3 padrões relevantes (positivos ou negativos).
Tipos de padrão: 'recurring_issue', 'success_pattern', 'bottleneck', 'performance_trend'.

Retorne JSON:
[
  {
    "pattern_type": "recurring_issue",
    "pattern_name": "Dificuldade com prazos",
    "description": "Vários clientes reclamaram de falta de clareza sobre entregas.",
    "confidence_score": 85,
    "impact_level": "high",
    "recommended_actions": ["Revisar script de prazos", "Treinamento curto"]
  }
]`;

        let patterns = [];

        // Use LLM (Groq Preferred)
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
                        temperature: 0.5,
                        response_format: { type: "json_object" }
                    }),
                });
                if (response.ok) {
                    const data = await response.json();
                    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
                    patterns = parsed.patterns || (Array.isArray(parsed) ? parsed : []);
                }
            } catch (e) {
                console.error('Groq error:', e);
            }
        }

        // OpenAI Fallback
        if (patterns.length === 0 && openaiApiKey) {
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
                        temperature: 0.5,
                    }),
                });
                if (response.ok) {
                    const data = await response.json();
                    const match = data.choices?.[0]?.message?.content.match(/\[[\s\S]*\]/);
                    patterns = match ? JSON.parse(match[0]) : [];
                }
            } catch (e) {
                console.error('OpenAI error:', e);
            }
        }

        // Save patterns
        if (patterns.length > 0) {
            const records = patterns.map((p: any) => ({
                company_id,
                agent_id: agent_id || null, // null if company-wide
                pattern_type: p.pattern_type,
                pattern_name: p.pattern_name,
                description: p.description,
                confidence_score: p.confidence_score,
                impact_level: p.impact_level,
                recommended_actions: p.recommended_actions,
                detected_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                detected_to: new Date().toISOString()
            }));

            await supabase.from('detected_patterns').insert(records);
        }

        return new Response(JSON.stringify({ success: true, patterns }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error in ai-pattern-detection:', error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
