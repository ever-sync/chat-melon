import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Bot,
  Brain,
  MessageSquare,
  Shield,
  Clock,
  Zap,
  Save,
  ArrowLeft,
  Sparkles,
  Settings2,
  Users,
  AlertTriangle,
  Target,
  Lightbulb,
  BookOpen,
} from 'lucide-react';
import {
  AIAgentFormData,
  AIAgent,
  AIAgentType,
  AIAgentAutonomy,
  AIHandoffBehavior,
  AIPersonalityStyle,
  AIFallbackType,
  AI_AGENT_TYPE_LABELS,
  AI_AUTONOMY_LABELS,
  AI_PERSONALITY_LABELS,
  AI_HANDOFF_LABELS,
  AI_FALLBACK_LABELS,
  DEFAULT_AI_AGENT,
  getAutonomyDescription,
} from '@/types/ai-agents';
import { cn } from '@/lib/utils';

interface AgentFormProps {
  agent?: AIAgent;
  onSubmit: (data: AIAgentFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function AgentForm({ agent, onSubmit, onCancel, isSubmitting }: AgentFormProps) {
  const [activeTab, setActiveTab] = useState('basic');

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AIAgentFormData>({
    defaultValues: agent ? {
      name: agent.name,
      description: agent.description || '',
      avatar_url: agent.avatar_url || '',
      display_name: agent.display_name || '',
      agent_type: agent.agent_type,
      autonomy_level: agent.autonomy_level,
      handoff_behavior: agent.handoff_behavior,
      confidence_threshold: agent.confidence_threshold,
      personality_style: agent.personality_style,
      custom_personality: agent.custom_personality || '',
      language: agent.language,
      tone_formality: agent.tone_formality,
      use_emojis: agent.use_emojis,
      system_prompt: agent.system_prompt,
      crm_context_enabled: agent.crm_context_enabled,
      conversation_history_limit: agent.conversation_history_limit,
      max_response_length: agent.max_response_length,
      response_delay_ms: agent.response_delay_ms,
      typing_indicator: agent.typing_indicator,
      fallback_type: agent.fallback_type,
      fallback_message: agent.fallback_message || '',
      max_messages_per_session: agent.max_messages_per_session,
      session_timeout_minutes: agent.session_timeout_minutes,
      daily_message_limit: agent.daily_message_limit,
      schedule_enabled: agent.schedule_enabled,
      out_of_hours_message: agent.out_of_hours_message || '',
    } : DEFAULT_AI_AGENT as AIAgentFormData,
  });

  const watchPersonalityStyle = watch('personality_style');
  const watchAutonomyLevel = watch('autonomy_level');
  const watchToneFormality = watch('tone_formality');
  const watchConfidenceThreshold = watch('confidence_threshold');

  // Descrições dos tipos de agente
  const agentTypeDescriptions: Record<AIAgentType, string> = {
    customer_service: 'Ideal para atendimento geral, dúvidas e reclamações',
    sales: 'Focado em conversão, qualificação e vendas',
    support: 'Especializado em resolver problemas técnicos',
    qualification: 'Qualifica leads com perguntas estruturadas',
    scheduling: 'Gerencia agendamentos e compromissos',
    faq: 'Responde perguntas frequentes automaticamente',
    custom: 'Configuração totalmente personalizada',
  };

  // Templates de prompts por tipo
  const promptTemplates: Record<AIAgentType, string> = {
    customer_service: `Você é um assistente de atendimento ao cliente profissional e prestativo.

Suas responsabilidades:
- Responder dúvidas sobre produtos e serviços
- Ajudar com reclamações de forma empática
- Direcionar para o setor correto quando necessário
- Manter um tom profissional mas acolhedor

Diretrizes:
- Use o nome do cliente quando disponível
- Confirme informações importantes
- Ofereça soluções práticas
- Se não souber algo, admita e ofereça alternativas`,

    sales: `Você é um assistente de vendas consultivo e persuasivo.

Suas responsabilidades:
- Identificar necessidades do cliente
- Apresentar produtos/serviços relevantes
- Qualificar o interesse do lead
- Conduzir para fechamento ou agendamento

Diretrizes:
- Faça perguntas para entender o contexto
- Destaque benefícios, não apenas características
- Crie urgência quando apropriado
- Nunca force uma venda, seja consultivo`,

    support: `Você é um assistente de suporte técnico especializado.

Suas responsabilidades:
- Diagnosticar problemas técnicos
- Fornecer soluções passo a passo
- Escalar problemas complexos adequadamente
- Documentar issues para a equipe

Diretrizes:
- Peça informações técnicas relevantes
- Use linguagem clara e objetiva
- Confirme se o problema foi resolvido
- Ofereça recursos adicionais (docs, tutoriais)`,

    qualification: `Você é um assistente de qualificação de leads.

Suas responsabilidades:
- Coletar informações do potencial cliente
- Identificar nível de interesse e urgência
- Qualificar budget e autoridade de decisão
- Encaminhar leads qualificados para vendas

Perguntas-chave a fazer:
- Qual problema você está tentando resolver?
- Qual é o prazo para implementação?
- Quem mais está envolvido na decisão?
- Qual é o orçamento disponível?`,

    scheduling: `Você é um assistente de agendamentos eficiente.

Suas responsabilidades:
- Verificar disponibilidade de horários
- Confirmar e agendar compromissos
- Enviar lembretes de confirmação
- Gerenciar reagendamentos e cancelamentos

Diretrizes:
- Ofereça opções de horários claras
- Confirme data, hora e duração
- Colete informações de contato
- Envie confirmação ao final`,

    faq: `Você é um assistente de FAQ inteligente.

Suas responsabilidades:
- Responder perguntas frequentes rapidamente
- Direcionar para recursos e documentação
- Identificar quando precisa de atendimento humano
- Manter respostas consistentes e atualizadas

Diretrizes:
- Respostas curtas e diretas
- Inclua links para mais informações
- Pergunte se a resposta foi útil
- Escale quando necessário`,

    custom: `Você é um assistente virtual personalizado.

Configure este prompt de acordo com suas necessidades específicas.

Dicas:
- Defina claramente o papel do assistente
- Liste as responsabilidades principais
- Estabeleça o tom e estilo de comunicação
- Defina limites e quando escalar`,
  };

  const handleAgentTypeChange = (type: AIAgentType) => {
    setValue('agent_type', type);
    if (!agent) {
      // Só atualiza o prompt se for novo agente
      setValue('system_prompt', promptTemplates[type]);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">
              {agent ? 'Editar Agente' : 'Criar Novo Agente'}
            </h2>
            <p className="text-muted-foreground">
              Configure seu assistente de IA para atendimento automatizado
            </p>
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>Salvando...</>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Agente
            </>
          )}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">Básico</span>
          </TabsTrigger>
          <TabsTrigger value="personality" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Personalidade</span>
          </TabsTrigger>
          <TabsTrigger value="behavior" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Comportamento</span>
          </TabsTrigger>
          <TabsTrigger value="responses" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Respostas</span>
          </TabsTrigger>
          <TabsTrigger value="limits" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Limites</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Básico */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-purple-600" />
                Identificação do Agente
              </CardTitle>
              <CardDescription>
                Informações básicas que identificam seu agente de IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Agente *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Atendente Virtual"
                    {...register('name', { required: 'Nome é obrigatório' })}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display_name">Nome de Exibição (para o cliente)</Label>
                  <Input
                    id="display_name"
                    placeholder="Ex: Sofia"
                    {...register('display_name')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Nome que aparece nas mensagens para o cliente
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o propósito deste agente..."
                  rows={2}
                  {...register('description')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar_url">URL do Avatar</Label>
                <Input
                  id="avatar_url"
                  placeholder="https://..."
                  {...register('avatar_url')}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Tipo de Agente
              </CardTitle>
              <CardDescription>
                Escolha o tipo que melhor se encaixa no objetivo do agente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {(Object.keys(AI_AGENT_TYPE_LABELS) as AIAgentType[]).map((type) => (
                  <div
                    key={type}
                    className={cn(
                      'p-4 rounded-lg border-2 cursor-pointer transition-all',
                      watch('agent_type') === type
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-200'
                    )}
                    onClick={() => handleAgentTypeChange(type)}
                  >
                    <div className="font-medium">{AI_AGENT_TYPE_LABELS[type]}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {agentTypeDescriptions[type]}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Personalidade */}
        <TabsContent value="personality" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Estilo de Personalidade
              </CardTitle>
              <CardDescription>
                Define como o agente se comunica com os clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {(Object.keys(AI_PERSONALITY_LABELS) as AIPersonalityStyle[]).map((style) => (
                  <div
                    key={style}
                    className={cn(
                      'p-4 rounded-lg border-2 cursor-pointer transition-all',
                      watchPersonalityStyle === style
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-200'
                    )}
                    onClick={() => setValue('personality_style', style)}
                  >
                    <div className="font-medium">{AI_PERSONALITY_LABELS[style]}</div>
                  </div>
                ))}
              </div>

              {watchPersonalityStyle === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="custom_personality">Personalidade Customizada</Label>
                  <Textarea
                    id="custom_personality"
                    placeholder="Descreva a personalidade do agente..."
                    rows={4}
                    {...register('custom_personality')}
                  />
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Nível de Formalidade</Label>
                    <span className="text-sm text-muted-foreground">
                      {watchToneFormality <= 3 ? 'Informal' : watchToneFormality <= 6 ? 'Neutro' : 'Formal'}
                    </span>
                  </div>
                  <Slider
                    value={[watchToneFormality]}
                    onValueChange={([value]) => setValue('tone_formality', value)}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Muito Informal</span>
                    <span>Muito Formal</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Usar Emojis</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite o uso de emojis nas respostas
                    </p>
                  </div>
                  <Switch
                    checked={watch('use_emojis')}
                    onCheckedChange={(checked) => setValue('use_emojis', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Select
                    value={watch('language')}
                    onValueChange={(value) => setValue('language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="pt-PT">Português (Portugal)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-600" />
                Prompt do Sistema
              </CardTitle>
              <CardDescription>
                Instruções principais que definem como o agente deve se comportar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Escreva as instruções do agente..."
                rows={15}
                className="font-mono text-sm"
                {...register('system_prompt', { required: 'Prompt é obrigatório' })}
              />
              {errors.system_prompt && (
                <p className="text-sm text-red-500 mt-1">{errors.system_prompt.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Variáveis disponíveis: {'{{nome}}'}, {'{{telefone}}'}, {'{{email}}'}, {'{{empresa}}'}, {'{{horario}}'}, etc.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Comportamento */}
        <TabsContent value="behavior" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Nível de Autonomia
              </CardTitle>
              <CardDescription>
                Define quanto controle o agente tem sobre as respostas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                {(Object.keys(AI_AUTONOMY_LABELS) as AIAgentAutonomy[]).map((level) => (
                  <div
                    key={level}
                    className={cn(
                      'p-4 rounded-lg border-2 cursor-pointer transition-all',
                      watchAutonomyLevel === level
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-200'
                    )}
                    onClick={() => setValue('autonomy_level', level)}
                  >
                    <div className="font-medium">{AI_AUTONOMY_LABELS[level]}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {getAutonomyDescription(level)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-4">
                <div className="flex items-center justify-between">
                  <Label>Limite de Confiança</Label>
                  <span className="text-sm font-medium">
                    {Math.round(watchConfidenceThreshold * 100)}%
                  </span>
                </div>
                <Slider
                  value={[watchConfidenceThreshold * 100]}
                  onValueChange={([value]) => setValue('confidence_threshold', value / 100)}
                  min={50}
                  max={95}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Respostas abaixo deste nível de confiança ativarão o comportamento de fallback
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Handoff para Humano
              </CardTitle>
              <CardDescription>
                Quando e como transferir para um atendente humano
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Comportamento de Handoff</Label>
                <Select
                  value={watch('handoff_behavior')}
                  onValueChange={(value) => setValue('handoff_behavior', value as AIHandoffBehavior)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(AI_HANDOFF_LABELS) as AIHandoffBehavior[]).map((behavior) => (
                      <SelectItem key={behavior} value={behavior}>
                        {AI_HANDOFF_LABELS[behavior]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Fallback</Label>
                <Select
                  value={watch('fallback_type')}
                  onValueChange={(value) => setValue('fallback_type', value as AIFallbackType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(AI_FALLBACK_LABELS) as AIFallbackType[]).map((fallback) => (
                      <SelectItem key={fallback} value={fallback}>
                        {AI_FALLBACK_LABELS[fallback]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {watch('fallback_type') === 'custom_message' && (
                <div className="space-y-2">
                  <Label htmlFor="fallback_message">Mensagem de Fallback</Label>
                  <Textarea
                    id="fallback_message"
                    placeholder="Mensagem a ser enviada quando o agente não souber responder..."
                    rows={3}
                    {...register('fallback_message')}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-purple-600" />
                Contexto e Memória
              </CardTitle>
              <CardDescription>
                Configurações de como o agente usa informações do CRM
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Usar Contexto do CRM</Label>
                  <p className="text-sm text-muted-foreground">
                    Inclui dados do contato (nome, empresa, histórico) nas respostas
                  </p>
                </div>
                <Switch
                  checked={watch('crm_context_enabled')}
                  onCheckedChange={(checked) => setValue('crm_context_enabled', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conversation_history_limit">
                  Limite de Histórico de Conversa
                </Label>
                <Input
                  id="conversation_history_limit"
                  type="number"
                  min={5}
                  max={100}
                  {...register('conversation_history_limit', { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">
                  Número de mensagens anteriores que o agente considera
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Respostas */}
        <TabsContent value="responses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                Configurações de Resposta
              </CardTitle>
              <CardDescription>
                Como as respostas são formatadas e enviadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="max_response_length">
                    Tamanho Máximo da Resposta
                  </Label>
                  <Input
                    id="max_response_length"
                    type="number"
                    min={50}
                    max={2000}
                    {...register('max_response_length', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Caracteres máximos por mensagem
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="response_delay_ms">
                    Delay de Resposta (ms)
                  </Label>
                  <Input
                    id="response_delay_ms"
                    type="number"
                    min={0}
                    max={5000}
                    step={100}
                    {...register('response_delay_ms', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Simula tempo de digitação para parecer mais humano
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Indicador de Digitação</Label>
                  <p className="text-sm text-muted-foreground">
                    Mostra "digitando..." antes de enviar a resposta
                  </p>
                </div>
                <Switch
                  checked={watch('typing_indicator')}
                  onCheckedChange={(checked) => setValue('typing_indicator', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-purple-600" />
                Dicas de Prompt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="variables">
                  <AccordionTrigger>Variáveis Disponíveis</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-2 text-sm">
                      <code className="bg-gray-100 px-2 py-1 rounded">{'{{nome}}'} - Nome do contato</code>
                      <code className="bg-gray-100 px-2 py-1 rounded">{'{{telefone}}'} - Telefone do contato</code>
                      <code className="bg-gray-100 px-2 py-1 rounded">{'{{email}}'} - Email do contato</code>
                      <code className="bg-gray-100 px-2 py-1 rounded">{'{{empresa}}'} - Empresa do contato</code>
                      <code className="bg-gray-100 px-2 py-1 rounded">{'{{horario}}'} - Horário atual</code>
                      <code className="bg-gray-100 px-2 py-1 rounded">{'{{dia_semana}}'} - Dia da semana</code>
                      <code className="bg-gray-100 px-2 py-1 rounded">{'{{ultima_mensagem}}'} - Última mensagem do cliente</code>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="tips">
                  <AccordionTrigger>Boas Práticas</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Seja específico sobre o papel e responsabilidades do agente</li>
                      <li>Defina claramente o tom e estilo de comunicação</li>
                      <li>Inclua exemplos de respostas ideais</li>
                      <li>Especifique quando escalar para humano</li>
                      <li>Liste tópicos que o agente NÃO deve abordar</li>
                      <li>Adicione informações sobre produtos/serviços relevantes</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Limites */}
        <TabsContent value="limits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Limites de Sessão
              </CardTitle>
              <CardDescription>
                Proteções para evitar uso excessivo ou loops infinitos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="max_messages_per_session">
                    Máximo de Mensagens por Sessão
                  </Label>
                  <Input
                    id="max_messages_per_session"
                    type="number"
                    min={5}
                    max={200}
                    {...register('max_messages_per_session', { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="session_timeout_minutes">
                    Timeout de Sessão (minutos)
                  </Label>
                  <Input
                    id="session_timeout_minutes"
                    type="number"
                    min={5}
                    max={120}
                    {...register('session_timeout_minutes', { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="daily_message_limit">
                    Limite Diário de Mensagens
                  </Label>
                  <Input
                    id="daily_message_limit"
                    type="number"
                    min={100}
                    max={100000}
                    {...register('daily_message_limit', { valueAsNumber: true })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                Horários de Funcionamento
              </CardTitle>
              <CardDescription>
                Configure quando o agente deve atender
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Habilitar Horários</Label>
                  <p className="text-sm text-muted-foreground">
                    O agente só responde dentro dos horários configurados
                  </p>
                </div>
                <Switch
                  checked={watch('schedule_enabled')}
                  onCheckedChange={(checked) => setValue('schedule_enabled', checked)}
                />
              </div>

              {watch('schedule_enabled') && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="out_of_hours_message">
                      Mensagem Fora do Horário
                    </Label>
                    <Textarea
                      id="out_of_hours_message"
                      placeholder="Olá! Nosso atendimento funciona de segunda a sexta, das 9h às 18h. Deixe sua mensagem que retornaremos em breve!"
                      rows={3}
                      {...register('out_of_hours_message')}
                    />
                  </div>

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium">Configuração de Horários</p>
                        <p className="mt-1">
                          Para configurar os horários específicos, acesse a aba de canais após salvar o agente.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  );
}
