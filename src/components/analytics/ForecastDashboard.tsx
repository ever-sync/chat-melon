import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Target, AlertCircle, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface ForecastDashboardProps {
  data: {
    realized: number;
    goal: number;
    forecastConservative: number;
    forecastRealistic: number;
    forecastOptimistic: number;
    stageBreakdown: Array<{
      stage: string;
      totalValue: number;
      probability: number;
      forecastValue: number;
      color: string;
    }>;
    salesRepBreakdown: Array<{
      name: string;
      forecast: number;
      goalProgress: number;
    }>;
    alerts: string[];
    accuracy?: {
      previousForecast: number;
      previousRealized: number;
      accuracyPercent: number;
    };
  };
}

export const ForecastDashboard = ({ data }: ForecastDashboardProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${Math.round(value)}%`;
  };

  const realizedPercent = data.goal > 0 ? (data.realized / data.goal) * 100 : 0;
  const forecastRealisticPercent = data.goal > 0 ? (data.forecastRealistic / data.goal) * 100 : 0;

  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header com mês */}
      <div className="flex items-center gap-2">
        <TrendingUp className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">
          Previsão de Vendas - {currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)}
        </h2>
      </div>

      {/* Cenários de Forecast */}
      <Tabs defaultValue="realistic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="conservative">Conservador</TabsTrigger>
          <TabsTrigger value="realistic">Realista</TabsTrigger>
          <TabsTrigger value="optimistic">Otimista</TabsTrigger>
        </TabsList>

        <TabsContent value="conservative" className="space-y-4">
          <ForecastOverview
            realized={data.realized}
            goal={data.goal}
            forecast={data.forecastConservative}
            scenario="conservador"
            scenarioDescription="Apenas deals com prob. > 75%"
            formatCurrency={formatCurrency}
            formatPercent={formatPercent}
          />
        </TabsContent>

        <TabsContent value="realistic" className="space-y-4">
          <ForecastOverview
            realized={data.realized}
            goal={data.goal}
            forecast={data.forecastRealistic}
            scenario="realista"
            scenarioDescription="Ponderado por probabilidade"
            formatCurrency={formatCurrency}
            formatPercent={formatPercent}
          />
        </TabsContent>

        <TabsContent value="optimistic" className="space-y-4">
          <ForecastOverview
            realized={data.realized}
            goal={data.goal}
            forecast={data.forecastOptimistic}
            scenario="otimista"
            scenarioDescription="Todos os deals abertos"
            formatCurrency={formatCurrency}
            formatPercent={formatPercent}
          />
        </TabsContent>
      </Tabs>

      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Realizado</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.realized)}</div>
            <Progress value={realizedPercent} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {formatPercent(realizedPercent)} da meta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.goal)}</div>
            <Progress value={100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Objetivo do mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Previsto (Realista)</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.forecastRealistic)}</div>
            <Progress value={forecastRealisticPercent} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {formatPercent(forecastRealisticPercent)} da meta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline por Probabilidade */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline por Probabilidade</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="text-right">Prob.</TableHead>
                <TableHead className="text-right">Previsto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.stageBreakdown.map((stage) => (
                <TableRow key={stage.stage}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      {stage.stage}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(stage.totalValue)}</TableCell>
                  <TableCell className="text-right">{stage.probability}%</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(stage.forecastValue)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold border-t-2">
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(data.stageBreakdown.reduce((sum, s) => sum + s.totalValue, 0))}
                </TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right">
                  {formatCurrency(data.stageBreakdown.reduce((sum, s) => sum + s.forecastValue, 0))}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Forecast por Vendedor */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Users className="h-5 w-5" />
          <CardTitle>Forecast por Vendedor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.salesRepBreakdown.map((rep) => (
            <div key={rep.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{rep.name}</span>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(rep.forecast)} ({formatPercent(rep.goalProgress)})
                </div>
              </div>
              <Progress value={rep.goalProgress} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Acurácia Histórica */}
      {data.accuracy && (
        <Card>
          <CardHeader>
            <CardTitle>Acurácia Histórica</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Mês passado previmos{' '}
              <span className="font-bold">{formatCurrency(data.accuracy.previousForecast)}</span>,
              realizamos{' '}
              <span className="font-bold">{formatCurrency(data.accuracy.previousRealized)}</span> (
              <span
                className={
                  data.accuracy.accuracyPercent >= 90
                    ? 'text-green-600 font-bold'
                    : data.accuracy.accuracyPercent >= 70
                      ? 'text-yellow-600 font-bold'
                      : 'text-red-600 font-bold'
                }
              >
                {formatPercent(data.accuracy.accuracyPercent)} acurácia
              </span>
              )
            </p>
          </CardContent>
        </Card>
      )}

      {/* Alertas */}
      {data.alerts.length > 0 && (
        <Card className="border-yellow-600/50">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <CardTitle>Alertas e Sugestões</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.alerts.map((alert, index) => (
              <div key={index} className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">
                  {index + 1}
                </Badge>
                <p className="text-sm">{alert}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Componente auxiliar para exibir overview do forecast
const ForecastOverview = ({
  realized,
  goal,
  forecast,
  scenario,
  scenarioDescription,
  formatCurrency,
  formatPercent,
}: {
  realized: number;
  goal: number;
  forecast: number;
  scenario: string;
  scenarioDescription: string;
  formatCurrency: (n: number) => string;
  formatPercent: (n: number) => string;
}) => {
  const realizedPercent = goal > 0 ? (realized / goal) * 100 : 0;
  const forecastPercent = goal > 0 ? (forecast / goal) * 100 : 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline" className="capitalize">
            Cenário {scenario}
          </Badge>
          <span className="text-sm text-muted-foreground">{scenarioDescription}</span>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Realizado</p>
            <p className="text-2xl font-bold">{formatCurrency(realized)}</p>
            <Progress value={realizedPercent} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {formatPercent(realizedPercent)} da meta
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Meta</p>
            <p className="text-2xl font-bold">{formatCurrency(goal)}</p>
            <Progress value={100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Objetivo do mês</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Previsto</p>
            <p className="text-2xl font-bold">{formatCurrency(forecast)}</p>
            <Progress value={forecastPercent} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {formatPercent(forecastPercent)} da meta
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
