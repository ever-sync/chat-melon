import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, DollarSign, TrendingUp, CheckSquare, ArrowUpRight, ArrowDownRight, MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyQuery } from "@/hooks/crm/useCompanyQuery";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RevenueChart } from "@/components/analytics/RevenueChart";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

export default function Dashboard() {
  const { companyId } = useCompanyQuery();
  const navigate = useNavigate();
  const { revenueData, metrics } = useAnalytics(6);
  const { isFeatureEnabled } = useFeatureFlags();

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

  const allCards = [
    {
      title: "Total de Conversas",
      value: stats.totalConversations,
      icon: MessageSquare,
      color: "text-indigo-600",
      bgColor: "bg-indigo-600/10",
      path: "/chat",
      trend: "+12%",
      trendUp: true,
      feature: "chat" as const
    },
    {
      title: "Receita Total",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-600/10",
      path: "/crm",
      trend: "+8%",
      trendUp: true,
      feature: "deals_pipeline" as const
    },
    {
      title: "Negócios Abertos",
      value: stats.openDeals,
      icon: TrendingUp,
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
      path: "/crm",
      trend: "-2%",
      trendUp: false,
      feature: "deals_pipeline" as const
    },
    {
      title: "Tarefas Pendentes",
      value: stats.pendingTasks,
      icon: CheckSquare,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      path: "/tasks",
      trend: "+5%",
      trendUp: true
    },
  ];

  const cards = allCards.filter(card => !card.feature || isFeatureEnabled(card.feature));

  return (
    <MainLayout>
      <div className="space-y-8 p-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-2 text-lg">
              Visão geral das suas métricas e atividades
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-xl h-11 px-6 border-gray-200 text-gray-600 hover:bg-gray-50">
              Últimos 7 dias
            </Button>
            <Button className="rounded-xl h-11 px-6 bg-black hover:bg-gray-800 text-white shadow-lg shadow-black/20">
              Exportar Relatório
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Card
              key={card.title}
              className="border-0 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 rounded-[24px] bg-white overflow-hidden group"
              onClick={() => navigate(card.path)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className={`p-3.5 rounded-2xl ${card.bgColor} transition-colors group-hover:scale-110 duration-300`}>
                    <card.icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${card.trendUp ? 'text-emerald-600' : 'text-rose-600'} bg-gray-50 px-2 py-1 rounded-lg`}>
                    {card.trendUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {card.trend}
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-500">
                    {card.title}
                  </h3>
                  <p className="text-3xl font-bold text-gray-900 tracking-tight">
                    {card.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Gráfico de Receita */}
        {isFeatureEnabled('deals_pipeline') && (
          <Card className="border-0 shadow-sm rounded-[32px] bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-8 pb-0">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Receita</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Últimos 6 meses</p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                <MoreHorizontal className="h-5 w-5 text-gray-500" />
              </Button>
            </CardHeader>
            <CardContent className="p-8 pt-6">
              {revenueData && revenueData.length > 0 ? (
                <RevenueChart data={revenueData} />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
                  Nenhum dado de receita disponível
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-8 md:grid-cols-2">
          {isFeatureEnabled('chat') && (
            <Card className="border-0 shadow-sm rounded-[32px] bg-white overflow-hidden h-full">
              <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
                <CardTitle className="text-xl font-bold text-gray-900">Conversas Recentes</CardTitle>
                <Button variant="ghost" className="text-sm text-gray-500 hover:text-gray-900 font-medium">
                  Ver todas
                </Button>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                {recentConversations.length === 0 ? (
                  <div className="h-[200px] flex items-center justify-center text-gray-400 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
                    Nenhuma conversa recente
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentConversations.map((conv) => (
                      <div
                        key={conv.id}
                        className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-all cursor-pointer group border border-transparent hover:border-gray-100"
                        onClick={() => navigate('/chat')}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center text-indigo-600 font-semibold text-lg">
                            {conv.contact_name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                              {conv.contact_name}
                            </p>
                            <p className="text-sm text-gray-500 truncate mt-0.5">
                              {conv.last_message}
                            </p>
                          </div>
                        </div>
                        {conv.unread_count > 0 && (
                          <span className="bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg shadow-rose-500/30">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-sm rounded-[32px] bg-white overflow-hidden h-full">
            <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
              <CardTitle className="text-xl font-bold text-gray-900">Tarefas de Hoje</CardTitle>
              <Button variant="ghost" className="text-sm text-gray-500 hover:text-gray-900 font-medium">
                Ver todas
              </Button>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              {todayTasks.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-gray-400 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
                  Nenhuma tarefa para hoje
                </div>
              ) : (
                <div className="space-y-3">
                  {todayTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all cursor-pointer group border border-transparent hover:border-gray-100"
                      onClick={() => navigate('/tasks')}
                    >
                      <div className="p-3 rounded-xl bg-orange-50 text-orange-500 group-hover:bg-orange-100 transition-colors">
                        <CheckSquare className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                          {task.title}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
                          <span className="font-medium text-gray-700">{task.contacts?.name}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          {format(new Date(task.due_date), 'HH:mm', { locale: ptBR })}
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