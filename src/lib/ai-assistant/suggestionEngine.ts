import {
  SuggestionForAgent,
  MessageForAnalysis,
  Priority,
  SuggestionType,
  Sentiment,
} from '@/types/ai-assistant';
import { analyzeSentiment } from './qualityScoring';

// Intenções comuns dos clientes
type CustomerIntent =
  | 'greeting'
  | 'question'
  | 'complaint'
  | 'request'
  | 'cancellation'
  | 'pricing'
  | 'support'
  | 'feedback'
  | 'followup'
  | 'unknown';

// Palavras-chave por intenção
const INTENT_KEYWORDS: Record<CustomerIntent, string[]> = {
  greeting: ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'ola', 'hey', 'opa'],
  question: ['como', 'quando', 'onde', 'qual', 'quanto', 'quem', 'por que', 'porque', '?'],
  complaint: ['problema', 'erro', 'bug', 'não funciona', 'travou', 'ruim', 'péssimo', 'horrível'],
  request: ['preciso', 'gostaria', 'poderia', 'pode', 'quero', 'necessito', 'solicito'],
  cancellation: ['cancelar', 'cancelamento', 'desistir', 'encerrar', 'parar', 'sair'],
  pricing: ['preço', 'valor', 'quanto custa', 'plano', 'desconto', 'promoção', 'pagamento'],
  support: ['ajuda', 'suporte', 'assistência', 'auxílio', 'socorro', 'me ajude'],
  feedback: ['sugestão', 'opinião', 'feedback', 'melhorar', 'avaliação', 'nota'],
  followup: ['e aí', 'alguma novidade', 'resolveu', 'conseguiu', 'status', 'atualização'],
  unknown: [],
};

// Templates de resposta por intenção
const RESPONSE_TEMPLATES: Record<CustomerIntent, string[]> = {
  greeting: [
    'Olá! Seja bem-vindo(a)! Como posso ajudá-lo(a) hoje?',
    'Oi! Tudo bem? Estou aqui para ajudar. O que você precisa?',
    'Olá! Prazer em atendê-lo(a)! Em que posso ser útil?',
  ],
  question: [
    'Ótima pergunta! Deixa eu esclarecer isso para você...',
    'Entendi sua dúvida. Vou te explicar...',
    'Claro, vou te ajudar com essa questão...',
  ],
  complaint: [
    'Lamento muito por esse inconveniente. Vou verificar isso imediatamente e resolver para você.',
    'Entendo sua frustração e peço desculpas. Deixa eu analisar o que aconteceu...',
    'Sinto muito por essa situação. Vou priorizar a resolução do seu caso agora mesmo.',
  ],
  request: [
    'Claro! Vou providenciar isso para você.',
    'Sem problemas! Deixa eu cuidar disso agora.',
    'Entendido! Vou fazer isso imediatamente.',
  ],
  cancellation: [
    'Entendo. Antes de prosseguir, posso saber o motivo? Talvez possamos resolver a questão.',
    'Lamento que esteja considerando isso. Há algo que eu possa fazer para ajudar?',
    'Compreendo. Gostaria de entender melhor para ver se podemos encontrar uma solução.',
  ],
  pricing: [
    'Vou te passar todas as informações sobre valores e planos...',
    'Temos ótimas opções que podem se encaixar no seu perfil. Deixa eu explicar...',
    'Claro! Nossos planos são flexíveis. Vou detalhar cada um para você...',
  ],
  support: [
    'Estou aqui para ajudar! Me conta mais sobre o que está acontecendo.',
    'Pode contar comigo! O que você está precisando?',
    'Claro, vou te ajudar. Pode me dar mais detalhes?',
  ],
  feedback: [
    'Agradeço muito pelo seu feedback! Isso nos ajuda a melhorar.',
    'Sua opinião é muito importante para nós. Obrigado por compartilhar!',
    'Que bom receber seu feedback! Vou encaminhar para a equipe.',
  ],
  followup: [
    'Deixa eu verificar o status do seu caso...',
    'Vou checar as atualizações para você.',
    'Um momento, vou buscar as informações mais recentes...',
  ],
  unknown: [
    'Entendi. Pode me dar mais detalhes para eu poder ajudar melhor?',
    'Claro! Como posso te ajudar com isso?',
    'Estou aqui para ajudar. Me conta mais sobre o que você precisa.',
  ],
};

// Ações sugeridas por contexto
interface ActionSuggestion {
  action: string;
  description: string;
  priority: Priority;
}

/**
 * Detecta a intenção do cliente baseado na mensagem
 */
export function detectCustomerIntent(message: string): CustomerIntent {
  const lowerMessage = message.toLowerCase();

  // Verificar cada intenção
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS) as [CustomerIntent, string[]][]) {
    if (intent === 'unknown') continue;

    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        return intent;
      }
    }
  }

  return 'unknown';
}

/**
 * Gera sugestão de resposta baseada no contexto
 */
export function generateResponseSuggestion(
  messages: MessageForAnalysis[],
  contactName?: string
): SuggestionForAgent | null {
  if (messages.length === 0) return null;

  // Última mensagem do cliente
  const lastCustomerMessage = [...messages]
    .reverse()
    .find((m) => m.sender_type === 'contact');

  if (!lastCustomerMessage) return null;

  const intent = detectCustomerIntent(lastCustomerMessage.content);
  const sentiment = analyzeSentiment(lastCustomerMessage.content);
  const templates = RESPONSE_TEMPLATES[intent];

  // Escolher template aleatório
  const template = templates[Math.floor(Math.random() * templates.length)];

  // Personalizar com nome se disponível
  let suggestedResponse = template;
  if (contactName) {
    suggestedResponse = suggestedResponse.replace('!', `, ${contactName}!`);
  }

  // Ajustar prioridade baseado no sentimento
  let priority: Priority = 'medium';
  if (sentiment === 'negative' || intent === 'cancellation') {
    priority = 'high';
  }
  if (intent === 'greeting') {
    priority = 'low';
  }

  return {
    type: 'response',
    priority,
    title: getIntentTitle(intent),
    description: `Baseado na mensagem do cliente: "${truncateText(lastCustomerMessage.content, 50)}"`,
    suggested_response: suggestedResponse,
    reasoning: `Intenção detectada: ${getIntentLabel(intent)}. Sentimento: ${getSentimentLabel(sentiment)}.`,
  };
}

/**
 * Gera sugestões de ação baseadas no contexto
 */
export function generateActionSuggestions(
  messages: MessageForAnalysis[],
  context?: {
    hasOpenDeal?: boolean;
    dealStage?: string;
    waitTimeSeconds?: number;
    qualityScore?: number;
  }
): SuggestionForAgent[] {
  const suggestions: SuggestionForAgent[] = [];

  if (messages.length === 0) return suggestions;

  const lastCustomerMessage = [...messages]
    .reverse()
    .find((m) => m.sender_type === 'contact');

  if (!lastCustomerMessage) return suggestions;

  const intent = detectCustomerIntent(lastCustomerMessage.content);
  const sentiment = analyzeSentiment(lastCustomerMessage.content);

  // Sugestões baseadas em intenção
  if (intent === 'cancellation') {
    suggestions.push({
      type: 'action',
      priority: 'urgent',
      title: 'Risco de Churn detectado',
      description: 'Cliente mencionou cancelamento. Considere oferecer uma solução ou desconto.',
    });
  }

  if (intent === 'pricing' && context?.hasOpenDeal) {
    suggestions.push({
      type: 'action',
      priority: 'high',
      title: 'Oportunidade de venda',
      description: 'Cliente perguntou sobre preços. Considere apresentar proposta comercial.',
    });
  }

  // Sugestões baseadas em tempo de espera
  if (context?.waitTimeSeconds && context.waitTimeSeconds > 300) {
    suggestions.push({
      type: 'alert',
      priority: context.waitTimeSeconds > 600 ? 'urgent' : 'high',
      title: 'Resposta pendente',
      description: `Cliente aguardando há ${Math.floor(context.waitTimeSeconds / 60)} minutos.`,
    });
  }

  // Sugestões baseadas em qualidade
  if (context?.qualityScore && context.qualityScore < 60) {
    suggestions.push({
      type: 'tip',
      priority: 'medium',
      title: 'Melhore a qualidade da resposta',
      description: 'O score de qualidade está baixo. Tente ser mais empático e detalhado.',
    });
  }

  // Sugestões baseadas em sentimento
  if (sentiment === 'negative') {
    suggestions.push({
      type: 'tip',
      priority: 'high',
      title: 'Cliente insatisfeito',
      description: 'Demonstre empatia e ofereça uma solução clara. Use frases como "Entendo sua frustração..."',
    });
  }

  // Sugestão de follow-up
  if (intent === 'followup') {
    suggestions.push({
      type: 'action',
      priority: 'medium',
      title: 'Verificar pendências',
      description: 'Cliente perguntou sobre status. Verifique se há tasks ou ações pendentes.',
    });
  }

  return suggestions;
}

/**
 * Gera alerta baseado no contexto
 */
export function generateAlert(
  type: 'long_wait' | 'low_quality' | 'frustration' | 'vip' | 'cancellation',
  context: {
    contactName?: string;
    waitTimeSeconds?: number;
    qualityScore?: number;
    conversationId?: string;
  }
): SuggestionForAgent {
  const alerts: Record<typeof type, () => SuggestionForAgent> = {
    long_wait: () => ({
      type: 'alert' as SuggestionType,
      priority: (context.waitTimeSeconds || 0) > 600 ? 'urgent' : 'high',
      title: `${context.contactName || 'Cliente'} aguardando`,
      description: `Sem resposta há ${Math.floor((context.waitTimeSeconds || 0) / 60)} minutos.`,
    }),
    low_quality: () => ({
      type: 'alert' as SuggestionType,
      priority: 'medium',
      title: 'Score de qualidade baixo',
      description: `A conversa com ${context.contactName || 'cliente'} tem score ${context.qualityScore || 0}/100.`,
    }),
    frustration: () => ({
      type: 'alert' as SuggestionType,
      priority: 'high',
      title: 'Cliente frustrado',
      description: `${context.contactName || 'Cliente'} demonstrou frustração. Atenção especial recomendada.`,
    }),
    vip: () => ({
      type: 'alert' as SuggestionType,
      priority: 'urgent',
      title: 'Cliente VIP aguardando',
      description: `${context.contactName || 'Cliente VIP'} precisa de atendimento prioritário.`,
    }),
    cancellation: () => ({
      type: 'alert' as SuggestionType,
      priority: 'urgent',
      title: 'Risco de cancelamento',
      description: `${context.contactName || 'Cliente'} mencionou cancelamento. Ação imediata necessária.`,
    }),
  };

  return alerts[type]();
}

/**
 * Gera dica de coaching baseada no histórico
 */
export function generateCoachingTip(
  averageScores: {
    empathy: number;
    tone: number;
    professionalism: number;
    responseQuality: number;
  }
): SuggestionForAgent | null {
  const weakestArea = Object.entries(averageScores)
    .sort(([, a], [, b]) => a - b)[0];

  if (!weakestArea || weakestArea[1] >= 70) return null;

  const tips: Record<string, string> = {
    empathy: 'Tente usar mais frases que demonstrem compreensão, como "Entendo como você se sente" ou "Compreendo sua situação".',
    tone: 'Mantenha um tom positivo e acolhedor. Evite respostas muito secas ou formais demais.',
    professionalism: 'Mantenha o profissionalismo usando saudações adequadas e evitando gírias.',
    responseQuality: 'Forneça respostas mais completas e detalhadas. Use exemplos quando possível.',
  };

  const labels: Record<string, string> = {
    empathy: 'Empatia',
    tone: 'Tom',
    professionalism: 'Profissionalismo',
    responseQuality: 'Qualidade das Respostas',
  };

  return {
    type: 'tip',
    priority: weakestArea[1] < 50 ? 'high' : 'medium',
    title: `Dica: Melhore sua ${labels[weakestArea[0]]}`,
    description: tips[weakestArea[0]],
    reasoning: `Seu score médio de ${labels[weakestArea[0]].toLowerCase()} é ${Math.round(weakestArea[1])}/100.`,
  };
}

// Utilitários

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function getIntentTitle(intent: CustomerIntent): string {
  const titles: Record<CustomerIntent, string> = {
    greeting: 'Responder saudação',
    question: 'Responder dúvida',
    complaint: 'Tratar reclamação',
    request: 'Atender solicitação',
    cancellation: 'Prevenir cancelamento',
    pricing: 'Informar sobre preços',
    support: 'Oferecer suporte',
    feedback: 'Agradecer feedback',
    followup: 'Atualizar status',
    unknown: 'Responder cliente',
  };
  return titles[intent];
}

function getIntentLabel(intent: CustomerIntent): string {
  const labels: Record<CustomerIntent, string> = {
    greeting: 'Saudação',
    question: 'Pergunta',
    complaint: 'Reclamação',
    request: 'Solicitação',
    cancellation: 'Cancelamento',
    pricing: 'Preço/Planos',
    support: 'Suporte',
    feedback: 'Feedback',
    followup: 'Follow-up',
    unknown: 'Não identificada',
  };
  return labels[intent];
}

function getSentimentLabel(sentiment: Sentiment): string {
  const labels: Record<Sentiment, string> = {
    positive: 'Positivo',
    neutral: 'Neutro',
    negative: 'Negativo',
  };
  return labels[sentiment];
}

export {
  CustomerIntent,
  getIntentLabel,
  getSentimentLabel,
  INTENT_KEYWORDS,
  RESPONSE_TEMPLATES,
};
