import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, DollarSign, TrendingUp, CheckSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyQuery } from "@/hooks/useCompanyQuery";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RevenueChart } from "@/components/analytics/RevenueChart";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { companyId } = useCompanyQuery();
  const navigate = useNavigate();
  const { revenueData, metrics } = useAnalytics(6);
  
  const [stats, setStats] = useState({
    totalConversations: 0,
    openDeals: 0,
    totalRevenue: 0,
    pendingTasks: 0,
  });
  const [recentConversations, setRecentConversations] = useState<any[]>([]);
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyId) {
      fetchStats();
      fetchRecentConversations();
      fetchTodayTasks();
    }
  }, [companyId]);

  const fetchStats = async () => {
    if (!companyId) return;

    try {
      const [conversationsData, dealsData, tasksData] = await Promise.all([
        supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId),
        supabase
          .from('deals')
          .select('value, status')
          .eq('company_id', companyId),
        supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('status', 'pending'),
      ]);

      const openDeals = dealsData.data?.filter(d => d.status === 'open').length || 0;
      const revenue = dealsData.data
        ?.filter(d => d.status === 'won')
        .reduce((sum, d) => sum + (d.value || 0), 0) || 0;

      setStats({
        totalConversations: conversationsData.count || 0,
        openDeals,
        totalRevenue: revenue,
        pendingTasks: tasksData.count || 0,
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentConversations = async () => {
    if (!companyId) return;

    try {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('company_id', companyId)
        .order('last_message_time', { ascending: false })
        .limit(5);

      setRecentConversations(data || []);
    } catch (error) {
      console.error("Erro ao buscar conversas:", error);
    }
  };

  const fetchTodayTasks = async () => {
    if (!companyId) return;

    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const { data } = await supabase
        .from('tasks')
        .select('*, contacts(name)')
        .eq('company_id', companyId)
        .eq('status', 'pending')
        .gte('due_date', startOfDay.toISOString())
        .lte('due_date', endOfDay.toISOString())
        .order('due_date', { ascending: true })
        .limit(5);

      setTodayTasks(data || []);
    } catch (error) {
      console.error("Erro ao buscar tarefas:", error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const cards = [
    {
      title: "Total de Conversas",
      value: stats.totalConversations,
      icon: MessageSquare,
      color: "text-blue-500",
      path: "/chat",
    },
    {
      title: "Receita Total",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: "text-green-500",
      path: "/crm",
    },
    {
      title: "Negócios Abertos",
      value: stats.openDeals,
      icon: TrendingUp,
      color: "text-purple-500",
      path: "/crm",
    },
    {
      title: "Tarefas Pendentes",
      value: stats.pendingTasks,
      icon: CheckSquare,
      color: "text-orange-500",
      path: "/tasks",
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-8 p-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Visão geral das suas métricas e atividades
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Card 
              key={card.title} 
              className="hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]"
              onClick={() => navigate(card.path)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </p>
                    <p className="text-3xl font-bold tracking-tight">
                      {card.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-2xl bg-${card.color.replace('text-', '')}/10`}>
                    <card.icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Gráfico de Receita */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Receita dos Últimos 6 Meses</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueData && revenueData.length > 0 ? (
              <RevenueChart data={revenueData} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado de receita disponível
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Conversas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {recentConversations.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Nenhuma conversa recente
                </p>
              ) : (
                <div className="space-y-4">
                  {recentConversations.map((conv) => (
                    <div 
                      key={conv.id} 
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate('/chat')}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{conv.contact_name}</p>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {conv.last_message}
                        </p>
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-full ml-3 flex-shrink-0">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Tarefas de Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              {todayTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Nenhuma tarefa para hoje
                </p>
              ) : (
                <div className="space-y-4">
                  {todayTasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate('/tasks')}
                    >
                      <div className="p-1.5 rounded-lg bg-primary/10 mt-0.5">
                        <CheckSquare className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{task.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {task.contacts?.name} • {format(new Date(task.due_date), 'HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}