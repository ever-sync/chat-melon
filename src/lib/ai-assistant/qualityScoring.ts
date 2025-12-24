import {
  QualityAnalysisResult,
  MessageForAnalysis,
  DetectedIssue,
  Sentiment,
  SuggestionForAgent,
} from '@/types/ai-assistant';

// Palavras-chave que indicam frustração do cliente
const FRUSTRATION_KEYWORDS = [
  'absurdo',
  'péssimo',
  'horrível',
  'decepcionado',
  'decepção',
  'raiva',
  'irritado',
  'cansado',
  'demora',
  'nunca',
  'sempre',
  'problema',
  'reclamação',
  'cancelar',
  'desistir',
  'inaceitável',
  'vergonha',
  'incompetente',
  'desrespeito',
];

// Palavras que indicam satisfação
const SATISFACTION_KEYWORDS = [
  'obrigado',
  'excelente',
  'ótimo',
  'maravilhoso',
  'perfeito',
  'parabéns',
  'satisfeito',
  'feliz',
  'adorei',
  'amei',
  'incrível',
  'fantástico',
  'nota 10',
  'recomendo',
  'top',
];

// Palavras que indicam empatia nas respostas do agente
const EMPATHY_INDICATORS = [
  'entendo',
  'compreendo',
  'lamento',
  'desculpe',
  'sinto muito',
  'posso ajudar',
  'vou resolver',
  'me conte mais',
  'estou aqui',
  'pode contar',
  'claro',
  'com certeza',
  'prazer',
];

// Palavras que indicam profissionalismo
const PROFESSIONALISM_INDICATORS = [
  'bom dia',
  'boa tarde',
  'boa noite',
  'por favor',
  'obrigado',
  'agradeço',
  'disponível',
  'precisar',
  'ajudar',
  'atender',
];

// Frases curtas demais (possível problema)
const MIN_RESPONSE_LENGTH = 20;

// Tempo máximo aceitável de resposta (segundos)
const MAX_RESPONSE_TIME = 300; // 5 minutos

/**
 * Analisa o sentimento de uma mensagem
 */
export function analyzeSentiment(text: string): Sentiment {
  const lowerText = text.toLowerCase();

  let frustrationScore = 0;
  let satisfactionScore = 0;

  FRUSTRATION_KEYWORDS.forEach((keyword) => {
    if (lowerText.includes(keyword)) {
      frustrationScore++;
    }
  });

  SATISFACTION_KEYWORDS.forEach((keyword) => {
    if (lowerText.includes(keyword)) {
      satisfactionScore++;
    }
  });

  if (frustrationScore > satisfactionScore + 1) {
    return 'negative';
  }
  if (satisfactionScore > frustrationScore + 1) {
    return 'positive';
  }
  return 'neutral';
}

/**
 * Calcula score de empatia de uma resposta do agente
 */
export function calculateEmpathyScore(agentMessage: string): number {
  const lowerMessage = agentMessage.toLowerCase();
  let score = 50; // Base

  EMPATHY_INDICATORS.forEach((indicator) => {
    if (lowerMessage.includes(indicator)) {
      score += 10;
    }
  });

  // Penalizar respostas muito curtas
  if (agentMessage.length < MIN_RESPONSE_LENGTH) {
    score -= 20;
  }

  // Verificar se usa o nome do cliente (personalização)
  if (lowerMessage.includes('você') || lowerMessage.includes('senhor') || lowerMessage.includes('senhora')) {
    score += 5;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Calcula score de profissionalismo
 */
export function calculateProfessionalismScore(agentMessage: string): number {
  const lowerMessage = agentMessage.toLowerCase();
  let score = 60; // Base

  PROFESSIONALISM_INDICATORS.forEach((indicator) => {
    if (lowerMessage.includes(indicator)) {
      score += 8;
    }
  });

  // Penalizar gírias ou informalidade excessiva
  const informalWords = ['aí', 'né', 'tá', 'pô', 'mano', 'cara'];
  informalWords.forEach((word) => {
    if (lowerMessage.includes(` ${word} `) || lowerMessage.endsWith(` ${word}`)) {
      score -= 5;
    }
  });

  // Penalizar caps lock (gritando)
  const upperCaseRatio = (agentMessage.match(/[A-Z]/g) || []).length / agentMessage.length;
  if (upperCaseRatio > 0.5 && agentMessage.length > 10) {
    score -= 15;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Calcula score de qualidade da resposta
 */
export function calculateResponseQualityScore(
  agentMessage: string,
  customerMessage: string
): number {
  let score = 50;

  // Resposta tem tamanho adequado
  if (agentMessage.length >= MIN_RESPONSE_LENGTH) {
    score += 15;
  }
  if (agentMessage.length >= 100) {
    score += 10;
  }

  // Resposta contém pontuação adequada
  if (agentMessage.includes('?') || agentMessage.includes('!') || agentMessage.includes('.')) {
    score += 10;
  }

  // Resposta parece abordar a questão do cliente
  const customerWords = customerMessage.toLowerCase().split(/\s+/);
  const agentWords = agentMessage.toLowerCase().split(/\s+/);

  let relevantWords = 0;
  customerWords.forEach((word) => {
    if (word.length > 4 && agentWords.includes(word)) {
      relevantWords++;
    }
  });

  if (relevantWords >= 2) {
    score += 15;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Calcula score de tom da resposta
 */
export function calculateToneScore(agentMessage: string): number {
  let score = 70;

  // Positivo se usar emojis com moderação
  const emojiCount = (agentMessage.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (emojiCount >= 1 && emojiCount <= 3) {
    score += 10;
  }
  if (emojiCount > 5) {
    score -= 10;
  }

  // Penalizar tom negativo
  const negativeWords = ['não posso', 'impossível', 'não dá', 'infelizmente não'];
  negativeWords.forEach((phrase) => {
    if (agentMessage.toLowerCase().includes(phrase)) {
      score -= 5;
    }
  });

  // Bonificar tom positivo
  const positiveWords = ['com prazer', 'claro que sim', 'sem problemas', 'vou resolver'];
  positiveWords.forEach((phrase) => {
    if (agentMessage.toLowerCase().includes(phrase)) {
      score += 10;
    }
  });

  return Math.min(100, Math.max(0, score));
}

/**
 * Detecta problemas na resposta do agente
 */
export function detectIssues(
  agentMessage: string,
  customerMessage: string,
  responseTimeSeconds?: number
): DetectedIssue[] {
  const issues: DetectedIssue[] = [];

  // Resposta muito curta
  if (agentMessage.length < MIN_RESPONSE_LENGTH) {
    issues.push({
      type: 'short_response',
      message: 'Resposta muito curta',
      severity: 'medium',
      suggestion: 'Considere adicionar mais detalhes ou fazer uma pergunta para entender melhor a necessidade do cliente.',
    });
  }

  // Tempo de resposta longo
  if (responseTimeSeconds && responseTimeSeconds > MAX_RESPONSE_TIME) {
    issues.push({
      type: 'slow_response',
      message: `Tempo de resposta elevado (${Math.floor(responseTimeSeconds / 60)} minutos)`,
      severity: responseTimeSeconds > 600 ? 'high' : 'medium',
      suggestion: 'Tente responder mais rapidamente. Use templates para agilizar respostas frequentes.',
    });
  }

  // Falta de saudação inicial
  const greetings = ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'ola'];
  const hasGreeting = greetings.some((g) => agentMessage.toLowerCase().startsWith(g));
  if (!hasGreeting && agentMessage.length > 50) {
    // Verificar se é a primeira mensagem (simplificado)
    issues.push({
      type: 'no_greeting',
      message: 'Considere iniciar com uma saudação',
      severity: 'low',
      suggestion: 'Uma saudação inicial torna a conversa mais amigável.',
    });
  }

  // Cliente frustrado não recebeu empatia
  const customerSentiment = analyzeSentiment(customerMessage);
  if (customerSentiment === 'negative') {
    const hasEmpathy = EMPATHY_INDICATORS.some((e) => agentMessage.toLowerCase().includes(e));
    if (!hasEmpathy) {
      issues.push({
        type: 'missing_empathy',
        message: 'Cliente parece frustrado - considere demonstrar mais empatia',
        severity: 'high',
        suggestion: 'Use frases como "Entendo sua frustração" ou "Lamento pelo inconveniente" para demonstrar empatia.',
      });
    }
  }

  return issues;
}

/**
 * Identifica pontos positivos na resposta
 */
export function identifyPositiveHighlights(agentMessage: string): string[] {
  const highlights: string[] = [];
  const lowerMessage = agentMessage.toLowerCase();

  if (agentMessage.length >= 100) {
    highlights.push('Resposta detalhada e completa');
  }

  if (EMPATHY_INDICATORS.some((e) => lowerMessage.includes(e))) {
    highlights.push('Demonstrou empatia');
  }

  if (PROFESSIONALISM_INDICATORS.filter((p) => lowerMessage.includes(p)).length >= 2) {
    highlights.push('Tom profissional adequado');
  }

  if (lowerMessage.includes('?')) {
    highlights.push('Fez perguntas para entender melhor');
  }

  if (lowerMessage.includes('ajudar') || lowerMessage.includes('resolver')) {
    highlights.push('Demonstrou disposição para ajudar');
  }

  return highlights;
}

/**
 * Sugere áreas de melhoria
 */
export function suggestImprovements(
  empathyScore: number,
  toneScore: number,
  responseQualityScore: number,
  professionalismScore: number
): string[] {
  const improvements: string[] = [];

  if (empathyScore < 60) {
    improvements.push('Demonstrar mais empatia nas respostas');
  }

  if (toneScore < 60) {
    improvements.push('Melhorar o tom das mensagens (mais positivo e acolhedor)');
  }

  if (responseQualityScore < 60) {
    improvements.push('Fornecer respostas mais completas e detalhadas');
  }

  if (professionalismScore < 60) {
    improvements.push('Manter tom mais profissional');
  }

  return improvements;
}

/**
 * Análise completa de qualidade de uma conversa
 */
export function analyzeConversationQuality(
  messages: MessageForAnalysis[],
  responseTimeSeconds?: number
): QualityAnalysisResult {
  // Filtrar mensagens do agente e do cliente
  const agentMessages = messages.filter((m) => m.sender_type === 'agent');
  const customerMessages = messages.filter((m) => m.sender_type === 'contact');

  if (agentMessages.length === 0) {
    return {
      overall_score: 0,
      empathy_score: 0,
      resolution_score: 0,
      tone_score: 0,
      professionalism_score: 0,
      response_quality_score: 0,
      sentiment: 'neutral',
      detected_issues: [],
      positive_highlights: [],
      improvement_areas: [],
      suggestions: [],
    };
  }

  // Última mensagem do agente e do cliente
  const lastAgentMessage = agentMessages[agentMessages.length - 1];
  const lastCustomerMessage = customerMessages.length > 0
    ? customerMessages[customerMessages.length - 1]
    : { content: '' };

  // Calcular scores individuais
  const empathyScore = calculateEmpathyScore(lastAgentMessage.content);
  const professionalismScore = calculateProfessionalismScore(lastAgentMessage.content);
  const responseQualityScore = calculateResponseQualityScore(
    lastAgentMessage.content,
    lastCustomerMessage.content
  );
  const toneScore = calculateToneScore(lastAgentMessage.content);

  // Score de resolução (simplificado - baseado no contexto)
  let resolutionScore = 50;
  const resolutionIndicators = ['resolvido', 'pronto', 'feito', 'concluído', 'ok', 'tudo certo'];
  if (resolutionIndicators.some((r) => lastAgentMessage.content.toLowerCase().includes(r))) {
    resolutionScore = 80;
  }

  // Score geral (média ponderada)
  const overallScore = Math.round(
    (empathyScore * 0.2) +
    (professionalismScore * 0.2) +
    (responseQualityScore * 0.25) +
    (toneScore * 0.15) +
    (resolutionScore * 0.2)
  );

  // Detectar issues
  const detectedIssues = detectIssues(
    lastAgentMessage.content,
    lastCustomerMessage.content,
    responseTimeSeconds
  );

  // Identificar pontos positivos
  const positiveHighlights = identifyPositiveHighlights(lastAgentMessage.content);

  // Sugerir melhorias
  const improvementAreas = suggestImprovements(
    empathyScore,
    toneScore,
    responseQualityScore,
    professionalismScore
  );

  // Analisar sentimento do cliente
  const sentiment = analyzeSentiment(lastCustomerMessage.content);

  // Gerar sugestões contextuais
  const suggestions: SuggestionForAgent[] = [];

  if (detectedIssues.length > 0) {
    detectedIssues.forEach((issue) => {
      if (issue.suggestion) {
        suggestions.push({
          type: 'tip',
          priority: issue.severity === 'high' ? 'high' : 'medium',
          title: issue.message,
          description: issue.suggestion,
        });
      }
    });
  }

  if (sentiment === 'negative') {
    suggestions.push({
      type: 'tip',
      priority: 'high',
      title: 'Cliente parece frustrado',
      description: 'Demonstre empatia e ofereça uma solução clara para o problema.',
    });
  }

  return {
    overall_score: overallScore,
    empathy_score: empathyScore,
    resolution_score: resolutionScore,
    tone_score: toneScore,
    professionalism_score: professionalismScore,
    response_quality_score: responseQualityScore,
    sentiment,
    detected_issues: detectedIssues,
    positive_highlights: positiveHighlights,
    improvement_areas: improvementAreas,
    suggestions,
  };
}

/**
 * Calcula tempo de resposta entre mensagens
 */
export function calculateResponseTime(
  customerMessageTime: string,
  agentMessageTime: string
): number {
  const customerDate = new Date(customerMessageTime);
  const agentDate = new Date(agentMessageTime);
  return Math.floor((agentDate.getTime() - customerDate.getTime()) / 1000);
}
