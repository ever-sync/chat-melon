import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ai-key",
};

interface AIWebhookPayload {
  // Identificação
  conversation_id: string;
  contact_id: string;
  company_id: string;
  message_id?: string;
  
  // Tipo de evento
  event_type: 'message_sent' | 'insight_detected' | 'qualification_update' | 
              'summary_generated' | 'handoff_triggered' | 'suggestion_created';
  
  // Dados da mensagem (se event_type = message_sent)
  message?: {
    content: string;
    model: string;
    response_time_ms: number;
    confidence: number;
    intent_detected?: string;
    sentiment?: string;
  };
  
  // Insights detectados
  insights?: Array<{
    type: string;
    title: string;
    description?: string;
    value?: string;
    confidence?: number;
    product_name?: string;
    interest_level?: number;
  }>;
  
  // Qualificação BANT
  qualification?: {
    budget_score?: number;
    budget_notes?: string;
    authority_score?: number;
    authority_notes?: string;
    need_score?: number;
    need_notes?: string;
    timing_score?: number;
    timing_notes?: string;
    communication_style?: string;
    price_sensitivity?: string;
    decision_speed?: string;
  };
  
  // Resumo da conversa
  summary?: {
    text: string;
    next_step?: string;
  };
  
  // Sugestões para vendedor
  suggestions?: Array<{
    type: string;
    title: string;
    content: string;
    priority?: string;
    confidence?: number;
  }>;
  
  // Handoff
  handoff?: {
    reason: string;
    suggested_agent_id?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Validar API key do N8N
    const aiKey = req.headers.get("x-ai-key");
    if (!aiKey) {
      throw new Error("API key não fornecida");
    }

    // Verificar se a key é válida
    const { data: settings } = await supabase
      .from('ai_settings')
      .select('company_id')
      .eq('n8n_api_key', aiKey)
      .single();

    if (!settings) {
      throw new Error("API key inválida");
    }

    const payload: AIWebhookPayload = await req.json();
    const { event_type, conversation_id, contact_id, company_id } = payload;

    console.log(`[AI Webhook] Event: ${event_type}, Conversation: ${conversation_id}`);

    switch (event_type) {
      case 'message_sent':
        await handleMessageSent(supabase, payload);
        break;
        
      case 'insight_detected':
        await handleInsightDetected(supabase, payload);
        break;
        
      case 'qualification_update':
        await handleQualificationUpdate(supabase, payload);
        break;
        
      case 'summary_generated':
        await handleSummaryGenerated(supabase, payload);
        break;
        
      case 'handoff_triggered':
        await handleHandoffTriggered(supabase, payload);
        break;
        
      case 'suggestion_created':
        await handleSuggestionCreated(supabase, payload);
        break;
        
      default:
        console.log(`Unknown event type: ${event_type}`);
    }

    // Atualizar métricas diárias
    await updateDailyMetrics(supabase, company_id, event_type, payload);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleMessageSent(supabase: any, payload: AIWebhookPayload) {
  const { conversation_id, contact_id, company_id, message } = payload;
  
  if (!message) return;
  
  // Buscar dados da conversa e instância para enviar no WhatsApp
  const { data: conversation } = await supabase
    .from('conversations')
    .select('contact_number')
    .eq('id', conversation_id)
    .maybeSingle();

  const { data: evolutionSettings } = await supabase
    .from('evolution_settings')
    .select('instance_name, api_url, api_key')
    .eq('company_id', company_id)
    .eq('is_connected', true)
    .maybeSingle();

  if (!conversation || !evolutionSettings) {
    console.error('❌ Conversa ou instância não encontrada');
    return;
  }

  // Criar mensagem no banco primeiro (status pending)
  const { data: newMessage } = await supabase
    .from('messages')
    .insert({
      conversation_id,
      company_id,
      content: message.content,
      content_type: 'text',
      is_from_me: true,
      is_from_ai: true,
      ai_model: message.model,
      ai_response_time_ms: message.response_time_ms,
      ai_confidence: message.confidence,
      ai_intent_detected: message.intent_detected,
      ai_sentiment: message.sentiment,
      status: 'pending',
    })
    .select()
    .single();

  // Enviar via Evolution API
  const evolutionUrl = evolutionSettings.api_url || Deno.env.get('EVOLUTION_API_URL');
  const evolutionKey = evolutionSettings.api_key || Deno.env.get('EVOLUTION_API_KEY');
  const instanceName = evolutionSettings.instance_name;
  const phoneNumber = conversation.contact_number;

  if (evolutionUrl && evolutionKey && instanceName && phoneNumber) {
    try {
      console.log(`📤 Enviando resposta da IA para ${phoneNumber} via ${instanceName}`);
      
      const sendResponse = await fetch(
        `${evolutionUrl}/message/sendText/${instanceName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionKey,
          },
          body: JSON.stringify({
            number: phoneNumber,
            text: message.content,
            delay: 1500, // Delay para parecer humano
          }),
        }
      );

      if (sendResponse.ok) {
        const responseData = await sendResponse.json();
        
        // Atualizar mensagem com external_id e status
        await supabase
          .from('messages')
          .update({ 
            status: 'sent',
            external_id: responseData.key?.id
          })
          .eq('id', newMessage.id);
          
        console.log('✅ Mensagem da IA enviada no WhatsApp');
      } else {
        const errorText = await sendResponse.text();
        console.error('❌ Erro ao enviar no WhatsApp:', sendResponse.status, errorText);
        
        // Atualizar status para erro
        await supabase
          .from('messages')
          .update({ status: 'error' })
          .eq('id', newMessage.id);
      }
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem no WhatsApp:', error);
      
      await supabase
        .from('messages')
        .update({ status: 'error' })
        .eq('id', newMessage.id);
    }
  } else {
    console.error('❌ Dados insuficientes para enviar mensagem:', {
      evolutionUrl: !!evolutionUrl,
      evolutionKey: !!evolutionKey,
      instanceName,
      phoneNumber
    });
  }
  
  // Atualizar conversa
  const { data: conv } = await supabase
    .from('conversations')
    .select('ai_messages_count')
    .eq('id', conversation_id)
    .maybeSingle();
  
  await supabase
    .from('conversations')
    .update({
      ai_messages_count: (conv?.ai_messages_count || 0) + 1,
      last_message: message.content,
      last_message_time: new Date().toISOString(),
    })
    .eq('id', conversation_id);

  return newMessage;
}

async function handleInsightDetected(supabase: any, payload: AIWebhookPayload) {
  const { conversation_id, contact_id, company_id, insights, message_id } = payload;
  
  if (!insights || insights.length === 0) return;
  
  const insightsToInsert = insights.map(insight => ({
    company_id,
    contact_id,
    conversation_id,
    message_id,
    insight_type: insight.type,
    title: insight.title,
    description: insight.description,
    value: insight.value,
    confidence: insight.confidence || 0.8,
    product_name: insight.product_name,
    interest_level: insight.interest_level,
    source: 'ai',
  }));
  
  await supabase.from('lead_insights').insert(insightsToInsert);
  
  // Atualizar tags do contato baseado nos insights
  const productInterests = insights
    .filter(i => i.type === 'product_interest')
    .map(i => i.product_name)
    .filter(Boolean);
  
  if (productInterests.length > 0) {
    const { data: contact } = await supabase
      .from('contacts')
      .select('ai_tags')
      .eq('id', contact_id)
      .single();
    
    const existingTags = contact?.ai_tags || [];
    const newTags = [...new Set([...existingTags, ...productInterests])];
    
    await supabase
      .from('contacts')
      .update({ ai_tags: newTags })
      .eq('id', contact_id);
  }
}

async function handleQualificationUpdate(supabase: any, payload: AIWebhookPayload) {
  const { contact_id, company_id, qualification } = payload;
  
  if (!qualification) return;
  
  // Upsert qualificação
  await supabase
    .from('lead_qualification')
    .upsert({
      company_id,
      contact_id,
      ...qualification,
      ai_generated: true,
      last_updated_by: 'ai',
    }, {
      onConflict: 'contact_id',
    });
  
  // Atualizar nível de qualificação no contato
  const totalScore = (qualification.budget_score || 0) + 
                     (qualification.authority_score || 0) + 
                     (qualification.need_score || 0) + 
                     (qualification.timing_score || 0);
  
  let level = 'cold';
  if (totalScore >= 80) level = 'hot';
  else if (totalScore >= 50) level = 'warm';
  else if (totalScore >= 25) level = 'cool';
  
  await supabase
    .from('contacts')
    .update({
      ai_qualification_level: level,
      ai_last_analyzed_at: new Date().toISOString(),
    })
    .eq('id', contact_id);
}

async function handleSummaryGenerated(supabase: any, payload: AIWebhookPayload) {
  const { conversation_id, contact_id, summary } = payload;
  
  if (!summary) return;
  
  // Atualizar resumo na conversa
  await supabase
    .from('conversations')
    .update({
      ai_summary: summary.text,
      ai_summary_updated_at: new Date().toISOString(),
      ai_next_step_suggestion: summary.next_step,
    })
    .eq('id', conversation_id);
  
  // Atualizar resumo no contato
  await supabase
    .from('contacts')
    .update({
      ai_summary: summary.text,
      ai_next_best_action: summary.next_step,
    })
    .eq('id', contact_id);
}

async function handleHandoffTriggered(supabase: any, payload: AIWebhookPayload) {
  const { conversation_id, handoff } = payload;
  
  if (!handoff) return;
  
  // Atualizar conversa
  await supabase
    .from('conversations')
    .update({
      ai_enabled: false,
      ai_paused_at: new Date().toISOString(),
      ai_handoff_at: new Date().toISOString(),
      ai_handoff_reason: handoff.reason,
      status: 'waiting', // Aguardando atendente
    })
    .eq('id', conversation_id);
  
  // Criar mensagem de sistema
  await supabase
    .from('messages')
    .insert({
      conversation_id,
      content: `🤖 IA transferiu o atendimento: ${handoff.reason}`,
      content_type: 'system',
      is_from_me: true,
      is_from_ai: true,
    });
  
  // Se tiver agente sugerido, atribuir
  if (handoff.suggested_agent_id) {
    await supabase
      .from('conversations')
      .update({ assigned_to: handoff.suggested_agent_id })
      .eq('id', conversation_id);
  }
}

async function handleSuggestionCreated(supabase: any, payload: AIWebhookPayload) {
  const { conversation_id, contact_id, company_id, suggestions, message_id } = payload;
  
  if (!suggestions || suggestions.length === 0) return;
  
  const suggestionsToInsert = suggestions.map(s => ({
    company_id,
    conversation_id,
    contact_id,
    suggestion_type: s.type,
    title: s.title,
    content: s.content,
    priority: s.priority || 'medium',
    confidence: s.confidence || 0.8,
    trigger_message_id: message_id,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
  }));
  
  await supabase.from('ai_suggestions').insert(suggestionsToInsert);
}

async function updateDailyMetrics(supabase: any, company_id: string, event_type: string, payload: AIWebhookPayload) {
  const today = new Date().toISOString().split('T')[0];
  
  // Buscar ou criar registro de métricas do dia
  const { data: existing } = await supabase
    .from('ai_metrics_daily')
    .select('*')
    .eq('company_id', company_id)
    .eq('metric_date', today)
    .single();
  
  const updates: any = {};
  
  switch (event_type) {
    case 'message_sent':
      updates.messages_sent = (existing?.messages_sent || 0) + 1;
      if (payload.message?.response_time_ms) {
        const currentAvg = existing?.avg_response_time_ms || 0;
        const currentCount = existing?.messages_sent || 0;
        updates.avg_response_time_ms = Math.round(
          (currentAvg * currentCount + payload.message.response_time_ms) / (currentCount + 1)
        );
      }
      if (payload.message?.sentiment) {
        updates[`sentiment_${payload.message.sentiment}`] = (existing?.[`sentiment_${payload.message.sentiment}`] || 0) + 1;
      }
      break;
      
    case 'handoff_triggered':
      updates.handoffs_total = (existing?.handoffs_total || 0) + 1;
      if (payload.handoff?.reason === 'user_requested') {
        updates.handoffs_requested = (existing?.handoffs_requested || 0) + 1;
      } else if (payload.handoff?.reason === 'negative_sentiment') {
        updates.handoffs_sentiment = (existing?.handoffs_sentiment || 0) + 1;
      } else {
        updates.handoffs_automatic = (existing?.handoffs_automatic || 0) + 1;
      }
      break;
      
    case 'qualification_update':
      if (payload.qualification) {
        const total = (payload.qualification.budget_score || 0) + 
                      (payload.qualification.authority_score || 0) + 
                      (payload.qualification.need_score || 0) + 
                      (payload.qualification.timing_score || 0);
        if (total >= 50) {
          updates.leads_qualified = (existing?.leads_qualified || 0) + 1;
        }
      }
      break;
  }
  
  if (Object.keys(updates).length > 0) {
    await supabase
      .from('ai_metrics_daily')
      .upsert({
        company_id,
        metric_date: today,
        ...updates,
      }, {
        onConflict: 'company_id,metric_date',
      });
  }
}
