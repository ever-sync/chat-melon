import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Bot,
  Pause,
  Play,
  Brain,
  Target,
  ShoppingBag,
  AlertTriangle,
  TrendingUp,
  Clock,
  User,
  Lightbulb,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

interface AIControlPanelProps {
  conversationId: string;
  contactId: string;
  companyId: string;
}

interface ConversationAI {
  ai_enabled: boolean;
  ai_mode: string;
  ai_paused_at: string | null;
  ai_messages_count: number;
  ai_summary: string | null;
  ai_next_step_suggestion: string | null;
}

interface LeadInsight {
  id: string;
  insight_type: string;
  title: string;
  description: string;
  value: string;
  confidence: number;
  product_name: string;
  interest_level: number;
  created_at: string;
}

interface LeadQualification {
  budget_score: number;
  budget_notes: string;
  authority_score: number;
  authority_notes: string;
  need_score: number;
  need_notes: string;
  timing_score: number;
  timing_notes: string;
  total_score: number;
  qualification_level: string;
  communication_style: string;
  price_sensitivity: string;
}

interface AISuggestion {
  id: string;
  suggestion_type: string;
  title: string;
  content: string;
  priority: string;
  status: string;
}

export function AIControlPanel({ conversationId, contactId, companyId }: AIControlPanelProps) {
  const [conversation, setConversation] = useState<ConversationAI | null>(null);
  const [insights, setInsights] = useState<LeadInsight[]>([]);
  const [qualification, setQualification] = useState<LeadQualification | null>(null);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [agentName, setAgentName] = useState('Copiloto');

  const loadAgentName = useCallback(async () => {
    const { data } = await supabase
      .from('ai_settings')
      .select('*')
      .eq('company_id', companyId)
      .maybeSingle();
    if (data && 'agent_name' in data) {
      setAgentName((data as { agent_name: string }).agent_name);
    }
  }, [companyId]);

  const loadConversation = useCallback(async () => {
    const { data } = await supabase
      .from('conversations')
      .select(
        'ai_enabled, ai_mode, ai_paused_at, ai_messages_count, ai_summary, ai_next_step_suggestion'
      )
      .eq('id', conversationId)
      .maybeSingle();
    setConversation(data);
  }, [conversationId]);

  const loadInsights = useCallback(async () => {
    const { data } = await supabase
      .from('lead_insights')
      .select('*')
      .eq('contact_id', contactId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20);
    setInsights(data || []);
  }, [contactId]);

  const loadQualification = useCallback(async () => {
    const { data } = await supabase
      .from('lead_qualification')
      .select('*')
      .eq('contact_id', contactId)
      .maybeSingle();
    setQualification(data);
  }, [contactId]);

  const loadSuggestions = useCallback(async () => {
    const { data } = await supabase
      .from('ai_suggestions')
      .select('*, content, suggested_response, suggestion_type, type')
      .eq('conversation_id', conversationId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    // Unificar o conteúdo para exibição
    const unified = (data || []).map((s: any) => ({
      ...s,
      content: s.content || s.suggested_response || '',
      suggestion_type: s.suggestion_type || s.type || 'response'
    }));

    setSuggestions(unified as AISuggestion[]);
  }, [conversationId]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([
      loadConversation(),
      loadInsights(),
      loadQualification(),
      loadSuggestions(),
      loadAgentName(),
    ]);
    setIsLoading(false);
  }, [loadConversation, loadInsights, loadQualification, loadSuggestions, loadAgentName]);

  useEffect(() => {
    loadData();

    // Subscrever a atualizações em tempo real
    const channel = supabase
      .channel(`ai-panel-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lead_insights',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => loadInsights()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_suggestions',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => loadSuggestions()
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          // Recarregar dados da conversa quando houver qualquer update
          console.log('🔄 AIControlPanel: Conversa atualizada via realtime', payload.new);
          loadConversation();
        }
      )
      .subscribe((status) => {
        console.log('📡 AIControlPanel realtime status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, contactId, loadData, loadInsights, loadSuggestions, loadConversation]);

  const toggleAI = async () => {
    setIsUpdating(true);
    const newEnabled = !conversation?.ai_enabled;

    const { error } = await supabase
      .from('conversations')
      .update({
        ai_enabled: newEnabled,
        ai_paused_at: newEnabled ? null : new Date().toISOString(),
      })
      .eq('id', conversationId);

    if (error) {
      toast.error('Erro ao atualizar');
    } else {
      const message = newEnabled
        ? 'A IA voltará a responder automaticamente'
        : 'A IA não responderá mais nesta conversa';
      toast.success(newEnabled ? 'IA ativada' : 'IA pausada', { description: message });
      await loadConversation();
    }
    setIsUpdating(false);
  };

  const handleApplySuggestion = async (suggestion: AISuggestion) => {
    // Copiar para clipboard
    await navigator.clipboard.writeText(suggestion.content);

    // Marcar como usada
    await supabase
      .from('ai_suggestions')
      .update({ status: 'used', used_at: new Date().toISOString() })
      .eq('id', suggestion.id);

    toast.success('Sugestão copiada!');
    loadSuggestions();
  };

  const dismissSuggestion = async (suggestion: AISuggestion) => {
    await supabase.from('ai_suggestions').update({ status: 'dismissed' }).eq('id', suggestion.id);
    loadSuggestions();
  };

  const getInsightIcon = (type: string) => {
    const icons: Record<string, any> = {
      product_interest: ShoppingBag,
      objection: AlertTriangle,
      positive_signal: ThumbsUp,
      negative_signal: ThumbsDown,
      budget_mentioned: Target,
      urgency_detected: Clock,
      pain_point: AlertTriangle,
    };
    return icons[type] || Brain;
  };

  const getInsightColor = (type: string) => {
    const colors: Record<string, string> = {
      product_interest: 'text-blue-500 bg-blue-100',
      objection: 'text-orange-500 bg-orange-100',
      positive_signal: 'text-green-500 bg-green-100',
      negative_signal: 'text-red-500 bg-red-100',
      budget_mentioned: 'text-emerald-500 bg-emerald-100',
      urgency_detected: 'text-purple-500 bg-purple-100',
      pain_point: 'text-yellow-500 bg-yellow-100',
    };
    return colors[type] || 'text-gray-500 bg-gray-100';
  };

  const getQualificationColor = (level: string) => {
    const colors: Record<string, string> = {
      hot: 'bg-red-500',
      warm: 'bg-orange-500',
      cool: 'bg-blue-500',
      cold: 'bg-gray-400',
    };
    return colors[level] || 'bg-gray-400';
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      urgent: 'bg-red-500 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-blue-500 text-white',
      low: 'bg-gray-400 text-white',
    };
    return styles[priority] || styles.medium;
  };

  if (isLoading) {
    return (
      <div className="w-80 bg-gray-50 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-50 flex flex-col">
      {/* Header com controle da IA */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-full ${conversation?.ai_enabled ? 'bg-violet-100' : 'bg-gray-100'}`}
            >
              <Bot
                className={`h-5 w-5 ${conversation?.ai_enabled ? 'text-violet-600' : 'text-gray-400'}`}
              />
            </div>
            <div>
              <h3 className="font-semibold">{agentName}</h3>
              <p className="text-xs text-muted-foreground">
                {conversation?.ai_messages_count || 0} msgs enviadas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${conversation?.ai_enabled ? 'text-violet-600' : 'text-gray-500'}`}>
              {conversation?.ai_enabled ? 'Ativo' : 'Pausado'}
            </span>
            <Switch
              checked={conversation?.ai_enabled || false}
              onCheckedChange={toggleAI}
              disabled={isUpdating}
              className="data-[state=checked]:bg-violet-600"
            />
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${conversation?.ai_enabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}
          />
          <span className="text-sm">
            {conversation?.ai_enabled ? 'IA respondendo automaticamente' : 'IA pausada'}
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <Tabs defaultValue="insights" className="w-full">
          <TabsList className="w-full grid grid-cols-3 p-1 m-2">
            <TabsTrigger value="insights" className="text-xs">
              Insights
            </TabsTrigger>
            <TabsTrigger value="qualification" className="text-xs">
              Score
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="text-xs">
              Sugestões
              {suggestions.length > 0 && (
                <Badge className="ml-1 h-4 w-4 p-0 justify-center bg-violet-500">
                  {suggestions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab Insights */}
          <TabsContent value="insights" className="p-4 pt-0 space-y-3">
            {/* Resumo da IA */}
            {conversation?.ai_summary && (
              <Card>
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-500" />
                    Resumo
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <p className="text-sm text-muted-foreground">{conversation.ai_summary}</p>
                  {conversation.ai_next_step_suggestion && (
                    <div className="mt-2 p-2 bg-violet-50 rounded text-sm">
                      <strong>Próximo passo:</strong> {conversation.ai_next_step_suggestion}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Lista de insights */}
            {insights.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum insight detectado ainda</p>
              </div>
            ) : (
              insights.map((insight) => {
                const Icon = getInsightIcon(insight.insight_type);
                return (
                  <div key={insight.id} className="flex gap-3 p-2 bg-white rounded-lg border">
                    <div
                      className={`p-2 rounded-full h-fit ${getInsightColor(insight.insight_type)}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{insight.title}</p>
                      {insight.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {insight.description}
                        </p>
                      )}
                      {insight.value && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {insight.value}
                        </Badge>
                      )}
                      {insight.interest_level && (
                        <div className="mt-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>Interesse:</span>
                            <Progress value={insight.interest_level * 10} className="h-1 w-16" />
                            <span>{insight.interest_level}/10</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          {/* Tab Qualificação */}
          <TabsContent value="qualification" className="p-4 pt-0">
            {!qualification ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Lead ainda não qualificado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Score total */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold">{qualification.total_score}/100</span>
                      <Badge className={getQualificationColor(qualification.qualification_level)}>
                        {qualification.qualification_level.toUpperCase()}
                      </Badge>
                    </div>
                    <Progress value={qualification.total_score} className="h-2" />
                  </CardContent>
                </Card>

                {/* BANT */}
                <div className="space-y-3">
                  {/* Budget */}
                  <div className="p-3 bg-white rounded-lg border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">💰 Budget</span>
                      <span className="text-sm">{qualification.budget_score}/25</span>
                    </div>
                    <Progress value={qualification.budget_score * 4} className="h-1 mb-1" />
                    {qualification.budget_notes && (
                      <p className="text-xs text-muted-foreground">{qualification.budget_notes}</p>
                    )}
                  </div>

                  {/* Authority */}
                  <div className="p-3 bg-white rounded-lg border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">👤 Authority</span>
                      <span className="text-sm">{qualification.authority_score}/25</span>
                    </div>
                    <Progress value={qualification.authority_score * 4} className="h-1 mb-1" />
                    {qualification.authority_notes && (
                      <p className="text-xs text-muted-foreground">
                        {qualification.authority_notes}
                      </p>
                    )}
                  </div>

                  {/* Need */}
                  <div className="p-3 bg-white rounded-lg border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">🎯 Need</span>
                      <span className="text-sm">{qualification.need_score}/25</span>
                    </div>
                    <Progress value={qualification.need_score * 4} className="h-1 mb-1" />
                    {qualification.need_notes && (
                      <p className="text-xs text-muted-foreground">{qualification.need_notes}</p>
                    )}
                  </div>

                  {/* Timing */}
                  <div className="p-3 bg-white rounded-lg border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">⏰ Timing</span>
                      <span className="text-sm">{qualification.timing_score}/25</span>
                    </div>
                    <Progress value={qualification.timing_score * 4} className="h-1 mb-1" />
                    {qualification.timing_notes && (
                      <p className="text-xs text-muted-foreground">{qualification.timing_notes}</p>
                    )}
                  </div>
                </div>

                {/* Perfil comportamental */}
                {(qualification.communication_style || qualification.price_sensitivity) && (
                  <Card>
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm">Perfil Comportamental</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-2">
                      {qualification.communication_style && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Comunicação:</span>
                          <span className="capitalize">{qualification.communication_style}</span>
                        </div>
                      )}
                      {qualification.price_sensitivity && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Sensibilidade a preço:</span>
                          <span className="capitalize">{qualification.price_sensitivity}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Tab Sugestões */}
          <TabsContent value="suggestions" className="p-4 pt-0 space-y-3">
            {suggestions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma sugestão no momento</p>
              </div>
            ) : (
              suggestions.map((suggestion) => (
                <Card key={suggestion.id} className="overflow-hidden">
                  <CardHeader className="p-3 pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{suggestion.title}</CardTitle>
                      <Badge className={getPriorityBadge(suggestion.priority)}>
                        {suggestion.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className="text-sm text-muted-foreground mb-3">{suggestion.content}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleApplySuggestion(suggestion)}
                      >
                        Usar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => dismissSuggestion(suggestion)}
                      >
                        Ignorar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </ScrollArea>

      {/* Footer com refresh */}
      <div className="p-2 border-t bg-white">
        <Button variant="ghost" size="sm" className="w-full" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar dados
        </Button>
      </div>
    </div>
  );
}
