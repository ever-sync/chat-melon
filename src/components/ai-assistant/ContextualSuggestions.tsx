import React from 'react';
import {
  Target,
  MessageSquare,
  Zap,
  ThumbsUp,
  ThumbsDown,
  Copy,
  ExternalLink,
  Clock,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAssistant } from '@/hooks/ai-assistant';
import { useContextualSuggestions } from '@/hooks/ai-assistant/useContextualSuggestions';
import { useCopyToClipboard } from '@/hooks/ui/useCopyToClipboard';
import { useToast } from '@/hooks/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  AISuggestion,
  Priority,
  SuggestionType,
  getPriorityColor,
  MessageForAnalysis,
} from '@/types/ai-assistant';
import { sortSuggestions } from '@/hooks/ai-assistant/useContextualSuggestions';

interface ContextualSuggestionsProps {
  conversationId?: string;
  companyId?: string;
}

export function ContextualSuggestions({ conversationId, companyId }: ContextualSuggestionsProps = {}) {
  const { allSuggestions, isLoading, isGenerating, generateSuggestions } = useAssistant();
  const { user } = useAuth();
  const { toast } = useToast();

  // Filtrar apenas sugestões (não alertas)
  const suggestions = sortSuggestions(
    allSuggestions.filter((s) => s.type !== 'alert')
  );

  if (isLoading) {
    return <SuggestionsSkeleton />;
  }

  // Função para gerar sugestões manualmente
  const handleGenerateSuggestions = async () => {
    if (!conversationId || !companyId) {
      toast({
        title: 'Selecione uma conversa',
        description: 'Selecione uma conversa para gerar sugestões.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Buscar últimas mensagens da conversa
      const { data: recentMessages } = await supabase
        .from('messages')
        .select('id, content, is_from_me, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!recentMessages || recentMessages.length === 0) {
        toast({
          title: 'Sem mensagens',
          description: 'Não há mensagens suficientes para gerar sugestões.',
          variant: 'destructive',
        });
        return;
      }

      const messages: MessageForAnalysis[] = recentMessages
        .reverse()
        .map((m: any) => ({
          id: m.id,
          content: m.content || '',
          sender_type: m.is_from_me ? 'agent' : 'contact',
          created_at: m.created_at,
        }));

      generateSuggestions({
        conversationId,
        companyId,
        messages,
        trigger: 'manual',
      });

      toast({
        title: 'Gerando sugestões...',
        description: 'As sugestões aparecerão em instantes.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar sugestões.',
        variant: 'destructive',
      });
    }
  };

  if (suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Sparkles className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          Nenhuma sugestão no momento
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {conversationId
            ? 'Clique abaixo para gerar sugestões para esta conversa'
            : 'Selecione uma conversa para gerar sugestões'
          }
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={handleGenerateSuggestions}
          disabled={isGenerating || !conversationId}
        >
          {isGenerating ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          {conversationId ? 'Gerar sugestões agora' : 'Selecione uma conversa'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Sugestões para Você
        </h4>
        {isGenerating && (
          <Badge variant="secondary" className="animate-pulse">
            Analisando...
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <SuggestionCard key={suggestion.id} suggestion={suggestion} />
        ))}
      </div>
    </div>
  );
}

interface SuggestionCardProps {
  suggestion: AISuggestion;
}

function SuggestionCard({ suggestion }: SuggestionCardProps) {
  const { useSuggestion, giveFeedback } = useAssistant();
  const { copyToClipboard } = useCopyToClipboard();
  const { toast } = useToast();

  const handleCopyResponse = async () => {
    if (suggestion.suggested_response) {
      await copyToClipboard(suggestion.suggested_response);
      useSuggestion(suggestion.id);
      toast({
        title: 'Resposta copiada!',
        description: 'Cole no campo de mensagem para usar.',
      });
    }
  };

  const handleFeedback = (wasUseful: boolean) => {
    giveFeedback({
      suggestionId: suggestion.id,
      wasUseful,
    });
    toast({
      title: wasUseful ? 'Obrigado!' : 'Entendido!',
      description: 'Seu feedback ajuda a melhorar as sugestões.',
    });
  };

  const priorityColor = getPriorityBadgeClass(suggestion.priority);
  const typeIcon = getSuggestionTypeIcon(suggestion.type);

  return (
    <Card className={cn(
      'transition-all hover:shadow-md',
      suggestion.priority === 'urgent' && 'border-red-200 bg-red-50/50',
      suggestion.priority === 'high' && 'border-orange-200 bg-orange-50/30'
    )}>
      <CardContent className="p-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Badge className={priorityColor}>
              {getPriorityLabel(suggestion.priority)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {typeIcon} {getSuggestionTypeLabel(suggestion.type)}
            </span>
          </div>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {getTimeAgo(suggestion.created_at)}
          </span>
        </div>

        {/* Título */}
        <h5 className="font-medium text-sm mb-1">{suggestion.title}</h5>

        {/* Descrição */}
        {suggestion.description && (
          <p className="text-xs text-muted-foreground mb-2">
            {suggestion.description}
          </p>
        )}

        {/* Resposta sugerida */}
        {suggestion.suggested_response && (
          <div className="bg-muted/50 rounded-md p-2 mb-2">
            <p className="text-xs text-foreground italic">
              "{truncateText(suggestion.suggested_response, 150)}"
            </p>
          </div>
        )}

        {/* Contexto/Razão */}
        {suggestion.reasoning && (
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            {suggestion.reasoning}
          </p>
        )}

        {/* Ações */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            {suggestion.suggested_response && (
              <Button
                variant="secondary"
                size="sm"
                className="h-7 text-xs"
                onClick={handleCopyResponse}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copiar
              </Button>
            )}

            {suggestion.conversation_id && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                // onClick para navegar para a conversa
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Ver conversa
              </Button>
            )}
          </div>

          {/* Feedback */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleFeedback(true)}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleFeedback(false)}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton para loading
function SuggestionsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-32" />
      <Skeleton className="h-28" />
      <Skeleton className="h-24" />
    </div>
  );
}

// Utilitários
function getPriorityBadgeClass(priority: Priority): string {
  switch (priority) {
    case 'urgent': return 'bg-red-500 text-white';
    case 'high': return 'bg-orange-500 text-white';
    case 'medium': return 'bg-yellow-500 text-white';
    case 'low': return 'bg-green-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
}

function getPriorityLabel(priority: Priority): string {
  switch (priority) {
    case 'urgent': return 'Urgente';
    case 'high': return 'Alta';
    case 'medium': return 'Média';
    case 'low': return 'Baixa';
    default: return priority;
  }
}

function getSuggestionTypeIcon(type: SuggestionType): string {
  switch (type) {
    case 'response': return '💬';
    case 'action': return '⚡';
    case 'tip': return '💡';
    case 'alert': return '⚠️';
    default: return '📋';
  }
}

function getSuggestionTypeLabel(type: SuggestionType): string {
  switch (type) {
    case 'response': return 'Resposta';
    case 'action': return 'Ação';
    case 'tip': return 'Dica';
    case 'alert': return 'Alerta';
    default: return type;
  }
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `${diffMins}min`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default ContextualSuggestions;
