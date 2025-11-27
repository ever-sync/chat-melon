import { useInsights } from "@/hooks/useInsights";
import { InsightCard } from "./InsightCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export const InsightsDashboard = () => {
  const { insights, unreadCount, isLoading, markAsRead, deleteInsight } = useInsights();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  const highPriorityInsights = insights.filter((i) => i.priority === "high");
  const mediumPriorityInsights = insights.filter((i) => i.priority === "medium");
  const lowPriorityInsights = insights.filter((i) => i.priority === "low");

  if (insights.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">💡</div>
            <h3 className="text-lg font-semibold mb-2">Nenhum insight disponível</h3>
            <p className="text-sm text-muted-foreground">
              Os insights são gerados automaticamente com base nos dados da sua empresa.
              <br />
              Continue usando o sistema e novos insights aparecerão aqui.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>💡 Insights</span>
            {unreadCount > 0 && (
              <Badge variant="default">{unreadCount} novos</Badge>
            )}
          </CardTitle>
        </CardHeader>
      </Card>

      {highPriorityInsights.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-destructive/20" />
            <Badge variant="destructive">🔴 ALTA PRIORIDADE</Badge>
            <div className="h-px flex-1 bg-destructive/20" />
          </div>
          {highPriorityInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onMarkAsRead={markAsRead.mutate}
              onDelete={deleteInsight.mutate}
            />
          ))}
        </div>
      )}

      {mediumPriorityInsights.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <Badge variant="secondary">🟡 MÉDIA PRIORIDADE</Badge>
            <div className="h-px flex-1 bg-border" />
          </div>
          {mediumPriorityInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onMarkAsRead={markAsRead.mutate}
              onDelete={deleteInsight.mutate}
            />
          ))}
        </div>
      )}

      {lowPriorityInsights.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <Badge variant="outline">🟢 BAIXA PRIORIDADE</Badge>
            <div className="h-px flex-1 bg-border" />
          </div>
          {lowPriorityInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onMarkAsRead={markAsRead.mutate}
              onDelete={deleteInsight.mutate}
            />
          ))}
        </div>
      )}
    </div>
  );
};
