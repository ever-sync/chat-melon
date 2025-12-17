import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  Target,
  TrendingUp,
  Clock,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  User,
} from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { usePipelines } from '@/hooks/crm/usePipelines';
import { useAuth } from '@/hooks/useAuth';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Reports() {
  const { user } = useAuth();
  const { pipelines } = usePipelines();
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | undefined>(undefined);
  const { metrics, revenueData, funnelData, rankingData, forecastData, isLoading } = useAnalytics(
    6,
    selectedPipelineId
  );
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100">
          <p className="text-sm font-medium text-gray-900 mb-1">{label}</p>
          <p className="text-sm font-bold text-emerald-600">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <MainLayout>
      <div className="space-y-8 p-2">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900">
                {greeting}, {user?.user_metadata?.full_name?.split(' ')[0] || 'Gestor'} 👋
              </h1>
            </div>
            <p className="text-gray-500 text-lg">Aqui está o panorama da sua operação hoje</p>
          </div>

          <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
            {['Hoje', '7 Dias', '30 Dias', '60 Dias'].map((period) => (
              <button
                key={period}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  period === '30 Dias'
                    ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Revenue Card */}
          <Card className="border-0 shadow-sm hover:shadow-xl transition-all duration-300 rounded-[24px] overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Receita Total</p>
                  <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
                    {formatCurrency(metrics?.totalRevenue || 0)}
                  </h3>
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                  <ArrowUpRight className="h-4 w-4" />
                  +12.5%
                </span>
                <span className="text-gray-400">vs. mês anterior</span>
              </div>
              <div className="h-16 mt-4 -mx-6 -mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData || []}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#10B981"
                      strokeWidth={2}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Deals Card */}
          <Card className="border-0 shadow-sm hover:shadow-xl transition-all duration-300 rounded-[24px] overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Negócios Abertos</p>
                  <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
                    {metrics?.openDeals || 0}
                  </h3>
                </div>
                <div className="p-3 bg-blue-50 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="flex items-center gap-1 text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-lg">
                  <ArrowUpRight className="h-4 w-4" />
                  +5.2%
                </span>
                <span className="text-gray-400">novos leads</span>
              </div>
              <div className="h-16 mt-4 -mx-6 -mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData?.slice(0, 7) || []}>
                    <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} fillOpacity={0.2} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Conversion Card */}
          <Card className="border-0 shadow-sm hover:shadow-xl transition-all duration-300 rounded-[24px] overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Conversão</p>
                  <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
                    {metrics?.conversionRate || 0}%
                  </h3>
                </div>
                <div className="p-3 bg-violet-50 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-6 w-6 text-violet-600" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="flex items-center gap-1 text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded-lg">
                  <ArrowDownRight className="h-4 w-4" />
                  -2.1%
                </span>
                <span className="text-gray-400">taxa média</span>
              </div>
              <div className="h-16 mt-4 -mx-6 -mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData || []}>
                    <defs>
                      <linearGradient id="colorConversion" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      fill="url(#colorConversion)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Pipeline Time Card */}
          <Card className="border-0 shadow-sm hover:shadow-xl transition-all duration-300 rounded-[24px] overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Ciclo de Venda</p>
                  <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
                    {metrics?.avgPipelineTime || 0}{' '}
                    <span className="text-lg text-gray-400 font-normal">dias</span>
                  </h3>
                </div>
                <div className="p-3 bg-orange-50 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                  <ArrowDownRight className="h-4 w-4" />
                  -3 dias
                </span>
                <span className="text-gray-400">mais rápido</span>
              </div>
              <div className="h-16 mt-4 -mx-6 -mb-6 flex items-end justify-between px-6 pb-4">
                {[40, 35, 55, 45, 30, 45, 35].map((h, i) => (
                  <div
                    key={i}
                    className="w-2 bg-orange-100 rounded-full"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-8">
            {/* Main Revenue Chart */}
            <Card className="border-0 shadow-sm rounded-[32px] overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between p-8 pb-2">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    Análise de Receita
                  </CardTitle>
                  <p className="text-gray-500 mt-1">Comparativo mensal de performance</p>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                  <MoreHorizontal className="h-5 w-5 text-gray-500" />
                </Button>
              </CardHeader>
              <CardContent className="p-8 pt-4">
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={revenueData || []}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorRevenueMain" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        tickFormatter={(value) => `R$ ${value / 1000}k`}
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ stroke: '#10B981', strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#10B981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRevenueMain)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Pipeline Select & Tabs */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Relatórios Detalhados</h2>
              <Select
                value={selectedPipelineId || 'all'}
                onValueChange={(value) =>
                  setSelectedPipelineId(value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger className="w-[200px] rounded-xl border-gray-200">
                  <SelectValue placeholder="Todos os pipelines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Pipelines</SelectItem>
                  {pipelines.map((pipeline) => (
                    <SelectItem key={pipeline.id} value={pipeline.id}>
                      {pipeline.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-white p-1 rounded-2xl border border-gray-100 shadow-sm w-full justify-start overflow-x-auto">
                <TabsTrigger
                  value="overview"
                  className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white"
                >
                  Visão Geral
                </TabsTrigger>
                <TabsTrigger
                  value="funnel"
                  className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white"
                >
                  Funil
                </TabsTrigger>
                <TabsTrigger
                  value="ranking"
                  className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white"
                >
                  Ranking
                </TabsTrigger>
                <TabsTrigger
                  value="forecast"
                  className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white"
                >
                  Previsão
                </TabsTrigger>
              </TabsList>
              {/* Tabs Content would go here - simplified for this view */}
            </Tabs>
          </div>

          {/* Right Column - Dark Card & Stats */}
          <div className="space-y-8">
            {/* Dark Card - Top Performers */}
            <Card className="border-0 shadow-2xl bg-[#111111] text-white rounded-[32px] overflow-hidden relative">
              <div className="absolute top-0 right-0 p-32 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

              <CardHeader className="p-8 pb-4 relative z-10">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-bold">Top Performers</CardTitle>
                  <div className="p-2 bg-white/5 rounded-xl hover:bg-white/10 cursor-pointer transition-colors">
                    <MoreHorizontal className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <p className="text-gray-400 text-sm mt-1">Ranking de vendas do mês</p>
              </CardHeader>

              <CardContent className="p-8 pt-2 relative z-10">
                <div className="space-y-6">
                  {rankingData?.slice(0, 4).map((agent, index) => (
                    <div key={index} className="flex items-center gap-4 group cursor-pointer">
                      <div className="relative">
                        <Avatar className="h-12 w-12 border-2 border-[#111111] ring-2 ring-emerald-500/20 group-hover:ring-emerald-500 transition-all">
                          <AvatarFallback className="bg-gradient-to-br from-gray-800 to-gray-900 text-white font-bold">
                            {agent.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-[10px] font-bold text-black px-1.5 py-0.5 rounded-full border-2 border-[#111111]">
                          #{index + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                          {agent.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {agent.dealsCount} negócios fechados
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-400">
                          {formatCurrency(agent.totalValue)}
                        </p>
                      </div>
                    </div>
                  ))}

                  {(!rankingData || rankingData.length === 0) && (
                    <div className="text-center py-8 text-gray-500">Nenhum dado disponível</div>
                  )}
                </div>

                <Button className="w-full mt-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-12 font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]">
                  Ver Ranking Completo
                </Button>
              </CardContent>
            </Card>

            {/* Satisfaction / Donut Chart */}
            <Card className="border-0 shadow-sm rounded-[32px] overflow-hidden bg-white">
              <CardHeader className="p-8 pb-2">
                <CardTitle className="text-xl font-bold text-gray-900">Satisfação (CSAT)</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-4">
                <div className="h-[250px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Promotores', value: 65, color: '#10B981' },
                          { name: 'Neutros', value: 25, color: '#F59E0B' },
                          { name: 'Detratores', value: 10, color: '#EF4444' },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        cornerRadius={10}
                      >
                        {[
                          { name: 'Promotores', value: 65, color: '#10B981' },
                          { name: 'Neutros', value: 25, color: '#F59E0B' },
                          { name: 'Detratores', value: 10, color: '#EF4444' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-gray-900">4.8</span>
                    <span className="text-sm text-gray-500">de 5.0</span>
                  </div>
                </div>
                <div className="flex justify-center gap-4 mt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    Promotores
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    Neutros
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
