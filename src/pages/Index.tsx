import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyQuery } from "@/hooks/useCompanyQuery";
import { 
  MessageSquare, 
  Target, 
  TrendingUp, 
  CheckSquare,
  Clock,
  AlertCircle
} from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { CalendarWidget } from "@/components/analytics/CalendarWidget";

export default function Index() {
  const { companyId } = useCompanyQuery();
  const navigate = useNavigate();

  // Fetch summary stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats", companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const [conversationsData, dealsData, revenueData, tasksData] = await Promise.all([
        supabase
          .from("conversations")
          .select("*", { count: "exact", head: true })
          .eq("company_id", companyId),
        supabase
          .from("deals")
          .select("*", { count: "exact", head: true })
          .eq("company_id", companyId)
          .eq("status", "open"),
        supabase
          .from("deals")
          .select("value")
          .eq("company_id", companyId)
          .eq("status", "won"),
        supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("company_id", companyId)
          .eq("status", "pending"),
      ]);

      const totalRevenue = revenueData.data?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0;

      return {
        totalConversations: conversationsData.count || 0,
        openDeals: dealsData.count || 0,
        totalRevenue,
        pendingTasks: tasksData.count || 0,
      };
    },
    enabled: !!companyId,
  });

  // Fetch recent conversations
  const { data: recentConversations = [] } = useQuery({
    queryKey: ["recent-conversations", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data } = await supabase
        .from("conversations")
        .select("*")
        .eq("company_id", companyId)
        .order("last_message_time", { ascending: false })
        .limit(5);

      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch today's tasks
  const { data: todayTasks = [] } = useQuery({
    queryKey: ["today-tasks", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const today = new Date();
      const { data } = await supabase
        .from("tasks")
        .select("*, contacts(*), deals(*)")
        .eq("company_id", companyId)
        .eq("status", "pending")
        .gte("due_date", startOfDay(today).toISOString())
        .lte("due_date", endOfDay(today).toISOString())
        .order("due_date");

      return data || [];
    },
    enabled: !!companyId,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const cards = [
    {
      title: "Conversas Totais",
      value: stats?.totalConversations || 0,
      icon: MessageSquare,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      title: "Negócios em Aberto",
      value: stats?.openDeals || 0,
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
    },
    {
      title: "Receita Total",
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      title: "Tarefas Pendentes",
      value: stats?.pendingTasks || 0,
      icon: CheckSquare,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do seu CRM
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-20" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            cards.map((card, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {card.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <card.icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Calendar Widget and Recent Conversations */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Agenda do Dia */}
          <div className="lg:col-span-1">
            <CalendarWidget />
          </div>

          {/* Conversas Recentes */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Conversas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {recentConversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma conversa ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => navigate("/chat")}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{conv.contact_name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.last_message || "Sem mensagens"}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {conv.last_message_time &&
                          format(new Date(conv.last_message_time), "HH:mm", {
                            locale: ptBR,
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Today's Tasks and Alerts */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Tarefas de Hoje */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Tarefas de Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma tarefa para hoje</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => navigate("/tasks")}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {task.contacts?.name || task.deals?.title || "Sem vínculo"}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(task.due_date), "HH:mm", {
                          locale: ptBR,
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deals que Precisam Atenção */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Negócios em Risco
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Verificando negócios...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}