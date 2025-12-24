import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =====================================================
// ANÁLISE LOCAL (FALLBACK SEM API)
// =====================================================

const EMPATHY_INDICATORS = [
    'entendo', 'compreendo', 'lamento', 'desculpe', 'sinto muito',
    'posso ajudar', 'vou resolver', 'me conte mais', 'estou aqui',
    'pode contar', 'claro', 'com certeza', 'prazer'
];

const PROFESSIONALISM_INDICATORS = [
    'bom dia', 'boa tarde', 'boa noite', 'por favor', 'obrigado',
    'agradeço', 'disponível', 'precisar', 'ajudar', 'atender'
];

const FRUSTRATION_KEYWORDS = [
    'absurdo', 'péssimo', 'horrível', 'decepcionado', 'raiva', 'irritado',
    'cansado', 'demora', 'problema', 'reclamação', 'cancelar', 'desistir'
];

const SATISFACTION_KEYWORDS = [
    'obrigado', 'excelente', 'ótimo', 'maravilhoso', 'perfeito', 'parabéns',
    'satisfeito', 'feliz', 'adorei', 'amei', 'incrível', 'fantástico'
];

const MIN_RESPONSE_LENGTH = 20;

function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    const lowerText = text.toLowerCase();
    let negativeScore = 0;
    let positiveScore = 0;

    FRUSTRATION_KEYWORDS.forEach(kw => {
        if (lowerText.includes(kw)) negativeScore++;
    });

    SATISFACTION_KEYWORDS.forEach(kw => {
        if (lowerText.includes(kw)) positiveScore++;
    });

    if (negativeScore > positiveScore + 1) return 'negative';
    if (positiveScore > negativeScore + 1) return 'positive';
    return 'neutral';
}

function calculateEmpathyScore(agentMessage: string): number {
    const lowerMessage = agentMessage.toLowerCase();
    let score = 50;

    EMPATHY_INDICATORS.forEach(indicator => {
        if (lowerMessage.includes(indicator)) score += 10;
    });

    if (agentMessage.length < MIN_RESPONSE_LENGTH) score -= 20;
    if (lowerMessage.includes('você') || lowerMessage.includes('senhor') || lowerMessage.includes('senhora')) {
        score += 5;
    }

    return Math.min(100, Math.max(0, score));
}

function calculateProfessionalismScore(agentMessage: string): number {
    const lowerMessage = agentMessage.toLowerCase();
    let score = 60;

    PROFESSIONALISM_INDICATORS.forEach(indicator => {
        if (lowerMessage.includes(indicator)) score += 8;
    });

    const informalWords = ['aí', 'né', 'tá', 'pô', 'mano', 'cara'];
    informalWords.forEach(word => {
        if (lowerMessage.includes(` ${word} `) || lowerMessage.endsWith(` ${word}`)) {
            score -= 5;
        }
    });

    const upperCaseRatio = (agentMessage.match(/[A-Z]/g) || []).length / agentMessage.length;
    if (upperCaseRatio > 0.5 && agentMessage.length > 10) score -= 15;

    return Math.min(100, Math.max(0, score));
}

function calculateResponseQualityScore(agentMessage: string, customerMessage: string): number {
    let score = 50;

    if (agentMessage.length >= MIN_RESPONSE_LENGTH) score += 15;
    if (agentMessage.length >= 100) score += 10;
    if (agentMessage.includes('?') || agentMessage.includes('!') || agentMessage.includes('.')) {
        score += 10;
    }

    const customerWords = customerMessage.toLowerCase().split(/\s+/);
    const agentWords = agentMessage.toLowerCase().split(/\s+/);

    let relevantWords = 0;
    customerWords.forEach(word => {
        if (word.length > 4 && agentWords.includes(word)) relevantWords++;
    });

    if (relevantWords >= 2) score += 15;

    return Math.min(100, Math.max(0, score));
}

function calculateToneScore(agentMessage: string): number {
    let score = 70;

    const emojiCount = (agentMessage.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
    if (emojiCount >= 1 && emojiCount <= 3) score += 10;
    if (emojiCount > 5) score -= 10;

    const negativeWords = ['não posso', 'impossível', 'não dá', 'infelizmente não'];
    negativeWords.forEach(phrase => {
        if (agentMessage.toLowerCase().includes(phrase)) score -= 5;
    });

    const positiveWords = ['com prazer', 'claro que sim', 'sem problemas', 'vou resolver'];
    positiveWords.forEach(phrase => {
        if (agentMessage.toLowerCase().includes(phrase)) score += 10;
    });

    return Math.min(100, Math.max(0, score));
}

function detectIssues(agentMessage: string, customerMessage: string): string[] {
    const issues: string[] = [];

    if (agentMessage.length < MIN_RESPONSE_LENGTH) {
        issues.push('Resposta muito curta - adicione mais detalhes');
    }

    const greetings = ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'ola'];
    const hasGreeting = greetings.some(g => agentMessage.toLowerCase().startsWith(g));
    if (!hasGreeting && agentMessage.length > 50) {
        issues.push('Considere iniciar com uma saudação');
    }

    const customerSentiment = analyzeSentiment(customerMessage);
    if (customerSentiment === 'negative') {
        const hasEmpathy = EMPATHY_INDICATORS.some(e => agentMessage.toLowerCase().includes(e));
        if (!hasEmpathy) {
            issues.push('Cliente frustrado - demonstre mais empatia');
        }
    }

    return issues;
}

function identifyPositiveHighlights(agentMessage: string): string[] {
    const highlights: string[] = [];
    const lowerMessage = agentMessage.toLowerCase();

    if (agentMessage.length >= 100) highlights.push('Resposta detalhada e completa');
    if (EMPATHY_INDICATORS.some(e => lowerMessage.includes(e))) highlights.push('Demonstrou empatia');
    if (PROFESSIONALISM_INDICATORS.filter(p => lowerMessage.includes(p)).length >= 2) {
        highlights.push('Tom profissional adequado');
    }
    if (lowerMessage.includes('?')) highlights.push('Fez perguntas para entender melhor');
    if (lowerMessage.includes('ajudar') || lowerMessage.includes('resolver')) {
        highlights.push('Demonstrou disposição para ajudar');
    }

    return highlights;
}

function generateLocalEvaluation(agentMessage: string, previousMessages: any[]): any {
    const lastCustomerMessage = [...previousMessages].reverse().find(m => !m.is_from_me && m.sender_type !== 'agent');
    const customerText = lastCustomerMessage?.content || '';

    const empathyScore = calculateEmpathyScore(agentMessage);
    const professionalismScore = calculateProfessionalismScore(agentMessage);
    const responseQualityScore = calculateResponseQualityScore(agentMessage, customerText);
    const toneScore = calculateToneScore(agentMessage);

    // Resolution score simplificado
    let resolutionScore = 50;
    const resolutionIndicators = ['resolvido', 'pronto', 'feito', 'concluído', 'ok', 'tudo certo'];
    if (resolutionIndicators.some(r => agentMessage.toLowerCase().includes(r))) {
        resolutionScore = 80;
    }

    const overallScore = Math.round(
        (empathyScore * 0.2) +
        (professionalismScore * 0.2) +
        (responseQualityScore * 0.25) +
        (toneScore * 0.15) +
        (resolutionScore * 0.2)
    );

    return {
        overall_score: overallScore,
        empathy_score: empathyScore,
        resolution_score: resolutionScore,
        tone_score: toneScore,
        professionalism_score: professionalismScore,
        response_quality_score: responseQualityScore,
        sentiment: analyzeSentiment(customerText),
        detected_issues: detectIssues(agentMessage, customerText),
        positive_highlights: identifyPositiveHighlights(agentMessage),
        improvement_areas: empathyScore < 60 ? ['Demonstrar mais empatia'] :
            toneScore < 60 ? ['Melhorar tom das mensagens'] :
                responseQualityScore < 60 ? ['Fornecer respostas mais completas'] : []
    };
}

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
            messages, // Suporte para formato alternativo
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

        // Suporte para ambos os formatos de mensagens
        const allMessages = previous_messages || messages || [];
        const agentMessage = message_content || allMessages.filter((m: any) => m.is_from_me || m.sender_type === 'agent').pop()?.content || '';

        const contextText = allMessages
            .slice(-10)
            .map((msg: any) => `${msg.is_from_me || msg.sender_type === 'agent' ? 'Agente' : 'Cliente'}: ${msg.content}`)
            .join('\n');

        const systemPrompt = `Você é um Supervisor de Qualidade Automático (QA AI).
Avalie a última resposta do ATENDENTE na conversa abaixo.
Seja rigoroso, mas justo.

CONVERSA:
${contextText}

ÚLTIMA RESPOSTA DO AGENTE: "${agentMessage}"

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

        const userMessage = `Avalie a resposta: "${agentMessage}"`;

        let evaluation = null;

        // Try Gemini first
        if (geminiApiKey && !evaluation) {
            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{ text: `${systemPrompt}\n\n${userMessage}` }]
                            }],
                            generationConfig: {
                                temperature: 0.3,
                                maxOutputTokens: 500,
                            }
                        })
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                    const jsonMatch = text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        evaluation = JSON.parse(jsonMatch[0]);
                    }
                }
            } catch (e) {
                console.error('Gemini error:', e);
            }
        }

        // Try Groq
        if (!evaluation && groqApiKey) {
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
                        temperature: 0.3,
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

        // Fallback: Usar análise local se nenhuma API funcionou
        if (!evaluation || !evaluation.overall_score) {
            console.log('Using local fallback for quality scoring');
            evaluation = generateLocalEvaluation(agentMessage, allMessages);
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
                // Não lança erro para retornar a avaliação mesmo assim
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
