import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =====================================================
// ANÁLISE LOCAL (FALLBACK SEM API)
// =====================================================

const FRUSTRATION_KEYWORDS = [
    'absurdo', 'péssimo', 'horrível', 'decepcionado', 'raiva', 'irritado',
    'cansado', 'demora', 'problema', 'reclamação', 'cancelar', 'desistir',
    'inaceitável', 'vergonha', 'incompetente', 'desrespeito', 'nunca mais'
];

const SATISFACTION_KEYWORDS = [
    'obrigado', 'excelente', 'ótimo', 'maravilhoso', 'perfeito', 'parabéns',
    'satisfeito', 'feliz', 'adorei', 'amei', 'incrível', 'fantástico', 'recomendo'
];

const INTENT_KEYWORDS: Record<string, string[]> = {
    greeting: ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'ola', 'hey', 'opa'],
    question: ['como', 'quando', 'onde', 'qual', 'quanto', 'quem', 'por que', 'porque', '?'],
    complaint: ['problema', 'erro', 'bug', 'não funciona', 'travou', 'ruim', 'péssimo', 'horrível'],
    request: ['preciso', 'gostaria', 'poderia', 'pode', 'quero', 'necessito', 'solicito'],
    cancellation: ['cancelar', 'cancelamento', 'desistir', 'encerrar', 'parar', 'sair'],
    pricing: ['preço', 'valor', 'quanto custa', 'plano', 'desconto', 'promoção', 'pagamento'],
    support: ['ajuda', 'suporte', 'assistência', 'auxílio', 'socorro', 'me ajude'],
    feedback: ['sugestão', 'opinião', 'feedback', 'melhorar', 'avaliação', 'nota'],
    followup: ['e aí', 'alguma novidade', 'resolveu', 'conseguiu', 'status', 'atualização'],
};

const RESPONSE_TEMPLATES: Record<string, { response: string; reasoning: string }> = {
    greeting: {
        response: 'Olá! Seja bem-vindo(a)! Como posso ajudá-lo(a) hoje?',
        reasoning: 'Saudação inicial padrão para iniciar o atendimento.'
    },
    question: {
        response: 'Ótima pergunta! Deixa eu esclarecer isso para você...',
        reasoning: 'Validação da pergunta do cliente antes de fornecer a resposta.'
    },
    complaint: {
        response: 'Lamento muito por esse inconveniente. Vou verificar isso imediatamente e resolver para você. Pode me dar mais detalhes sobre o que aconteceu?',
        reasoning: 'Demonstrar empatia e solicitar informações para resolver o problema.'
    },
    request: {
        response: 'Claro! Vou providenciar isso para você. Só preciso confirmar alguns detalhes...',
        reasoning: 'Confirmação da solicitação com abertura para esclarecimentos.'
    },
    cancellation: {
        response: 'Entendo. Antes de prosseguir, posso saber o motivo? Talvez possamos resolver a questão de outra forma.',
        reasoning: 'Tentativa de retenção através do entendimento do problema.'
    },
    pricing: {
        response: 'Vou te passar todas as informações sobre valores e planos. Qual seria o seu objetivo principal?',
        reasoning: 'Entender a necessidade para oferecer o plano mais adequado.'
    },
    support: {
        response: 'Estou aqui para ajudar! Me conta mais sobre o que está acontecendo para eu poder te auxiliar da melhor forma.',
        reasoning: 'Abertura empática para entender e resolver o problema.'
    },
    feedback: {
        response: 'Agradeço muito pelo seu feedback! Isso nos ajuda a melhorar continuamente. Vou registrar sua sugestão.',
        reasoning: 'Valorização do feedback do cliente.'
    },
    followup: {
        response: 'Deixa eu verificar o status do seu caso agora mesmo...',
        reasoning: 'Resposta imediata para follow-up com verificação do status.'
    },
    unknown: {
        response: 'Entendi. Pode me dar mais detalhes para eu poder ajudar melhor?',
        reasoning: 'Solicitação de mais informações quando a intenção não é clara.'
    }
};

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

function detectIntent(message: string): string {
    const lowerMessage = message.toLowerCase();

    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
        for (const keyword of keywords) {
            if (lowerMessage.includes(keyword)) {
                return intent;
            }
        }
    }

    return 'unknown';
}

function generateLocalSuggestions(
    messages: any[],
    contactName: string | undefined,
    trigger: string,
    context?: any
): any[] {
    const suggestions: any[] = [];

    // Encontrar última mensagem do cliente
    const lastCustomerMessage = [...messages].reverse().find(m => !m.is_from_me && m.sender_type !== 'agent');

    if (!lastCustomerMessage && trigger !== 'long_wait' && trigger !== 'no_response') {
        return suggestions;
    }

    const customerText = lastCustomerMessage?.content || '';
    const sentiment = analyzeSentiment(customerText);
    const intent = detectIntent(customerText);

    // Sugestão de resposta
    if (trigger === 'new_message' || trigger === 'manual') {
        const template = RESPONSE_TEMPLATES[intent] || RESPONSE_TEMPLATES.unknown;
        let response = template.response;

        if (contactName) {
            response = response.replace('!', `, ${contactName}!`);
        }

        suggestions.push({
            type: 'response',
            priority: sentiment === 'negative' ? 'high' : 'medium',
            title: `Sugestão de Resposta${intent !== 'unknown' ? ` - ${intent}` : ''}`,
            description: template.reasoning,
            suggested_response: response,
            reasoning: `Intenção detectada: ${intent}. Sentimento: ${sentiment}.`
        });
    }

    // Alerta de tempo de espera longo
    if ((trigger === 'long_wait' || trigger === 'no_response') && context?.wait_time) {
        const waitMinutes = Math.floor(context.wait_time / 60);
        suggestions.push({
            type: 'alert',
            priority: waitMinutes > 10 ? 'urgent' : 'high',
            title: `Cliente aguardando há ${waitMinutes} minutos`,
            description: 'Responda o mais rápido possível para evitar frustração do cliente.',
            reasoning: 'Tempo de espera elevado detectado.'
        });
    }

    // Alerta de cliente frustrado
    if (sentiment === 'negative') {
        suggestions.push({
            type: 'alert',
            priority: 'high',
            title: 'Cliente frustrado detectado',
            description: 'O cliente demonstrou frustração. Demonstre empatia e ofereça solução clara.',
            reasoning: 'Palavras-chave negativas detectadas na mensagem.'
        });
    }

    // Alerta de risco de churn
    if (intent === 'cancellation') {
        suggestions.push({
            type: 'alert',
            priority: 'urgent',
            title: 'Risco de Churn detectado',
            description: 'Cliente mencionou cancelamento. Tente entender o motivo e oferecer alternativas.',
            reasoning: 'Intenção de cancelamento detectada.'
        });
    }

    // Dica de oportunidade de venda
    if (intent === 'pricing') {
        suggestions.push({
            type: 'tip',
            priority: 'medium',
            title: 'Oportunidade de venda',
            description: 'Cliente perguntou sobre preços. Considere apresentar uma proposta comercial.',
            reasoning: 'Cliente demonstrou interesse em valores.'
        });
    }

    return suggestions;
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
            messages,
            contactProfile,
            deals,
            trigger, // 'new_message', 'no_response', 'long_wait', 'pattern', 'low_score', 'manual'
            context,
            geminiApiKey,
            openaiApiKey,
            groqApiKey
        } = await req.json();

        console.log('Generating suggestions for:', { conversation_id, triggerType: trigger });

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Build context for LLM
        const conversationContext = messages
            .slice(-10)
            .map((msg: any) => `${msg.is_from_me || msg.sender_type === 'agent' ? 'Agente' : 'Cliente'}: ${msg.content}`)
            .join('\n');

        const systemPrompt = `Você é um assistente de IA experiente em suporte e vendas (Co-piloto).
Sua missão é ajudar o atendente a performar melhor, sugerindo respostas, ações, alertas ou dicas.

CONTEXTO:
- Tipo de gatilho: ${trigger}
- Cliente: ${contactProfile?.name || 'Desconhecido'}
- Deals ativos: ${deals?.length || 0}${deals && deals.length > 0 ? `\n- Deal atual: ${deals[0].title} (${deals[0].stage})` : ''}
${context?.wait_time ? `- Tempo de espera: ${Math.floor(context.wait_time / 60)} minutos` : ''}

CONVERSA RECENTE:
${conversationContext}

OBJETIVO:
Gere 1 a 3 sugestões RELEVANTES para o atendente neste momento.
As sugestões podem ser:
- 'response': Uma sugestão de resposta para enviar ao cliente.
- 'action': Uma ação recomendada (ex: criar task, mover deal).
- 'alert': Um alerta importante (ex: cliente irritado, risco de churn).
- 'tip': Uma dica de coaching rápido (ex: "Use o nome do cliente").

Retorne APENAS um JSON válido no formato:
{
  "suggestions": [
    {
      "type": "response",
      "priority": "high",
      "title": "Sugestão de Resposta",
      "description": "Responder dúvidas sobre preço",
      "suggested_response": "Olá [Nome], nossos planos começam em R$99...",
      "reasoning": "Cliente perguntou explicitamente sobre valores."
    }
  ]
}`;

        const userMessage = `Analise a conversa e gere sugestões JSON.`;

        let suggestions = null;

        // Try Gemini first (geralmente mais disponível)
        if (geminiApiKey && !suggestions) {
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
                                temperature: 0.7,
                                maxOutputTokens: 1000,
                            }
                        })
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                    const jsonMatch = text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        suggestions = Array.isArray(parsed) ? parsed : (parsed.suggestions || []);
                    }
                }
            } catch (e) {
                console.error('Gemini error:', e);
            }
        }

        // Try Groq
        if (!suggestions && groqApiKey) {
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
                        temperature: 0.7,
                        response_format: { type: "json_object" }
                    }),
                });
                if (response.ok) {
                    const data = await response.json();
                    const content = data.choices?.[0]?.message?.content || '{}';
                    const parsed = JSON.parse(content);
                    suggestions = Array.isArray(parsed) ? parsed : (parsed.suggestions || []);
                }
            } catch (e) {
                console.error('Groq error:', e);
            }
        }

        // Try OpenAI
        if (!suggestions && openaiApiKey) {
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
                        temperature: 0.7,
                    }),
                });
                if (response.ok) {
                    const data = await response.json();
                    const content = data.choices?.[0]?.message?.content || '[]';
                    const match = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
                    if (match) {
                        const parsed = JSON.parse(match[0]);
                        suggestions = Array.isArray(parsed) ? parsed : (parsed.suggestions || []);
                    }
                }
            } catch (e) {
                console.error('OpenAI error:', e);
            }
        }

        // Fallback: Usar análise local se nenhuma API funcionou
        if (!suggestions || suggestions.length === 0) {
            console.log('Using local fallback for suggestions');
            suggestions = generateLocalSuggestions(
                messages,
                contactProfile?.name,
                trigger,
                context
            );
        }

        // Save suggestions to DB if valid
        if (suggestions && Array.isArray(suggestions) && suggestions.length > 0) {
            const records = suggestions.map((s: any) => ({
                conversation_id,
                company_id,
                type: s.type || 'response',
                priority: s.priority || 'medium',
                title: s.title || 'Sugestão da IA',
                description: s.description || s.reasoning || '',
                suggested_response: s.suggested_response || s.content || '',
                reasoning: s.reasoning || '',
                trigger_context: {
                    trigger_type: trigger,
                    generated_by: suggestions === generateLocalSuggestions(messages, contactProfile?.name, trigger, context) ? 'local' : 'ai'
                },
                expires_at: new Date(Date.now() + 1000 * 60 * 30).toISOString() // 30 min expiry
            }));

            const { error: insertError } = await supabase.from('ai_suggestions').insert(records);
            if (insertError) {
                console.error('Error saving suggestions:', insertError);
            }
        }

        return new Response(JSON.stringify({ success: true, suggestions }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error in ai-generate-suggestions:', error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
