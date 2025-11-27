import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Eye, ExternalLink } from "lucide-react";
import type { Insight } from "@/hooks/useInsights";
import { useNavigate } from "react-router-dom";

const insightIcons: Record<string, string> = {
  deal_at_risk: "🔥",
  upsell_opportunity: "💰",
  follow_up_needed: "⏰",
  trend_detected: "📈",
  goal_progress: "🎯",
  response_time_alert: "⚠️",
  achievement_near: "🏆",
};

const priorityColors = {
  high: "destructive",
  medium: "secondary",
  low: "outline",
} as const;

const priorityLabels = {
  high: "ALTA PRIORIDADE",
  medium: "MÉDIA PRIORIDADE",
  low: "BAIXA PRIORIDADE",
};

interface InsightCardProps {
  insight: Insight;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export const InsightCard = ({ insight, onMarkAsRead, onDelete }: InsightCardProps) => {
  const navigate = useNavigate();

  const handleAction = (actionType?: string, actionData?: any) => {
    onMarkAsRead(insight.id);
    
    if (!actionType || !actionData) return;

    switch (actionType) {
      case "view_deal":
        navigate(`/crm`);
        break;
      case "create_task":
        navigate(`/tasks`);
        break;
      case "send_message":
        navigate(`/chat`);
        break;
      case "view_details":
        // Could open a modal or navigate to details
        break;
      default:
        break;
    }
  };

  return (
    <Card className="p-4 relative">
      {!insight.is_read && (
        <div className="absolute top-2 right-2">
          <Badge variant="default" className="text-xs">Novo</Badge>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="text-2xl">{insightIcons[insight.insight_type] || "💡"}</div>
        
        <div className="flex-1 space-y-2">
          <div>
            <h4 className="font-semibold text-sm">{insight.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {insight.description}
            </p>
          </div>

          {insight.is_actionable && (
            <div className="flex flex-wrap gap-2 mt-3">
              {insight.action_type === "view_deal" && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleAction(insight.action_type, insight.action_data)}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Ver negócio
                </Button>
              )}
              
              {insight.action_type === "create_task" && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleAction(insight.action_type, insight.action_data)}
                >
                  Criar tarefa
                </Button>
              )}

              {insight.action_type === "send_message" && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleAction(insight.action_type, insight.action_data)}
                >
                  Enviar mensagem
                </Button>
              )}

              {insight.action_type === "view_details" && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleAction(insight.action_type, insight.action_data)}
                >
                  Ver detalhes
                </Button>
              )}

              {!insight.is_read && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onMarkAsRead(insight.id)}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Marcar como lido
                </Button>
              )}
            </div>
          )}
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(insight.id)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};
