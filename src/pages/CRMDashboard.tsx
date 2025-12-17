import { usePipelines } from '@/hooks/crm/usePipelines';
import { useDealStats } from '@/hooks/crm/useDealStats';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Users,
  BarChart3,
  PieChart as PieIcon,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';

export default function CRMDashboard() {
  const { pipelines, defaultPipeline } = usePipelines();
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | undefined>(
    defaultPipeline?.id
  );

  // Use default pipeline if none selected
  const activePipelineId = selectedPipelineId || defaultPipeline?.id;
  const { pipelineStats, funnelAnalysis, isLoading, formatCurrency, formatPercentage } =
    useDealStats(activePipelineId);

  const statsCards = [
    {
      title: 'Valor em Aberto',
      value: pipelineStats ? formatCurrency(pipelineStats.total_value) : '-',
      description: `${pipelineStats?.total_deals || 0} negócios ativos`,
      icon: DollarSign,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      trend: 'neutral',
    },
    {
      title: 'Vendas Ganhas',
      value: pipelineStats ? formatCurrency(pipelineStats.won_value) : '-',
      description: `${pipelineStats?.won_deals || 0} negócios fechados`,
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
      trend: 'up',
    },
    {
      title: 'Taxa de Conversão',
      value: pipelineStats ? formatPercentage(pipelineStats.conversion_rate) : '-',
      description: 'Média do pipeline',
      icon: Activity,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      trend: (pipelineStats?.conversion_rate || 0) > 20 ? 'up' : 'down',
    },
    {
      title: 'Ticket Médio',
      value: pipelineStats ? formatCurrency(pipelineStats.average_deal_value) : '-',
      description: 'Por negócio ativo',
      icon: Target,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      trend: 'neutral',
    },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[400px] w-full rounded-xl" />
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Dashboard de Vendas
            </h1>
            <p className="text-gray-500 mt-1">
              Visão geral do desempenho do seu pipeline comercial
            </p>
          </div>

          <Select value={activePipelineId} onValueChange={setSelectedPipelineId}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Selecione um pipeline" />
            </SelectTrigger>
            <SelectContent>
              {pipelines.map((pipeline) => (
                <SelectItem key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, i) => (
            <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  {stat.trend === 'up' && (
                    <div className="flex items-center text-green-600 text-sm font-medium bg-green-50 px-2 py-1 rounded-full">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      Bom
                    </div>
                  )}
                  {stat.trend === 'down' && (
                    <div className="flex items-center text-red-600 text-sm font-medium bg-red-50 px-2 py-1 rounded-full">
                      <ArrowDownRight className="w-3 h-3 mr-1" />
                      Baixo
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
                  <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Funnel Chart */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Funil de Vendas
              </CardTitle>
              <CardDescription>Quantidade e valor por etapa do pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={funnelAnalysis}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis
                      dataKey="stage_name"
                      type="category"
                      width={100}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value: any, name: string) => {
                        if (name === 'Valor Total') return formatCurrency(value);
                        return value;
                      }}
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Bar
                      dataKey="total_value"
                      name="Valor Total"
                      fill="#6366f1"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Distribution Chart */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-purple-600" />
                Distribuição de Volume
              </CardTitle>
              <CardDescription>Número de negócios por etapa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={funnelAnalysis}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="deal_count"
                      nameKey="stage_name"
                    >
                      {funnelAnalysis?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => `${value} negócios`}
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {funnelAnalysis?.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-gray-500">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="truncate flex-1">{entry.stage_name}</span>
                    <span className="font-medium">{entry.deal_count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <p className="text-indigo-100 font-medium mb-1">Tempo Médio de Fechamento</p>
                <h3 className="text-3xl font-bold">
                  {pipelineStats?.average_time_to_close || 0} dias
                </h3>
              </div>
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-xs text-indigo-100">
                  Média desde a criação até o ganho do negócio.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm col-span-2">
            <CardHeader>
              <CardTitle>Desempenho Geral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Total Negócios</p>
                  <p className="text-xl font-bold mt-1">{pipelineStats?.total_deals}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-xs text-green-600 uppercase tracking-wide">Ganhos</p>
                  <p className="text-xl font-bold text-green-700 mt-1">
                    {pipelineStats?.won_deals}
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <p className="text-xs text-red-600 uppercase tracking-wide">Perdidos</p>
                  <p className="text-xl font-bold text-red-700 mt-1">{pipelineStats?.lost_deals}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-xs text-blue-600 uppercase tracking-wide">Conversão</p>
                  <p className="text-xl font-bold text-blue-700 mt-1">
                    {pipelineStats?.conversion_rate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
