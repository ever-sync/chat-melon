import React from 'react';
import {
  AlertTriangle,
  Clock,
  MessageSquare,
  ExternalLink,
  CheckCircle2,
  Bell,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAssistant } from '@/hooks/ai-assistant';
import { AISuggestion, Priority } from '@/types/ai-assistant';
import { sortSuggestions } from '@/hooks/ai-assistant/useContextualSuggestions';

export function AlertsPanel() {
  const { alerts, urgentAlerts, isLoading, useSuggestion } = useAssistant();

  const sortedAlerts = sortSuggestions(alerts);

  if (isLoading) {
    return <AlertsPanelSkeleton />;
  }

  if (sortedAlerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-500 mb-3" />
        <p className="text-sm text-muted-foreground">
          Nenhum alerta no momento
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Você está em dia com tudo!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com contagem */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          Alertas Ativos
          <Badge variant="secondary">{sortedAlerts.length}</Badge>
        </h4>

        {urgentAlerts.length > 0 && (
          <Badge variant="destructive" className="animate-pulse">
            {urgentAlerts.length} urgente{urgentAlerts.length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Lista de alertas */}
      <div className="space-y-3">
        {sortedAlerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onDismiss={() => useSuggestion(alert.id)}
          />
        ))}
      </div>

      {/* Histórico resumido */}
      <div className="pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Alertas resolvidos hoje serão listados aqui
        </p>
      </div>
    </div>
  );
}

interface AlertCardProps {
  alert: AISuggestion;
  onDismiss: () => void;
}

function AlertCard({ alert, onDismiss }: AlertCardProps) {
  const isUrgent = alert.priority === 'urgent';
  const isHigh = alert.priority === 'high';

  return (
    <Card
      className={cn(
        'transition-all',
        isUrgent && 'border-red-300 bg-red-50 animate-pulse-subtle',
        isHigh && 'border-orange-200 bg-orange-50/50'
      )}
    >
      <CardContent className="p-3">
        {/* Header do alerta */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <AlertIcon priority={alert.priority} />
            <div>
              <h5 className="font-medium text-sm">{alert.title}</h5>
              {alert.conversation?.contact?.name && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  {alert.conversation.contact.name}
                </div>
              )}
            </div>
          </div>
          <Badge className={getPriorityBadgeClass(alert.priority)}>
            {getPriorityLabel(alert.priority)}
          </Badge>
        </div>

        {/* Descrição */}
        {alert.description && (
          <p className="text-xs text-muted-foreground mb-2">
            {alert.description}
          </p>
        )}

        {/* Contexto adicional */}
        {alert.trigger_context?.wait_time_seconds && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            <Clock className="h-3 w-3" />
            Aguardando há {formatWaitTime(alert.trigger_context.wait_time_seconds)}
          </div>
        )}

        {/* Tempo desde o alerta */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
          <Bell className="h-3 w-3" />
          Há {getTimeAgo(alert.created_at)}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2">
          {alert.conversation_id && (
            <Button
              variant={isUrgent ? 'default' : 'secondary'}
              size="sm"
              className="h-7 text-xs flex-1"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Responder agora
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onDismiss}
          >
            Dispensar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertIcon({ priority }: { priority: Priority }) {
  const iconClass = cn(
    'h-5 w-5',
    priority === 'urgent' && 'text-red-600',
    priority === 'high' && 'text-orange-600',
    priority === 'medium' && 'text-yellow-600',
    priority === 'low' && 'text-green-600'
  );

  return <AlertTriangle className={iconClass} />;
}

function AlertsPanelSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-20" />
      </div>
      <Skeleton className="h-32" />
      <Skeleton className="h-28" />
      <Skeleton className="h-24" />
    </div>
  );
}

// Utilitários
function getPriorityBadgeClass(priority: Priority): string {
  switch (priority) {
    case 'urgent': return 'bg-red-600 text-white';
    case 'high': return 'bg-orange-500 text-white';
    case 'medium': return 'bg-yellow-500 text-white';
    case 'low': return 'bg-gray-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
}

function getPriorityLabel(priority: Priority): string {
  switch (priority) {
    case 'urgent': return 'URGENTE';
    case 'high': return 'ALTA';
    case 'medium': return 'MÉDIA';
    case 'low': return 'BAIXA';
    default: return priority;
  }
}

function formatWaitTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;

  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours}h ${remainingMins}min`;
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `${diffMins} minuto${diffMins > 1 ? 's' : ''}`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hora${diffHours > 1 ? 's' : ''}`;

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default AlertsPanel;
