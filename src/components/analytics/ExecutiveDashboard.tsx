import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, TrendingUp, DollarSign, Target, Clock, Calendar } from "lucide-react";
import { useExecutiveReport } from "@/hooks/useExecutiveReport";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip, LineChart, Line } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

type Period = 'current_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'last_12_months';

export const ExecutiveDashboard = () => {
  const [period, setPeriod] = useState<Period>('current_month');
  const { data: metrics, isLoading } = useExecutiveReport(period);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDays = (days: number) => {
    return `${Math.round(days)} dias`;
  };

  const formatMinutes = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  };

  const getChangeIndicator = (current: number, previous: number, inverse = false) => {
    if (previous === 0) return { icon: null, color: "", text: "" };
    
    const change = ((current - previous) / previous) * 100;
    const isPositive = inverse ? change < 0 : change > 0;
    
    return {
      icon: isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />,
      color: isPositive ? "text-green-600" : "text-red-600",
      text: `${Math.abs(change).toFixed(1)}%`
    };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!metrics) return null;

  const revenueChange = getChangeIndicator(metrics.revenue.current, metrics.revenue.previous);
  const firstResponseChange = getChangeIndicator(metrics.performance.avgFirstResponse, metrics.performance.avgFirstResponsePrevious, true);
  const closingTimeChange = getChangeIndicator(metrics.performance.avgClosingTime, metrics.performance.avgClosingTimePrevious, true);
  const ticketChange = getChangeIndicator(metrics.performance.avgTicket, metrics.performance.avgTicketPrevious);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Dashboard Executivo</h2>
          <p className="text-muted-foreground">Visão geral do desempenho do negócio</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">Este mês</SelectItem>
              <SelectItem value="last_month">Mês anterior</SelectItem>
              <SelectItem value="last_3_months">Últimos 3 meses</SelectItem>
              <SelectItem value="last_6_months">Últimos 6 meses</SelectItem>
              <SelectItem value="last_12_months">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Receita */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Receita
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{formatCurrency(metrics.revenue.current)}</span>
              <span className="text-muted-foreground">vs {formatCurrency(metrics.revenue.previous)} (período anterior)</span>
            </div>
            <div className={`flex items-center gap-2 ${revenueChange.color}`}>
              {revenueChange.icon}
              <span className="font-semibold">{revenueChange.text} {metrics.revenue.growth > 0 ? 'crescimento' : 'queda'}</span>
            </div>
            <ChartContainer config={{ value: { label: "Receita", color: "hsl(var(--primary))" } }} className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.revenueHistory}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v/1000}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Em aberto</p>
              <p className="text-2xl font-bold">{formatCurrency(metrics.pipeline.open)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Previsão</p>
              <p className="text-2xl font-bold">{formatCurrency(metrics.pipeline.forecast)}</p>
              <p className="text-sm text-muted-foreground">{((metrics.pipeline.forecast / metrics.pipeline.goal) * 100).toFixed(0)}% da meta</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Meta</p>
              <p className="text-2xl font-bold">{formatCurrency(metrics.pipeline.goal)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Funil e Performance lado a lado */}
      <div className="grid grid-cols-2 gap-6">
        {/* Funil de Conversão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Funil de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.conversion.map((stage, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{stage.stage}</span>
                    <span className="text-sm text-muted-foreground">{stage.count} ({stage.percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all" 
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tempo 1ª Resposta</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{formatMinutes(metrics.performance.avgFirstResponse)}</span>
                  <span className={`flex items-center gap-1 text-sm ${firstResponseChange.color}`}>
                    {firstResponseChange.icon}
                    {firstResponseChange.text}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Tempo Fechamento</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{formatDays(metrics.performance.avgClosingTime)}</span>
                  <span className={`flex items-center gap-1 text-sm ${closingTimeChange.color}`}>
                    {closingTimeChange.icon}
                    {closingTimeChange.text}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Ticket Médio</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{formatCurrency(metrics.performance.avgTicket)}</span>
                  <span className={`flex items-center gap-1 text-sm ${ticketChange.color}`}>
                    {ticketChange.icon}
                    {ticketChange.text}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Vendedores e Origem dos Leads */}
      <div className="grid grid-cols-2 gap-6">
        {/* Top Vendedores */}
        <Card>
          <CardHeader>
            <CardTitle>Top Vendedores</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ revenue: { label: "Receita", color: "hsl(var(--primary))" } }} className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.topSellers}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v/1000}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Origem dos Leads */}
        <Card>
          <CardHeader>
            <CardTitle>Origem dos Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={metrics.leadSources}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ source, percent }) => `${source}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {metrics.leadSources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
