import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIAgent {
  id: string;
  company_id: string;
  name: string;
  status: string;
  autonomy_level: string;
  handoff_behavior: string;
  confidence_threshold: number;
  personality_style: string;
  custom_personality?: string;
  language: string;
  tone_formality: number;
  use_emojis: boolean;
  system_prompt: string;
  knowledge_base: any[];
  crm_context_enabled: boolean;
  conversation_history_limit: number;
  max_response_length: number;
  response_delay_ms: number;
  fallback_type: string;
  fallback_message?: string;
  max_messages_per_session: number;
  session_timeout_minutes: number;
}

interface AIAgentChannel {
  id: string;
  agent_id: string;
  channel_id: string;
  is_enabled: boolean;
  trigger_type: string;
  trigger_config: any;
  welcome_message?: string;
  channel_specific_prompt?: string;
}

interface Message {
  id: string;
  content: string;
  is_from_me: boolean;
  created_at: string;
  message_type: string;
}

interface ProcessRequest {
  event_type: 'new_message' | 'conversation_started' | 'session_timeout';
  conversation_id: string;
  channel_id: string;
  contact_id: string;
  company_id: string;
  message?: {
    id: string;
    content: string;
    message_type: string;
  };
}

interface AIResponse {
  should_respond: boolean;
  response?: string;
  confidence: number;
  detected_intent?: string;
  detected_sentiment?: string;
  action?: string;
  should_handoff?: boolean;
  handoff_reason?: string;
  collected_data?: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const request: ProcessRequest = await req.json();
    const { event_type, conversation_id, channel_id, contact_id, company_id, message } = request;

    console.log(`[AI Agent] Processing ${event_type} for conversation ${conversation_id}`);

    // 1. Buscar agente ativo para este canal
    const { data: agentChannels, error: channelError } = await supabase
      .from('ai_agent_channels')
      .select(`
        *,
        agent:ai_agents(*)
      `)
      .eq('channel_id', channel_id)
      .eq('is_enabled', true)
      .order('priority', { ascending: true });

    if (channelError) {
      console.error('Error fetching agent channels:', channelError);
      throw channelError;
    }

    if (!agentChannels || agentChannels.length === 0) {
      return new Response(
        JSON.stringify({ processed: false, reason: 'No active agent for this channel' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Encontrar agente ativo
    const activeAgentChannel = agentChannels.find(
      (ac) => ac.agent?.status === 'active'
    );

    if (!activeAgentChannel) {
      return new Response(
        JSON.stringify({ processed: false, reason: 'No active agent found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const agent: AIAgent = activeAgentChannel.agent;
    const agentChannel: AIAgentChannel = activeAgentChannel;

    // 2. Verificar ou criar sessão
    let { data: session, error: sessionError } = await supabase
      .from('ai_agent_sessions')
      .select('*')
      .eq('conversation_id', conversation_id)
      .eq('agent_id', agent.id)
      .in('status', ['active', 'waiting_response'])
      .single();

    if (sessionError && sessionError.code !== 'PGRST116') {
      console.error('Error fetching session:', sessionError);
    }

    const isNewSession = !session;

    if (isNewSession) {
      // Criar nova sessão
      const { data: newSession, error: createError } = await supabase
        .from('ai_agent_sessions')
        .insert({
          agent_id: agent.id,
          conversation_id,
          contact_id,
          channel_id,
          company_id,
          status: 'active',
          context: {},
          collected_data: {},
          intent_history: [],
          sentiment_history: [],
          messages_sent: 0,
          messages_received: 0,
          confidence_scores: [],
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating session:', createError);
        throw createError;
      }

      session = newSession;

      // Enviar mensagem de boas-vindas se configurada
      if (agentChannel.welcome_message && event_type === 'conversation_started') {
        const welcomeResponse = await processWelcomeMessage(
          supabase,
          agentChannel.welcome_message,
          contact_id,
          company_id
        );

        if (welcomeResponse) {
          await logAction(supabase, session.id, agent.id, company_id, {
            action_type: 'send_message',
            action_name: 'welcome_message',
            output_data: { message: welcomeResponse },
            success: true,
          });

          return new Response(
            JSON.stringify({
              processed: true,
              response: welcomeResponse,
              session_id: session.id,
              is_new_session: true,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // 3. Verificar limites da sessão
    if (session.messages_received >= agent.max_messages_per_session) {
      // Limite atingido - iniciar handoff
      const handoffResponse = await initiateHandoff(
        supabase,
        session,
        agent,
        'session_limit_reached',
        'Limite de mensagens da sessão atingido'
      );

      return new Response(
        JSON.stringify({
          processed: true,
          response: handoffResponse.message,
          should_handoff: true,
          handoff_reason: 'session_limit_reached',
          session_id: session.id,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Processar mensagem se houver
    if (!message || event_type !== 'new_message') {
      return new Response(
        JSON.stringify({ processed: true, reason: 'No message to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Buscar contexto
    const context = await buildContext(
      supabase,
      conversation_id,
      contact_id,
      company_id,
      agent,
      session
    );

    // 6. Buscar skills relevantes
    const { data: skills } = await supabase
      .from('ai_agent_skills')
      .select('*')
      .eq('agent_id', agent.id)
      .eq('is_enabled', true)
      .order('priority', { ascending: true });

    // 7. Verificar regras de handoff primeiro
    const { data: handoffRules } = await supabase
      .from('ai_agent_handoff_rules')
      .select('*')
      .eq('agent_id', agent.id)
      .eq('is_enabled', true)
      .order('priority', { ascending: true });

    const handoffCheck = await checkHandoffRules(
      handoffRules || [],
      message.content,
      context,
      session
    );

    if (handoffCheck.should_handoff) {
      const handoffResponse = await initiateHandoff(
        supabase,
        session,
        agent,
        handoffCheck.rule_name || 'rule_triggered',
        handoffCheck.reason || 'Regra de handoff ativada'
      );

      await logAction(supabase, session.id, agent.id, company_id, {
        action_type: 'handoff',
        action_name: handoffCheck.rule_name,
        input_data: { message: message.content },
        output_data: { reason: handoffCheck.reason },
        success: true,
      });

      return new Response(
        JSON.stringify({
          processed: true,
          response: handoffCheck.pre_message || handoffResponse.message,
          should_handoff: true,
          handoff_reason: handoffCheck.reason,
          session_id: session.id,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Verificar skills
    const matchedSkill = matchSkill(skills || [], message.content);

    if (matchedSkill && matchedSkill.responses?.length > 0) {
      // Usar resposta da skill
      const skillResponse = selectSkillResponse(matchedSkill.responses);
      const processedResponse = await processVariables(
        skillResponse,
        context.contact,
        context.company
      );

      await updateSession(supabase, session.id, {
        messages_received: session.messages_received + 1,
        messages_sent: session.messages_sent + 1,
        last_activity_at: new Date().toISOString(),
        intent_history: [...(session.intent_history || []), matchedSkill.skill_type],
      });

      await updateSkillMetrics(supabase, matchedSkill.id);

      await logAction(supabase, session.id, agent.id, company_id, {
        action_type: 'send_message',
        action_name: 'skill_response',
        skill_id: matchedSkill.id,
        input_data: { message: message.content },
        output_data: { response: processedResponse },
        detected_intent: matchedSkill.skill_type,
        confidence_score: 0.95,
        success: true,
      });

      return new Response(
        JSON.stringify({
          processed: true,
          response: processedResponse,
          session_id: session.id,
          matched_skill: matchedSkill.skill_name,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 9. Gerar resposta com IA
    const aiResponse = await generateAIResponse(
      supabase,
      agent,
      agentChannel,
      message.content,
      context,
      skills || []
    );

    // 10. Verificar confiança
    if (aiResponse.confidence < agent.confidence_threshold) {
      // Confiança baixa - aplicar fallback
      const fallbackResponse = await applyFallback(
        agent,
        context,
        aiResponse
      );

      if (fallbackResponse.should_handoff) {
        const handoffResponse = await initiateHandoff(
          supabase,
          session,
          agent,
          'low_confidence',
          'Confiança baixa na resposta'
        );

        return new Response(
          JSON.stringify({
            processed: true,
            response: fallbackResponse.message || handoffResponse.message,
            should_handoff: true,
            handoff_reason: 'low_confidence',
            session_id: session.id,
            confidence: aiResponse.confidence,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          processed: true,
          response: fallbackResponse.message,
          session_id: session.id,
          confidence: aiResponse.confidence,
          is_fallback: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 11. Enviar resposta gerada pela IA
    await updateSession(supabase, session.id, {
      messages_received: session.messages_received + 1,
      messages_sent: session.messages_sent + 1,
      last_activity_at: new Date().toISOString(),
      confidence_scores: [...(session.confidence_scores || []), aiResponse.confidence],
      intent_history: aiResponse.detected_intent
        ? [...(session.intent_history || []), aiResponse.detected_intent]
        : session.intent_history,
      sentiment_history: aiResponse.detected_sentiment
        ? [...(session.sentiment_history || []), aiResponse.detected_sentiment]
        : session.sentiment_history,
    });

    await logAction(supabase, session.id, agent.id, company_id, {
      action_type: 'send_message',
      action_name: 'ai_response',
      input_data: { message: message.content },
      output_data: { response: aiResponse.response },
      detected_intent: aiResponse.detected_intent,
      detected_sentiment: aiResponse.detected_sentiment,
      confidence_score: aiResponse.confidence,
      success: true,
    });

    return new Response(
      JSON.stringify({
        processed: true,
        response: aiResponse.response,
        session_id: session.id,
        confidence: aiResponse.confidence,
        detected_intent: aiResponse.detected_intent,
        detected_sentiment: aiResponse.detected_sentiment,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI Agent Process Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function buildContext(
  supabase: any,
  conversationId: string,
  contactId: string,
  companyId: string,
  agent: AIAgent,
  session: any
) {
  // Buscar contato
  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single();

  // Buscar empresa
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();

  // Buscar histórico de mensagens
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(agent.conversation_history_limit);

  // Buscar deal se houver
  const { data: deal } = await supabase
    .from('deals')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return {
    contact,
    company,
    messages: messages?.reverse() || [],
    deal,
    session,
  };
}

async function generateAIResponse(
  supabase: any,
  agent: AIAgent,
  channel: AIAgentChannel,
  userMessage: string,
  context: any,
  skills: any[]
): Promise<AIResponse> {
  // Buscar configurações de IA da empresa
  const { data: aiSettings } = await supabase
    .from('ai_settings')
    .select('*')
    .eq('company_id', agent.company_id)
    .single();

  // Montar prompt do sistema
  const systemPrompt = buildSystemPrompt(agent, channel, context, skills);

  // Montar histórico de conversa
  const conversationHistory = context.messages.map((m: Message) => ({
    role: m.is_from_me ? 'assistant' : 'user',
    content: m.content,
  }));

  // Adicionar mensagem atual
  conversationHistory.push({ role: 'user', content: userMessage });

  // Tentar com Gemini primeiro
  if (aiSettings?.gemini_api_key) {
    try {
      const response = await callGemini(
        aiSettings.gemini_api_key,
        systemPrompt,
        conversationHistory,
        agent
      );
      return response;
    } catch (e) {
      console.error('Gemini error:', e);
    }
  }

  // Fallback para Groq
  if (aiSettings?.groq_api_key) {
    try {
      const response = await callGroq(
        aiSettings.groq_api_key,
        systemPrompt,
        conversationHistory,
        agent
      );
      return response;
    } catch (e) {
      console.error('Groq error:', e);
    }
  }

  // Fallback para OpenAI
  if (aiSettings?.openai_api_key) {
    try {
      const response = await callOpenAI(
        aiSettings.openai_api_key,
        systemPrompt,
        conversationHistory,
        agent
      );
      return response;
    } catch (e) {
      console.error('OpenAI error:', e);
    }
  }

  // Se nenhuma API funcionar, usar resposta padrão
  return {
    should_respond: true,
    response: agent.fallback_message || 'Desculpe, não consegui processar sua mensagem. Um atendente irá ajudá-lo em breve.',
    confidence: 0.3,
    should_handoff: true,
    handoff_reason: 'no_ai_available',
  };
}

function buildSystemPrompt(
  agent: AIAgent,
  channel: AIAgentChannel,
  context: any,
  skills: any[]
): string {
  let prompt = agent.system_prompt;

  // Adicionar prompt específico do canal
  if (channel.channel_specific_prompt) {
    prompt += `\n\n## Instruções específicas deste canal:\n${channel.channel_specific_prompt}`;
  }

  // Adicionar personalidade
  const personalityDescriptions: Record<string, string> = {
    professional: 'Seja formal, profissional e objetivo nas respostas.',
    friendly: 'Seja amigável, casual e descontraído.',
    empathetic: 'Seja empático, compreensivo e acolhedor.',
    direct: 'Seja direto, objetivo e sem rodeios.',
    enthusiastic: 'Seja entusiasmado, animado e positivo.',
    consultative: 'Seja consultivo, educador e detalhista.',
  };

  if (agent.personality_style !== 'custom' && personalityDescriptions[agent.personality_style]) {
    prompt += `\n\n## Estilo de comunicação:\n${personalityDescriptions[agent.personality_style]}`;
  }

  if (agent.custom_personality) {
    prompt += `\n\n## Personalidade:\n${agent.custom_personality}`;
  }

  // Nível de formalidade
  const formalityLevel = agent.tone_formality;
  if (formalityLevel <= 3) {
    prompt += '\n- Use linguagem informal, gírias leves são permitidas.';
  } else if (formalityLevel >= 8) {
    prompt += '\n- Use linguagem formal e profissional.';
  }

  // Emojis
  if (agent.use_emojis) {
    prompt += '\n- Você pode usar emojis moderadamente para expressar emoções.';
  } else {
    prompt += '\n- NÃO use emojis nas respostas.';
  }

  // Contexto do contato
  if (context.contact && agent.crm_context_enabled) {
    prompt += `\n\n## Informações do cliente:\n`;
    prompt += `- Nome: ${context.contact.name || 'Não informado'}\n`;
    prompt += `- Telefone: ${context.contact.phone || 'Não informado'}\n`;
    if (context.contact.email) prompt += `- Email: ${context.contact.email}\n`;
    if (context.contact.company_name) prompt += `- Empresa: ${context.contact.company_name}\n`;
  }

  // Skills disponíveis
  if (skills && skills.length > 0) {
    prompt += `\n\n## Tópicos que você conhece bem:\n`;
    skills.forEach((skill) => {
      prompt += `- ${skill.skill_name}: ${skill.description || ''}\n`;
    });
  }

  // Limites
  prompt += `\n\n## Limites:\n`;
  prompt += `- Mantenha respostas com no máximo ${agent.max_response_length} caracteres.\n`;
  prompt += `- Se não souber algo com certeza, admita e ofereça alternativas.\n`;
  prompt += `- Idioma: ${agent.language}\n`;

  return prompt;
}

async function callGemini(
  apiKey: string,
  systemPrompt: string,
  conversationHistory: { role: string; content: string }[],
  agent: AIAgent
): Promise<AIResponse> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }],
          },
          ...conversationHistory.map((msg) => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
          })),
        ],
        generationConfig: {
          maxOutputTokens: Math.min(agent.max_response_length, 1024),
          temperature: 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Detectar intenção e sentimento básicos
  const intent = detectIntent(conversationHistory[conversationHistory.length - 1]?.content || '');
  const sentiment = detectSentiment(conversationHistory[conversationHistory.length - 1]?.content || '');

  return {
    should_respond: true,
    response: text.substring(0, agent.max_response_length),
    confidence: 0.85,
    detected_intent: intent,
    detected_sentiment: sentiment,
  };
}

async function callGroq(
  apiKey: string,
  systemPrompt: string,
  conversationHistory: { role: string; content: string }[],
  agent: AIAgent
): Promise<AIResponse> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
      ],
      max_tokens: Math.min(agent.max_response_length, 1024),
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';

  return {
    should_respond: true,
    response: text.substring(0, agent.max_response_length),
    confidence: 0.8,
    detected_intent: detectIntent(conversationHistory[conversationHistory.length - 1]?.content || ''),
    detected_sentiment: detectSentiment(conversationHistory[conversationHistory.length - 1]?.content || ''),
  };
}

async function callOpenAI(
  apiKey: string,
  systemPrompt: string,
  conversationHistory: { role: string; content: string }[],
  agent: AIAgent
): Promise<AIResponse> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
      ],
      max_tokens: Math.min(agent.max_response_length, 1024),
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';

  return {
    should_respond: true,
    response: text.substring(0, agent.max_response_length),
    confidence: 0.9,
    detected_intent: detectIntent(conversationHistory[conversationHistory.length - 1]?.content || ''),
    detected_sentiment: detectSentiment(conversationHistory[conversationHistory.length - 1]?.content || ''),
  };
}

function detectIntent(message: string): string {
  const lower = message.toLowerCase();

  const intents: Record<string, string[]> = {
    greeting: ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'hello'],
    farewell: ['tchau', 'até logo', 'adeus', 'bye', 'valeu', 'obrigado', 'obrigada'],
    pricing: ['preço', 'valor', 'quanto custa', 'custo', 'orçamento', 'parcela'],
    complaint: ['reclamação', 'problema', 'insatisfeito', 'ruim', 'péssimo', 'horrível'],
    support: ['ajuda', 'suporte', 'não consigo', 'erro', 'bug', 'travou'],
    question: ['como', 'qual', 'quando', 'onde', 'por que', 'o que'],
    interest: ['interessado', 'quero', 'gostaria', 'preciso'],
    scheduling: ['agendar', 'marcar', 'horário', 'disponível'],
    human: ['atendente', 'humano', 'pessoa', 'falar com alguém'],
  };

  for (const [intent, keywords] of Object.entries(intents)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return intent;
    }
  }

  return 'general';
}

function detectSentiment(message: string): string {
  const lower = message.toLowerCase();

  const negativeWords = ['problema', 'ruim', 'péssimo', 'horrível', 'insatisfeito', 'raiva', 'irritado', 'chateado', 'decepcionado', 'absurdo', 'inaceitável'];
  const positiveWords = ['obrigado', 'obrigada', 'ótimo', 'excelente', 'perfeito', 'adorei', 'maravilhoso', 'incrível', 'satisfeito'];

  const negativeCount = negativeWords.filter((w) => lower.includes(w)).length;
  const positiveCount = positiveWords.filter((w) => lower.includes(w)).length;

  if (negativeCount > positiveCount) return 'negative';
  if (positiveCount > negativeCount) return 'positive';
  return 'neutral';
}

function matchSkill(skills: any[], message: string): any | null {
  const lower = message.toLowerCase();

  for (const skill of skills) {
    // Verificar keywords
    if (skill.trigger_keywords?.some((kw: string) => lower.includes(kw.toLowerCase()))) {
      return skill;
    }

    // Verificar patterns (regex)
    if (skill.trigger_patterns) {
      for (const pattern of skill.trigger_patterns) {
        try {
          const regex = new RegExp(pattern, 'i');
          if (regex.test(message)) {
            return skill;
          }
        } catch (e) {
          console.error('Invalid regex pattern:', pattern);
        }
      }
    }
  }

  return null;
}

function selectSkillResponse(responses: any[]): string {
  if (!responses || responses.length === 0) return '';

  // Se houver pesos, usar seleção ponderada
  const hasWeights = responses.some((r) => r.weight);
  if (hasWeights) {
    const totalWeight = responses.reduce((sum, r) => sum + (r.weight || 1), 0);
    let random = Math.random() * totalWeight;
    for (const response of responses) {
      random -= response.weight || 1;
      if (random <= 0) {
        return response.template;
      }
    }
  }

  // Seleção aleatória simples
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex].template;
}

async function processVariables(
  template: string,
  contact: any,
  company: any
): Promise<string> {
  let result = template;

  // Variáveis do contato
  result = result.replace(/\{\{nome\}\}/gi, contact?.name || 'Cliente');
  result = result.replace(/\{\{telefone\}\}/gi, contact?.phone || '');
  result = result.replace(/\{\{email\}\}/gi, contact?.email || '');
  result = result.replace(/\{\{empresa_contato\}\}/gi, contact?.company_name || '');

  // Variáveis da empresa
  result = result.replace(/\{\{empresa\}\}/gi, company?.name || '');

  // Variáveis de data/hora
  const now = new Date();
  result = result.replace(/\{\{horario\}\}/gi, now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  result = result.replace(/\{\{data\}\}/gi, now.toLocaleDateString('pt-BR'));

  const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  result = result.replace(/\{\{dia_semana\}\}/gi, weekdays[now.getDay()]);

  return result;
}

async function processWelcomeMessage(
  supabase: any,
  welcomeMessage: string,
  contactId: string,
  companyId: string
): Promise<string> {
  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single();

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();

  return processVariables(welcomeMessage, contact, company);
}

async function checkHandoffRules(
  rules: any[],
  message: string,
  context: any,
  session: any
): Promise<{
  should_handoff: boolean;
  rule_name?: string;
  reason?: string;
  pre_message?: string;
}> {
  const lower = message.toLowerCase();

  for (const rule of rules) {
    for (const condition of rule.conditions) {
      let conditionMet = false;

      switch (condition.type) {
        case 'keyword':
          const keywords = (condition.value as string).split(',').map((k: string) => k.trim().toLowerCase());
          conditionMet = keywords.some((kw) => lower.includes(kw));
          break;

        case 'sentiment':
          const sentiment = detectSentiment(message);
          if (condition.operator === 'equals') {
            conditionMet = sentiment === condition.value;
          }
          // Verificar consecutivos
          if (conditionMet && condition.consecutive) {
            const recentSentiments = session.sentiment_history?.slice(-condition.consecutive) || [];
            conditionMet = recentSentiments.filter((s: string) => s === condition.value).length >= condition.consecutive - 1;
          }
          break;

        case 'confidence':
          const lastConfidence = session.confidence_scores?.slice(-1)[0] || 1;
          if (condition.operator === 'less_than') {
            conditionMet = lastConfidence < (condition.value as number);
          }
          break;

        case 'messages_count':
          if (condition.operator === 'greater_than') {
            conditionMet = session.messages_received > (condition.value as number);
          }
          break;

        case 'intent':
          const intent = detectIntent(message);
          conditionMet = intent === condition.value || (condition.value as string).split(',').includes(intent);
          break;
      }

      if (conditionMet) {
        return {
          should_handoff: true,
          rule_name: rule.name,
          reason: rule.description || condition.type,
          pre_message: rule.pre_handoff_message,
        };
      }
    }
  }

  return { should_handoff: false };
}

async function initiateHandoff(
  supabase: any,
  session: any,
  agent: AIAgent,
  reason: string,
  description: string
): Promise<{ success: boolean; message: string }> {
  // Atualizar sessão
  await supabase
    .from('ai_agent_sessions')
    .update({
      status: 'handed_off',
      handoff_reason: description,
      handoff_at: new Date().toISOString(),
    })
    .eq('id', session.id);

  // Atualizar conversa para status waiting
  await supabase
    .from('conversations')
    .update({
      status: 'waiting',
    })
    .eq('id', session.conversation_id);

  // Incrementar contador de handoffs do agente
  await supabase.rpc('increment_agent_handoffs', { agent_id: agent.id });

  // Mensagem padrão de handoff
  const defaultMessage = agent.fallback_message ||
    'Um momento! Estou transferindo você para um de nossos atendentes que poderá ajudar melhor com sua solicitação.';

  return {
    success: true,
    message: defaultMessage,
  };
}

async function applyFallback(
  agent: AIAgent,
  context: any,
  aiResponse: AIResponse
): Promise<{ message: string; should_handoff: boolean }> {
  switch (agent.fallback_type) {
    case 'apologize_handoff':
      return {
        message: agent.fallback_message || 'Desculpe, não consegui entender completamente. Vou transferir você para um atendente.',
        should_handoff: true,
      };

    case 'ask_rephrase':
      return {
        message: 'Desculpe, não entendi bem. Você poderia reformular sua pergunta de outra forma?',
        should_handoff: false,
      };

    case 'offer_options':
      return {
        message: 'Não tenho certeza do que você precisa. Posso ajudar com:\n1. Informações sobre produtos\n2. Preços\n3. Suporte técnico\n4. Falar com um atendente\n\nDigite o número da opção desejada.',
        should_handoff: false,
      };

    case 'collect_contact':
      return {
        message: 'Para melhor atendê-lo, poderia me informar seu nome e telefone? Um de nossos atendentes entrará em contato.',
        should_handoff: false,
      };

    case 'schedule_callback':
      return {
        message: 'Gostaria de agendar uma ligação com nossa equipe? Qual o melhor horário para você?',
        should_handoff: false,
      };

    case 'custom_message':
      return {
        message: agent.fallback_message || 'Por favor, aguarde enquanto verifico isso.',
        should_handoff: false,
      };

    default:
      return {
        message: 'Um momento, por favor.',
        should_handoff: false,
      };
  }
}

async function updateSession(
  supabase: any,
  sessionId: string,
  updates: Record<string, unknown>
): Promise<void> {
  await supabase
    .from('ai_agent_sessions')
    .update(updates)
    .eq('id', sessionId);
}

async function updateSkillMetrics(
  supabase: any,
  skillId: string
): Promise<void> {
  await supabase.rpc('increment_skill_triggered', { skill_id: skillId });
}

async function logAction(
  supabase: any,
  sessionId: string,
  agentId: string,
  companyId: string,
  action: {
    action_type: string;
    action_name?: string;
    skill_id?: string;
    flow_id?: string;
    node_id?: string;
    input_data?: Record<string, unknown>;
    output_data?: Record<string, unknown>;
    detected_intent?: string;
    detected_sentiment?: string;
    confidence_score?: number;
    success: boolean;
    error_message?: string;
    processing_time_ms?: number;
  }
): Promise<void> {
  await supabase.from('ai_agent_action_logs').insert({
    session_id: sessionId,
    agent_id: agentId,
    company_id: companyId,
    ...action,
  });
}
