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
            messages,
            contactProfile,
            deals,
            trigger, // 'new_message', 'no_response', 'pattern', 'low_score'
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
            .map((msg: any) => `${msg.is_from_me ? 'Agente' : 'Cliente'}: ${msg.content}`)
            .join('\n');

        let systemPrompt = `Você é um assistente de IA experiente em suporte e vendas (Co-piloto). 
Sua missão é ajudar o atendente a performar melhor, sugerindo respostas, ações, alertas ou dicas.

CONTEXTO:
- Tipo de gatilho: ${trigger}
- Cliente: ${contactProfile?.name || 'Desconhecido'}
- Deals ativos: ${deals?.length || 0}`;

        if (deals && deals.length > 0) {
            systemPrompt += `\n- Deal atual: ${deals[0].title} (${deals[0].stage})`;
        }

        systemPrompt += `\n\nCONVERSA RECENTE:\n${conversationContext}`;

        systemPrompt += `\n\nOBJETIVO:
Gere 1 a 3 sugestões RELEVANTES para o atendente neste momento.
As sugestões podem ser:
- 'response': Uma sugestão de resposta para enviar ao cliente.
- 'action': Uma ação recomendada (ex: criar task, mover deal).
- 'alert': Um alerta importante (ex: cliente irritado, risco de churn).
- 'tip': Uma dica de coaching rápido (ex: "Use o nome do cliente").

Retorne APENAS um JSON válido no formato:
[
  {
    "type": "response",
    "priority": "high",
    "title": "Sugestão de Resposta",
    "description": "Responder dúvidas sobre preço",
    "suggested_response": "Olá [Nome], nossos planos começam em R$99...",
    "reasoning": "Cliente perguntou explicitamente sobre valores."
  },
  {
    "type": "action",
    "priority": "medium",
    "title": "Criar Tarefa",
    "description": "Agendar follow-up",
    "reasoning": "Cliente pediu para retornar amanhã."
  }
]
`;

        const userMessage = `Analise a conversa e gere sugestões JSON.`;

        let suggestions = null;

        // Try Groq first
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
                        temperature: 0.7,
                        response_format: { type: "json_object" }
                    }),
                });
                if (response.ok) {
                    const data = await response.json();
                    const content = data.choices?.[0]?.message?.content || '[]';
                    // Ensure we parse array or object wrapping array
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
                    const match = content.match(/\[[\s\S]*\]/);
                    suggestions = match ? JSON.parse(match[0]) : [];
                }
            } catch (e) {
                console.error('OpenAI error:', e);
            }
        }

        // Save suggestions to DB if valid
        if (suggestions && Array.isArray(suggestions) && suggestions.length > 0) {
            const records = suggestions.map((s: any) => ({
                conversation_id,
                company_id,
                suggestion_type: s.type || 'response',
                status: 'pending',
                priority: s.priority || 'medium',
                title: s.title || 'Sugestão da IA',
                description: s.description || s.reasoning,
                content: s.suggested_response || s.content || '',
                trigger_message_id: null,
                expires_at: new Date(Date.now() + 1000 * 60 * 30).toISOString() // 30 min expiry
            }));

            const { error: insertError } = await supabase.from('ai_suggestions').insert(records);
            if (insertError) {
                console.error('Error saving suggestions:', insertError);
                // Don't throw here, so we still return the suggestions to the caller
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
