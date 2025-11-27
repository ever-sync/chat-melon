import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, TrendingUp, Flame, Snowflake, AlertCircle, Edit, Copy, RefreshCw, Target, FileText, Calendar, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Conversation } from "@/pages/Chat";

type Message = {
  id: string;
  content: string;
  is_from_me: boolean;
  timestamp: string;
};

type AIAnalysis = {
  suggestions: string[];
  sentiment: number;
  intent: string;
  temperature: string;
  urgency: string;
  next_action: string;
  summary: string;
  suggested_actions: Array<{
    type: "task" | "proposal" | "meeting" | "deal";
    label: string;
    description: string;
  }>;
  battle_card?: boolean;
  competitor_mentioned?: string;
};

type ToneType = "formal" | "casual" | "technical" | "friendly";

interface AIAssistantProps {
  conversation: Conversation;
  messages: Message[];
  onUseSuggestion: (text: string) => void;
  onCreateTask?: () => void;
  onCreateProposal?: () => void;
}

export const AIAssistant = ({ conversation, messages, onUseSuggestion, onCreateTask, onCreateProposal }: AIAssistantProps) => {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tone, setTone] = useState<ToneType>(() => {
    const saved = localStorage.getItem('ai-tone');
    return (saved as ToneType) || 'friendly';
  });

  useEffect(() => {
    if (messages.length > 0) {
      analyzeConversation();
    }
  }, [messages]);

  const analyzeConversation = async () => {
    if (messages.length === 0) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-conversation', {
        body: {
          messages: messages.slice(-20),
          contactName: conversation.contact_name,
          contactCompany: null,
          tone,
        },
      });

      if (error) throw error;
      setAnalysis(data);
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      toast.error("Não foi possível analisar a conversa");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToneChange = (newTone: ToneType) => {
    setTone(newTone);
    localStorage.setItem('ai-tone', newTone);
    if (messages.length > 0) {
      analyzeConversation();
    }
  };

  const handleEditSuggestion = (suggestion: string) => {
    onUseSuggestion(suggestion);
    // Focus will be handled by parent component
  };

  const copySummary = () => {
    if (analysis?.summary) {
      navigator.clipboard.writeText(analysis.summary);
      toast.success("Resumo copiado para a área de transferência");
    }
  };

  const executeAction = (actionType: string) => {
    switch (actionType) {
      case "task":
        onCreateTask?.();
        break;
      case "proposal":
        onCreateProposal?.();
        break;
      case "meeting":
        toast.info("Funcionalidade de agendamento em desenvolvimento");
        break;
      case "deal":
        toast.info("Criação rápida de negócio em desenvolvimento");
        break;
    }
  };

  const getSentimentEmoji = (score: number) => {
    if (score >= 0.7) return "😊";
    if (score >= 0.4) return "😐";
    return "😟";
  };

  const getTemperatureIcon = (temp: string) => {
    switch (temp) {
      case "hot": return <Flame className="w-4 h-4 text-orange-500" />;
      case "warm": return <TrendingUp className="w-4 h-4 text-yellow-500" />;
      case "cold": return <Snowflake className="w-4 h-4 text-blue-500" />;
      default: return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getIntentBadgeVariant = (intent: string) => {
    switch (intent) {
      case "compra": return "default";
      case "interesse": return "secondary";
      case "objecao": return "destructive";
      case "duvida": return "outline";
      default: return "outline";
    }
  };

  return (
    <div className="w-80 border-l border-border bg-muted/20 flex flex-col">
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Assistente IA</h3>
          </div>
        </div>
        <Select value={tone} onValueChange={(v) => handleToneChange(v as ToneType)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="formal">Formal</SelectItem>
            <SelectItem value="casual">Casual</SelectItem>
            <SelectItem value="technical">Técnico</SelectItem>
            <SelectItem value="friendly">Amigável</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : analysis ? (
            <>
              {/* Análise da Conversa */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">📊 Análise da Conversa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Sentimento */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Sentimento</span>
                      <span className="font-medium">
                        {getSentimentEmoji(analysis.sentiment)} {analysis.sentiment >= 0.7 ? 'Positivo' : analysis.sentiment >= 0.4 ? 'Neutro' : 'Negativo'}
                      </span>
                    </div>
                  </div>

                  {/* Temperatura */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Temperatura</span>
                    <div className="flex items-center gap-1">
                      {getTemperatureIcon(analysis.temperature)}
                      <span className="text-xs font-medium">
                        {analysis.temperature === 'hot' ? '🔥 Quente' : analysis.temperature === 'warm' ? '🌡️ Morno' : '❄️ Frio'}
                      </span>
                    </div>
                  </div>

                  {/* Intenção */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Intenção</span>
                    <Badge variant={getIntentBadgeVariant(analysis.intent)} className="text-xs">
                      {analysis.intent}
                    </Badge>
                  </div>

                  {/* Urgência */}
                  {analysis.urgency && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Urgência</span>
                      <Badge variant={analysis.urgency === 'alta' ? 'destructive' : 'secondary'} className="text-xs">
                        {analysis.urgency}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sugestões de Resposta */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">💡 Sugestões de Resposta</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={analyzeConversation}
                      disabled={isLoading}
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {analysis.suggestions.map((suggestion, index) => (
                    <div key={index} className="p-2 bg-muted/50 rounded-md space-y-2">
                      <p className="text-xs">{suggestion}</p>
                      <div className="flex gap-1">
                        <Button
                          variant="default"
                          size="sm"
                          className="h-6 text-xs flex-1"
                          onClick={() => onUseSuggestion(suggestion)}
                        >
                          Usar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs flex-1"
                          onClick={() => handleEditSuggestion(suggestion)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Resumo da Conversa */}
              {analysis.summary && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">📝 Resumo da Conversa</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={copySummary}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground leading-relaxed">{analysis.summary}</p>
                  </CardContent>
                </Card>
              )}

              {/* Próximos Passos Sugeridos */}
              {analysis.suggested_actions && analysis.suggested_actions.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">🎯 Próximos Passos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {analysis.suggested_actions.map((action, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-muted/50 rounded-md">
                        <div className="flex-1">
                          <p className="text-xs font-medium mb-1">{action.label}</p>
                          <p className="text-xs text-muted-foreground">{action.description}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => executeAction(action.type)}
                        >
                          <CheckCircle className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Battle Card (se houver concorrente) */}
              {analysis.battle_card && analysis.competitor_mentioned && (
                <Card className="border-orange-500/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      Concorrente Mencionado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs font-medium mb-2">{analysis.competitor_mentioned}</p>
                    <div className="space-y-2">
                      <div className="text-xs">
                        <p className="text-muted-foreground mb-1">Vantagens:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>Melhor custo-benefício</li>
                          <li>Suporte personalizado</li>
                          <li>Integração completa</li>
                        </ul>
                      </div>
                      <div className="text-xs">
                        <p className="text-muted-foreground mb-1">Resposta sugerida:</p>
                        <p className="italic">"Entendo sua comparação. Nossa solução se diferencia pelo..."</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Inicie uma conversa para receber sugestões da IA</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border bg-card">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={analyzeConversation}
          disabled={isLoading || messages.length === 0}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Atualizar Análise
        </Button>
      </div>
    </div>
  );
};
