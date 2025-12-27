import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MessageSquare,
  DollarSign,
  TrendingUp,
  CheckSquare,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Settings2,
  Target,
  Clock,
  Award,
  Users,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyQuery } from '@/hooks/crm/useCompanyQuery';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RevenueChart } from '@/components/analytics/RevenueChart';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { DndContext, closestCenter, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { DashboardWidget } from '@/components/dashboard/DashboardWidget';
import { WidgetsSidebar } from '@/components/dashboard/WidgetsSidebar';
import { cn } from '@/lib/utils';

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
  const [pipelineStats, setPipelineStats] = useState<any[]>([]);

  // Customization states
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [activeWidgets, setActiveWidgets] = useState<string[]>([
    'conversations',
    'revenue',
    'deals',
    'tasks',
    'revenue-chart',
    'recent-conversations',
    'today-tasks',
  ]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    if (companyId) {
      fetchStats();
      fetchRecentConversations();
      fetchTodayTasks();
      fetchPipelineStats();
    }
  }, [companyId]);

  // Load saved widget layout from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-widgets');
    if (saved) {
      try {
        setActiveWidgets(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading saved widgets:', e);
      }
    }
  }, []);

  // Save widget layout to localStorage
  const saveWidgetLayout = (widgets: string[]) => {
    setActiveWidgets(widgets);
    localStorage.setItem('dashboard-widgets', JSON.stringify(widgets));
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setDraggedId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedId(null);

    if (over && active.id !== over.id) {
      const oldIndex = activeWidgets.indexOf(active.id as string);
      const newIndex = activeWidgets.indexOf(over.id as string);
      const newWidgets = arrayMove(activeWidgets, oldIndex, newIndex);
      saveWidgetLayout(newWidgets);
    }
  };

  // Widget management
  const handleAddWidget = (widgetId: string) => {
    if (!activeWidgets.includes(widgetId)) {
      saveWidgetLayout([...activeWidgets, widgetId]);
    }
  };

  const handleRemoveWidget = (widgetId: string) => {
    saveWidgetLayout(activeWidgets.filter((id) => id !== widgetId));
  };

  const toggleCustomization = () => {
    setIsCustomizing(!isCustomizing);
    setShowSidebar(!showSidebar);
  };

  const fetchStats = async () => {
    if (!companyId) return;

    try {
      const [conversationsData, dealsData, tasksData] = await Promise.all([
        supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId),
        supabase.from('deals').select('value, status').eq('company_id', companyId),
        supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('status', 'pending'),
      ]);

      const openDeals = dealsData.data?.filter((d) => d.status === 'open').length || 0;
      const revenue =
        dealsData.data
          ?.filter((d) => d.status === 'won')
          .reduce((sum, d) => sum + (d.value || 0), 0) || 0;

      setStats({
        totalConversations: conversationsData.count || 0,
        openDeals,
        totalRevenue: revenue,
        pendingTasks: tasksData.count || 0,
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
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
      console.error('Erro ao buscar conversas:', error);
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
      console.error('Erro ao buscar tarefas:', error);
    }
  };

  const fetchPipelineStats = async () => {
    if (!companyId) return;

    try {
      // Buscar pipelines com suas etapas
      const { data: pipelines, error: pipelineError } = await supabase
        .from('pipelines')
        .select(
          `
          id,
          name,
          pipeline_stages(
            id,
            name,
            order_index,
            color
          )
        `
        )
        .eq('company_id', companyId)
        .order('name');

      if (pipelineError) throw pipelineError;

      // Para cada pipeline, contar deals por etapa
      const statsPromises = (pipelines || []).map(async (pipeline: any) => {
        const stageStats = await Promise.all(
          (pipeline.pipeline_stages || []).map(async (stage: any) => {
            const { count } = await supabase
              .from('deals')
              .select('*', { count: 'exact', head: true })
              .eq('company_id', companyId)
              .eq('pipeline_id', pipeline.id)
              .eq('stage_id', stage.id)
              .neq('status', 'lost')
              .neq('status', 'won');

            return {
              ...stage,
              count: count || 0,
            };
          })
        );

        return {
          ...pipeline,
          stages: stageStats.sort((a, b) => a.order_index - b.order_index),
        };
      });

      const stats = await Promise.all(statsPromises);
      setPipelineStats(stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas do pipeline:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Render widget content based on widget ID
  const renderWidgetContent = (widgetId: string) => {
    switch (widgetId) {
      case 'conversations':
        return (
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="p-3.5 rounded-2xl bg-indigo-600/10 transition-colors">
                <MessageSquare className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-emerald-600 bg-gray-50 px-2 py-1 rounded-lg">
                <ArrowUpRight className="h-4 w-4" />
                +12%
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-500">Total de Conversas</h3>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">
                {stats.totalConversations}
              </p>
            </div>
          </div>
        );

      case 'revenue':
        return (
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="p-3.5 rounded-2xl bg-emerald-600/10 transition-colors">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-emerald-600 bg-gray-50 px-2 py-1 rounded-lg">
                <ArrowUpRight className="h-4 w-4" />
                +8%
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-500">Receita Total</h3>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
          </div>
        );

      case 'deals':
        return (
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="p-3.5 rounded-2xl bg-violet-500/10 transition-colors">
                <TrendingUp className="h-6 w-6 text-violet-500" />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-rose-600 bg-gray-50 px-2 py-1 rounded-lg">
                <ArrowDownRight className="h-4 w-4" />
                -2%
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-500">Negócios Abertos</h3>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">{stats.openDeals}</p>
            </div>
          </div>
        );

      case 'tasks':
        return (
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="p-3.5 rounded-2xl bg-orange-500/10 transition-colors">
                <CheckSquare className="h-6 w-6 text-orange-500" />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-emerald-600 bg-gray-50 px-2 py-1 rounded-lg">
                <ArrowUpRight className="h-4 w-4" />
                +5%
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-500">Tarefas Pendentes</h3>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">
                {stats.pendingTasks}
              </p>
            </div>
          </div>
        );

      case 'revenue-chart':
        return (
          <>
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
          </>
        );

      case 'recent-conversations':
        return (
          <>
            <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
              <CardTitle className="text-xl font-bold text-gray-900">Conversas Recentes</CardTitle>
              <Button
                variant="ghost"
                className="text-sm text-gray-500 hover:text-gray-900 font-medium"
              >
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
          </>
        );

      case 'today-tasks':
        return (
          <>
            <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
              <CardTitle className="text-xl font-bold text-gray-900">Tarefas de Hoje</CardTitle>
              <Button
                variant="ghost"
                className="text-sm text-gray-500 hover:text-gray-900 font-medium"
              >
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
          </>
        );

      case 'conversion-rate':
        return (
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="p-3.5 rounded-2xl bg-green-600/10 transition-colors">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-emerald-600 bg-gray-50 px-2 py-1 rounded-lg">
                <ArrowUpRight className="h-4 w-4" />
                +3%
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-500">Taxa de Conversão</h3>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">67%</p>
            </div>
          </div>
        );

      case 'response-time':
        return (
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="p-3.5 rounded-2xl bg-cyan-600/10 transition-colors">
                <Clock className="h-6 w-6 text-cyan-600" />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-emerald-600 bg-gray-50 px-2 py-1 rounded-lg">
                <ArrowDownRight className="h-4 w-4" />
                -15%
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-500">Tempo de Resposta</h3>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">2.3min</p>
            </div>
          </div>
        );

      case 'top-contacts':
        return (
          <>
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-bold text-gray-900">Top Contatos</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="space-y-3">
                {['João Silva', 'Maria Santos', 'Pedro Costa'].map((name, i) => (
                  <div
                    key={name}
                    className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-100 to-pink-50 flex items-center justify-center text-pink-600 font-semibold">
                      {name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{name}</p>
                      <p className="text-sm text-gray-500">{(i + 1) * 15} interações</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </>
        );

      case 'achievements':
        return (
          <>
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-bold text-gray-900">Conquistas</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="space-y-3">
                {['Meta do Mês Atingida', 'Melhor Atendimento', 'Vendedor Destaque'].map(
                  (achievement) => (
                    <div
                      key={achievement}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-yellow-50 to-orange-50"
                    >
                      <div className="p-3 rounded-xl bg-yellow-100">
                        <Award className="h-6 w-6 text-yellow-600" />
                      </div>
                      <p className="font-bold text-gray-900">{achievement}</p>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </>
        );

      case 'pipeline-stats':
        return (
          <>
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-bold text-gray-900">Leads por Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              {pipelineStats.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-gray-400 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
                  Nenhum pipeline configurado
                </div>
              ) : (
                <div className="space-y-6">
                  {pipelineStats.map((pipeline) => (
                    <div key={pipeline.id} className="space-y-3">
                      <h4 className="font-bold text-gray-900 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-indigo-600" />
                        {pipeline.name}
                      </h4>
                      <div className="space-y-2">
                        {pipeline.stages?.map((stage: any) => (
                          <div
                            key={stage.id}
                            className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: stage.color || '#6366f1' }}
                              />
                              <span className="text-sm font-medium text-gray-700">
                                {stage.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-gray-900">{stage.count}</span>
                              <span className="text-xs text-gray-500">leads</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Total do pipeline */}
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50">
                          <span className="text-sm font-bold text-indigo-900">Total</span>
                          <span className="text-lg font-bold text-indigo-600">
                            {pipeline.stages?.reduce((sum: number, s: any) => sum + s.count, 0) || 0}{' '}
                            leads
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div className="flex h-full overflow-hidden">
        {/* Main Content */}
        <div className={cn('flex-1 overflow-y-auto transition-all', showSidebar && 'mr-96')}>
          <div className="space-y-8 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-2 text-lg">
                  Visão geral das suas métricas e atividades
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="rounded-xl h-11 px-6 border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Últimos 7 dias
                </Button>
                <Button
                  onClick={toggleCustomization}
                  className={cn(
                    'rounded-xl h-11 px-6 shadow-lg transition-all',
                    isCustomizing
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30'
                      : 'bg-black hover:bg-gray-800 text-white shadow-black/20'
                  )}
                >
                  <Settings2 className="h-5 w-5 mr-2" />
                  {isCustomizing ? 'Concluir' : 'Personalizar'}
                </Button>
              </div>
            </div>

            {/* Customization mode indicator */}
            {isCustomizing && (
              <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Settings2 className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Modo de Personalização Ativo</p>
                    <p className="text-sm text-gray-600">
                      Arraste os widgets para reorganizar ou clique no X para remover. Use o painel
                      lateral para adicionar novos widgets.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Widgets Grid with Drag and Drop */}
            <DndContext
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={activeWidgets} strategy={rectSortingStrategy}>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 auto-rows-min">
                  {activeWidgets.map((widgetId) => (
                    <DashboardWidget
                      key={widgetId}
                      id={widgetId}
                      title={widgetId}
                      isDragging={draggedId === widgetId}
                      isCustomizing={isCustomizing}
                      onRemove={isCustomizing ? () => handleRemoveWidget(widgetId) : undefined}
                      className={cn(
                        // Metrics - single column
                        ['conversations', 'revenue', 'deals', 'tasks', 'conversion-rate', 'response-time'].includes(
                          widgetId
                        ) && 'md:col-span-1',
                        // Charts - full width
                        widgetId === 'revenue-chart' && 'md:col-span-2 lg:col-span-4',
                        // Lists - half width
                        ['recent-conversations', 'today-tasks', 'top-contacts', 'achievements', 'pipeline-stats'].includes(
                          widgetId
                        ) && 'md:col-span-2 lg:col-span-2'
                      )}
                    >
                      {renderWidgetContent(widgetId)}
                    </DashboardWidget>
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Empty State */}
            {activeWidgets.length === 0 && (
              <div className="flex flex-col items-center justify-center h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl border-2 border-dashed border-gray-200">
                <div className="p-6 bg-white rounded-2xl shadow-sm mb-4">
                  <BarChart3 className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum widget adicionado</h3>
                <p className="text-gray-500 mb-6 max-w-md text-center">
                  Clique em "Personalizar" para adicionar widgets ao seu dashboard
                </p>
                <Button
                  onClick={toggleCustomization}
                  className="rounded-xl h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30"
                >
                  <Settings2 className="h-5 w-5 mr-2" />
                  Começar a Personalizar
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Widgets Panel */}
        {showSidebar && (
          <div className="fixed right-0 top-0 h-screen w-96 z-50 bg-white shadow-2xl border-l border-gray-200 animate-in slide-in-from-right duration-300">
            <WidgetsSidebar
              activeWidgets={activeWidgets}
              onAddWidget={handleAddWidget}
              onClose={toggleCustomization}
            />
          </div>
        )}
      </div>
    </MainLayout>
  );
}
