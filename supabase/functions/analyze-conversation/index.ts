import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, contactName, contactCompany, tone = 'friendly' } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Construir contexto das últimas mensagens (agora 20 para melhor análise)
    const conversationContext = messages
      .slice(-20)
      .map((msg: any) => `${msg.is_from_me ? 'Você' : contactName}: ${msg.content}`)
      .join('\n');

    // Mapeamento de tons
    const toneInstructions: Record<string, string> = {
      formal: 'Use linguagem formal, profissional e respeitosa. Evite gírias e seja direto.',
      casual: 'Use linguagem descontraída e amigável. Pode usar emojis ocasionalmente.',
      technical: 'Use termos técnicos quando apropriado. Seja preciso e detalhado.',
      friendly: 'Seja caloroso, empático e acolhedor. Demonstre interesse genuíno.',
    };

    const systemPrompt = `Você é um assistente de vendas experiente analisando uma conversa comercial de WhatsApp.
Tom das respostas: ${toneInstructions[tone] || toneInstructions.friendly}

Analise a conversa e forneça:

1. TRÊS sugestões de resposta contextualizadas (curtas, naturais, em português brasileiro)
2. Score de sentimento (0 a 1, onde 0 = muito negativo, 0.5 = neutro, 1 = muito positivo)
3. Intenção detectada (duvida, objecao, interesse, compra, reclamacao, neutro)
4. Temperatura do lead (cold, warm, hot)
5. Urgência (baixa, média, alta)
6. Um resumo conciso da conversa (máximo 3 linhas)
7. Lista de 2-3 ações sugeridas com tipo e descrição
8. Se houver menção a concorrentes, retorne battle_card: true

Responda APENAS com JSON válido no formato:
{
  "suggestions": ["sugestão 1", "sugestão 2", "sugestão 3"],
  "sentiment": 0.8,
  "intent": "interesse",
  "temperature": "hot",
  "urgency": "alta",
  "summary": "Cliente demonstrou interesse em produto X, já recebeu proposta e aguarda aprovação interna.",
  "next_action": "enviar follow-up",
  "suggested_actions": [
    {"type": "task", "label": "Criar follow-up", "description": "Agendar contato em 2 dias"},
    {"type": "proposal", "label": "Enviar proposta", "description": "Cliente solicitou proposta formal"}
  ],
  "battle_card": false,
  "competitor_mentioned": null
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Contato: ${contactName}${contactCompany ? ` (${contactCompany})` : ''}\n\nConversa:\n${conversationContext}\n\nAnalise e responda em JSON.`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices?.[0]?.message?.content || '{}';
    
    // Parse JSON da resposta
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-conversation:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestions: [],
        sentiment: 0.5,
        intent: 'neutro',
        temperature: 'warm',
        urgency: 'média',
        summary: '',
        next_action: 'continuar conversa',
        suggested_actions: []
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
