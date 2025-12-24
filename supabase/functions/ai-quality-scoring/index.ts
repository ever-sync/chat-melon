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
        const {
            conversation_id,
            agent_id,
            company_id,
            message_content, // The agent's latest message
            previous_messages,
            geminiApiKey,
            openaiApiKey,
            groqApiKey
        } = await req.json();

        console.log('Scoring quality for agent message in conversation:', conversation_id);

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const contextText = previous_messages
            .map((msg: any) => `${msg.is_from_me ? 'Agent' : 'Customer'}: ${msg.content}`)
            .join('\n');

        let systemPrompt = `Você é um Supervisor de Qualidade Automático (QA AI).
Avalie a última resposta do ATENDENTE na conversa abaixo.
Seja rigoroso, mas justo. 

CONVERSA:
${contextText}
AGENT: ${message_content}

AVALIAÇÃO:
Retorne um JSON com scores de 0 a 100 e análise qualitativa:
{
  "overall_score": 85,
  "empathy_score": 90,
  "resolution_score": 80,
  "tone_score": 90,
  "professionalism_score": 95,
  "response_quality_score": 85,
  "sentiment": "positive",
  "detected_issues": ["possível falta de clareza no prazo"],
  "positive_highlights": ["excelente saudação", "respondeu rápido"],
  "improvement_areas": ["poderia confirmar se resolveu"]
}

Se a resposta for muito curta (ex: "ok", "sim"), o score deve ser penalizado se não resolver o problema.`;

        const userMessage = `Avalie a resposta: "${message_content}"`;

        let evaluation = null;

        // Try Groq
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
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userMessage }
                        ],
                        temperature: 0.3, // Lower temperature for consistent scoring
                        response_format: { type: "json_object" }
                    }),
                });
                if (response.ok) {
                    const data = await response.json();
                    evaluation = JSON.parse(data.choices?.[0]?.message?.content || '{}');
                }
            } catch (e) {
                console.error('Groq error:', e);
            }
        }

        // Try OpenAI
        if (!evaluation && openaiApiKey) {
            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${openaiApiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userMessage }
                        ],
                        temperature: 0.3,
                    }),
                });
                if (response.ok) {
                    const data = await response.json();
                    const match = data.choices?.[0]?.message?.content.match(/\{[\s\S]*\}/);
                    evaluation = match ? JSON.parse(match[0]) : null;
                }
            } catch (e) {
                console.error('OpenAI error:', e);
            }
        }

        // Save to DB
        if (evaluation) {
            const { error } = await supabase.from('conversation_quality_scores').insert({
                conversation_id,
                agent_id,
                company_id,
                overall_score: evaluation.overall_score,
                empathy_score: evaluation.empathy_score,
                resolution_score: evaluation.resolution_score,
                tone_score: evaluation.tone_score,
                professionalism_score: evaluation.professionalism_score,
                response_quality_score: evaluation.response_quality_score,
                sentiment: evaluation.sentiment,
                detected_issues: evaluation.detected_issues,
                positive_highlights: evaluation.positive_highlights,
                improvement_areas: evaluation.improvement_areas,
                analyzed_at: new Date().toISOString()
            });

            if (error) {
                console.error('Error saving score:', error);
                throw error;
            }
        }

        return new Response(JSON.stringify({ success: true, evaluation }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error in ai-quality-scoring:', error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
