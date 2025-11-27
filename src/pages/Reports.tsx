import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Target, TrendingUp, Clock } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { usePipelines } from "@/hooks/usePipelines";
import { RevenueChart } from "@/components/analytics/RevenueChart";
import { ConversionFunnel } from "@/components/analytics/ConversionFunnel";
import { LeaderboardCard } from "@/components/analytics/LeaderboardCard";
import { SatisfactionDashboard } from "@/components/analytics/SatisfactionDashboard";
import { ForecastDashboard } from "@/components/analytics/ForecastDashboard";
import { ExecutiveDashboard } from "@/components/analytics/ExecutiveDashboard";
import { ActivityReport } from "@/components/analytics/ActivityReport";
import { InsightsDashboard } from "@/components/analytics/InsightsDashboard";
import TeamPerformancePage from "./reports/TeamPerformancePage";
import { Skeleton } from "@/components/ui/skeleton";

export default function Reports() {
  const { pipelines, defaultPipeline } = usePipelines();
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | undefined>(undefined);
  const { metrics, revenueData, funnelData, rankingData, forecastData, isLoading } = useAnalytics(6, selectedPipelineId);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              Dashboard com métricas e análises do seu negócio
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              Dashboard com métricas e análises do seu negócio
            </p>
          </div>

          <Select
            value={selectedPipelineId || "all"}
            onValueChange={(value) => setSelectedPipelineId(value === "all" ? undefined : value)}
          >
            <SelectTrigger className="w-[250px]">
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

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="executive">Executivo</TabsTrigger>
            <TabsTrigger value="team">Equipe</TabsTrigger>
            <TabsTrigger value="activities">Atividades</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
            <TabsTrigger value="funnel">Funil</TabsTrigger>
            <TabsTrigger value="ranking">Ranking</TabsTrigger>
            <TabsTrigger value="satisfaction">CSAT/NPS</TabsTrigger>
            <TabsTrigger value="insights" className="gap-2">
              <span>💡</span>
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Cards de Métricas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Receita Total
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(metrics?.totalRevenue || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {metrics?.wonDealsCount || 0} negócios fechados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Negócios em Aberto
                  </CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.openDeals || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Aguardando fechamento
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Taxa de Conversão
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.conversionRate || 0}%</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics?.wonDealsCount}/{metrics?.totalDealsCount} negócios
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Tempo Médio no Pipeline
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.avgPipelineTime || 0} dias</div>
                  <p className="text-xs text-muted-foreground">
                    Da criação ao fechamento
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Receita */}
            {revenueData && revenueData.length > 0 && (
              <RevenueChart data={revenueData} />
            )}

            {/* Funil de Conversão */}
            {funnelData && funnelData.length > 0 && (
              <ConversionFunnel data={funnelData} />
            )}
          </TabsContent>

          <TabsContent value="executive" className="space-y-4">
            <ExecutiveDashboard />
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <TeamPerformancePage />
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <ActivityReport />
          </TabsContent>

          <TabsContent value="forecast" className="space-y-4">
            {forecastData ? (
              <ForecastDashboard data={forecastData} />
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Nenhum dado disponível para previsão de vendas
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="funnel" className="space-y-4">
            {funnelData && funnelData.length > 0 ? (
              <ConversionFunnel data={funnelData} />
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Nenhum dado disponível para o funil de conversão
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="ranking" className="space-y-4">
            {rankingData && rankingData.length > 0 ? (
              <LeaderboardCard data={rankingData} />
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Nenhum vendedor com negócios fechados ainda
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="satisfaction" className="space-y-4">
            <SatisfactionDashboard />
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <InsightsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
