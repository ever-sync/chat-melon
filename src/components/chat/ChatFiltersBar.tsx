import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChatFilters } from '@/types/chatFilters';
import { LabelBadge } from './LabelBadge';

interface ChatFiltersBarProps {
  filters: ChatFilters;
  onRemoveStatus: (status: string) => void;
  onRemoveLabel: (labelId: string) => void;
  onClearAll: () => void;
  labels: Array<{ id: string; name: string; color: string; icon?: string | null }>;
}

export const ChatFiltersBar = ({
  filters,
  onRemoveStatus,
  onRemoveLabel,
  onClearAll,
  labels,
}: ChatFiltersBarProps) => {
  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.labels.length > 0 ||
    filters.hasUnread ||
    filters.assignedTo !== 'all' ||
    filters.dateRange !== null ||
    filters.search !== '' ||
    filters.lastMessageDate ||
    filters.noResponseTime ||
    filters.hasMedia !== undefined;

  if (!hasActiveFilters) return null;

  const statusLabels: Record<string, string> = {
    waiting: 'Fila de Espera',
    re_entry: 'Reentrada',
    active: 'Ativo',
    chatbot: 'ChatBot',
    closed: 'Encerrado',
  };

  const assignedToLabels: Record<string, string> = {
    me: 'Meus Atendimentos',
    unassigned: 'Não Atribuídos',
    all: 'Todos',
  };

  const getLabelData = (labelId: string) => {
    return labels.find((l) => l.id === labelId);
  };

  return (
    <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/30 flex-wrap">
      <span className="text-sm text-muted-foreground">Filtros:</span>

      {filters.status.map((status) => (
        <Badge key={status} variant="secondary" className="gap-1">
          {statusLabels[status] || status}
          <button
            onClick={() => onRemoveStatus(status)}
            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {filters.assignedTo !== 'all' && (
        <Badge variant="secondary" className="gap-1">
          {assignedToLabels[filters.assignedTo] || 'Atribuído'}
          <button
            onClick={() => onClearAll()}
            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {filters.labels.map((labelId) => {
        const labelData = getLabelData(labelId);
        if (!labelData) return null;
        return (
          <div key={labelId} className="flex items-center gap-1">
            <LabelBadge
              name={labelData.name}
              color={labelData.color}
              icon={labelData.icon}
            />
            <button
              onClick={() => onRemoveLabel(labelId)}
              className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}

      {filters.hasUnread && (
        <Badge variant="secondary" className="gap-1">
          Não lidas
          <button
            onClick={() => onClearAll()}
            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {filters.lastMessageDate && (
        <Badge variant="secondary" className="gap-1">
          {filters.lastMessageDate === 'today' && 'Hoje'}
          {filters.lastMessageDate === 'yesterday' && 'Ontem'}
          {filters.lastMessageDate === 'week' && 'Última semana'}
          {filters.lastMessageDate === 'month' && 'Último mês'}
          <button
            onClick={() => onClearAll()}
            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {filters.noResponseTime && (
        <Badge variant="secondary" className="gap-1">
          Sem resposta &gt; {filters.noResponseTime}
          <button
            onClick={() => onClearAll()}
            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {filters.hasMedia !== undefined && (
        <Badge variant="secondary" className="gap-1">
          {filters.hasMedia ? 'Com mídia' : 'Sem mídia'}
          <button
            onClick={() => onClearAll()}
            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="ml-auto text-xs"
      >
        Limpar todos
      </Button>
    </div>
  );
};
