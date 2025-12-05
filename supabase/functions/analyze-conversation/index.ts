import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, contactName, contactCompany, tone = 'friendly', salesScript, geminiApiKey, openaiApiKey, groqApiKey } = await req.json();

    console.log('Keys received:', {
      hasGemini: !!geminiApiKey,
      hasOpenAI: !!openaiApiKey,
      hasGroq: !!groqApiKey,
      groqKeyLength: groqApiKey?.length || 0
    });

    // Construir contexto das últimas mensagens
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

    let systemPrompt = `Você é um assistente de vendas experiente analisando uma conversa comercial de WhatsApp.
Tom das respostas: ${toneInstructions[tone] || toneInstructions.friendly}`;

    if (salesScript) {
      systemPrompt += `\n\nDIRETRIZES E SCRIPT DE VENDAS (IMPORTANTE):
Siga estas instruções rigorosamente ao sugerir respostas:
${salesScript}`;
    }

    systemPrompt += `\n\nAnalise a conversa e forneça:

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

    const userMessage = `Contato: ${contactName}${contactCompany ? ` (${contactCompany})` : ''}\n\nConversa:\n${conversationContext}\n\nAnalise e responda em JSON.`;

    let analysis = null;
    let error = null;

    // Tentar Groq primeiro (gratuito e rápido)
    if (groqApiKey) {
      try {
        console.log('Trying Groq API with key length:', groqApiKey.length);
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
          }),
        });

        console.log('Groq response status:', groqResponse.status);

        if (groqResponse.ok) {
          const data = await groqResponse.json();
          const analysisText = data.choices?.[0]?.message?.content || '{}';
          console.log('Groq response text:', analysisText.substring(0, 200));
          const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
          analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } else {
          const errorData = await groqResponse.text();
          console.error('Groq API error:', groqResponse.status, errorData);
        }
      } catch (e: any) {
        console.error('Groq error:', e.message);
      }
    }

    // Tentar Gemini se Groq falhou
    if (!analysis && geminiApiKey) {
      try {
        console.log('Trying Gemini API with key length:', geminiApiKey.length);
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: systemPrompt + '\n\n' + userMessage }]
              }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
              }
            })
          }
        );

        console.log('Gemini response status:', geminiResponse.status);

        if (geminiResponse.ok) {
          const data = await geminiResponse.json();
          const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
          const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
          analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } else {
          const errorData = await geminiResponse.json().catch(() => ({}));
          const status = geminiResponse.status;

          // Check for quota exceeded (429) or resource exhausted
          if (status === 429 || errorData?.error?.status === 'RESOURCE_EXHAUSTED') {
            error = 'QUOTA_EXCEEDED';
          } else {
            error = `Gemini API error: ${status}`;
          }
          console.error(error, errorData);
        }
      } catch (e: any) {
        error = `Gemini error: ${e.message}`;
        console.error(error);
      }
    }

    // Fallback para OpenAI se Gemini falhou
    if (!analysis && openaiApiKey) {
      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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

        if (openaiResponse.ok) {
          const data = await openaiResponse.json();
          const analysisText = data.choices?.[0]?.message?.content || '{}';
          const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
          analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
          error = null; // Clear error since OpenAI worked
        } else {
          throw new Error(`OpenAI API error: ${openaiResponse.status}`);
        }
      } catch (e: any) {
        // Keep original Gemini error if OpenAI also fails
        console.error(`OpenAI fallback failed: ${e.message}`);
      }
    }

    // Fallback para Groq se Gemini e OpenAI falharam
    if (!analysis && groqApiKey) {
      try {
        console.log('Trying Groq API');
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage }
            ],
            temperature: 0.7,
          }),
        });

        console.log('Groq response status:', groqResponse.status);

        if (groqResponse.ok) {
          const data = await groqResponse.json();
          const analysisText = data.choices?.[0]?.message?.content || '{}';
          const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
          analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
          error = null;
        } else {
          console.error(`Groq API error: ${groqResponse.status}`);
        }
      } catch (e: any) {
        console.error(`Groq fallback failed: ${e.message}`);
      }
    }

    // Return quota exceeded specifically for upgrade prompt
    if (!analysis && error === 'QUOTA_EXCEEDED' && !openaiApiKey) {
      return new Response(JSON.stringify({
        error: 'QUOTA_EXCEEDED',
        quota_exceeded: true,
        suggestions: [],
        sentiment: 0.5,
        intent: 'neutro',
        temperature: 'warm',
        urgency: 'média',
        summary: '',
        next_action: '',
        suggested_actions: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!analysis) {
      throw new Error(error || 'No API keys provided or all providers failed');
    }

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
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
