import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';

export function InstanceHealthDashboard() {
  const { currentCompany } = useCompany();

  const { data: instances, isLoading } = useQuery({
    queryKey: ['instance-health', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      const { data, error } = await supabase
        .from('evolution_settings')
        .select('*')
        .eq('company_id', currentCompany.id);

      if (error) throw error;
      return data;
    },
    enabled: !!currentCompany?.id,
  });

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!instances || instances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saúde das Instâncias</CardTitle>
          <CardDescription>Nenhuma instância configurada</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {instances.map((instance) => {
        const usagePercent = (instance.messages_sent_today / instance.daily_message_limit) * 100;
        const isHealthy = instance.delivery_rate >= 90;
        const isWarning = instance.delivery_rate >= 70 && instance.delivery_rate < 90;
        const isDanger = instance.delivery_rate < 70;

        // Check if instance is new (created < 7 days ago)
        const createdAt = new Date(instance.created_at);
        const daysSinceCreation = Math.floor(
          (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        const isNewInstance = daysSinceCreation < 7;

        return (
          <Card key={instance.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{instance.instance_name}</CardTitle>
                  <CardDescription>
                    Status: {instance.is_connected ? 'Conectada' : 'Desconectada'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {isNewInstance && (
                    <Badge
                      variant="outline"
                      className="bg-blue-500/10 text-blue-500 border-blue-500/20"
                    >
                      🆕 Instância Nova ({daysSinceCreation} dias)
                    </Badge>
                  )}
                  {isHealthy && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {isWarning && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                  {isDanger && <AlertTriangle className="h-5 w-5 text-red-500" />}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Daily Limit Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Uso Diário
                  </span>
                  <span className="font-medium">
                    {instance.messages_sent_today} / {instance.daily_message_limit}
                  </span>
                </div>
                <Progress value={usagePercent} className="h-2" />
                {usagePercent >= 90 && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    ⚠️ Limite diário quase atingido
                  </p>
                )}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    Taxa de Entrega
                  </div>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    {instance.delivery_rate?.toFixed(1)}%
                    {instance.delivery_rate >= 95 && (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    )}
                    {instance.delivery_rate < 95 && instance.delivery_rate >= 85 && (
                      <TrendingUp className="h-4 w-4 text-yellow-500" />
                    )}
                    {instance.delivery_rate < 85 && (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    Taxa de Resposta
                  </div>
                  <div className="text-2xl font-bold">{instance.response_rate?.toFixed(1)}%</div>
                </div>
              </div>

              {/* Alerts */}
              {isNewInstance && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-500">
                        Instância Nova - Warmup Recomendado
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        Recomendamos começar com taxa menor (5-10 msgs/min) e aumentar gradualmente
                        nos próximos dias para evitar bloqueios.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isDanger && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-red-500">Alerta de Risco</p>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Taxa de entrega baixa detectada. Verifique se há muitos números inválidos ou
                        bloqueios.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {usagePercent >= 80 && usagePercent < 100 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-yellow-500">Limite Diário Próximo</p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">
                        Você já usou {usagePercent.toFixed(0)}% do limite diário. Novos envios serão
                        pausados automaticamente ao atingir 100%.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
