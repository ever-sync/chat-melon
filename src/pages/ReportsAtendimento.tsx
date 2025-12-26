import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  Users,
  Clock,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
  Target,
  Award,
  AlertCircle,
  Calendar,
  Filter,
  Download,
  Star,
  Zap,
  Phone,
  Mail,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ReportsAtendimento() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('today');

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Relatórios de Atendimento</h1>
            <p className="text-gray-500 mt-2">
              Análise completa de performance e métricas de atendimento
            </p>
          </div>

          <div className="flex gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="today">Hoje</option>
              <option value="yesterday">Ontem</option>
              <option value="week">Esta Semana</option>
              <option value="month">Este Mês</option>
              <option value="custom">Período Personalizado</option>
            </select>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Report Type Selection */}
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 w-fit">
          <button
            onClick={() => navigate('/reports')}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              location.pathname === '/reports'
                ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            Vendas
          </button>
          <button
            onClick={() => navigate('/reports/atendimento')}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              location.pathname === '/reports/atendimento'
                ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            Atendimento
          </button>
        </div>

        {/* KPIs principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total de Conversas */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Conversas</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">1,234</p>
                  <p className="text-sm text-green-600 mt-1">+12% vs. ontem</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tempo Médio de Resposta */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tempo Médio Resposta</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">2m 34s</p>
                  <p className="text-sm text-green-600 mt-1">-8% vs. ontem</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Taxa de Resolução */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taxa de Resolução</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">94.2%</p>
                  <p className="text-sm text-green-600 mt-1">+2.1% vs. ontem</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Satisfação Média */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Satisfação (CSAT)</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">4.7/5</p>
                  <p className="text-sm text-green-600 mt-1">+0.2 vs. ontem</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Star className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Relatórios */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="agents">Atendentes</TabsTrigger>
            <TabsTrigger value="channels">Canais</TabsTrigger>
            <TabsTrigger value="sla">SLA</TabsTrigger>
            <TabsTrigger value="satisfaction">Satisfação</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Volume de Atendimento */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                    Volume de Atendimento
                  </CardTitle>
                  <CardDescription>Conversas por período</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Gráfico de Linha - Volume ao longo do tempo</p>
                  </div>
                </CardContent>
              </Card>

              {/* Distribuição por Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-indigo-600" />
                    Status das Conversas
                  </CardTitle>
                  <CardDescription>Distribuição atual</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Ativas</span>
                      <span className="text-sm font-bold text-green-600">156 (45%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Em Espera</span>
                      <span className="text-sm font-bold text-amber-600">42 (12%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-amber-600 h-2 rounded-full" style={{ width: '12%' }}></div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Resolvidas</span>
                      <span className="text-sm font-bold text-blue-600">890 (72%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '72%' }}></div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Chatbot</span>
                      <span className="text-sm font-bold text-purple-600">146 (12%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '12%' }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Horários de Pico */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                    Horários de Pico
                  </CardTitle>
                  <CardDescription>Volume por hora do dia</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Heatmap - Volume por hora/dia</p>
                  </div>
                </CardContent>
              </Card>

              {/* Métricas de Mensagens */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-indigo-600" />
                    Mensagens
                  </CardTitle>
                  <CardDescription>Estatísticas de mensagens</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Total Enviadas</span>
                      <span className="text-lg font-bold text-gray-900">8,456</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Total Recebidas</span>
                      <span className="text-lg font-bold text-gray-900">12,234</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Taxa de Leitura</span>
                      <span className="text-lg font-bold text-green-600">98.2%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Áudios Transcritos</span>
                      <span className="text-lg font-bold text-purple-600">342</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Atendentes */}
          <TabsContent value="agents" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  Ranking de Atendentes
                </CardTitle>
                <CardDescription>Performance individual dos atendentes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'João Silva', conversations: 45, avgTime: '2m 15s', resolution: '96%', satisfaction: 4.9 },
                    { name: 'Maria Santos', conversations: 42, avgTime: '2m 30s', resolution: '94%', satisfaction: 4.8 },
                    { name: 'Pedro Costa', conversations: 38, avgTime: '2m 45s', resolution: '92%', satisfaction: 4.7 },
                    { name: 'Ana Oliveira', conversations: 35, avgTime: '3m 10s', resolution: '90%', satisfaction: 4.6 },
                  ].map((agent, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-indigo-600">#{index + 1}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{agent.name}</h4>
                            <p className="text-sm text-gray-500">{agent.conversations} conversas</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          <span className="font-bold text-gray-900">{agent.satisfaction}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xs text-gray-500">Tempo Médio</p>
                          <p className="font-semibold text-gray-900">{agent.avgTime}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Resolução</p>
                          <p className="font-semibold text-green-600">{agent.resolution}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Online</p>
                          <div className="flex items-center justify-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-gray-600">Ativo</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Canais */}
          <TabsContent value="channels" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-indigo-600" />
                    Volume por Canal
                  </CardTitle>
                  <CardDescription>Distribuição de conversas por canal</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'WhatsApp', count: 856, percentage: 69, color: 'bg-green-500', icon: MessageSquare },
                      { name: 'Instagram', count: 234, percentage: 19, color: 'bg-pink-500', icon: MessageSquare },
                      { name: 'Widget Web', count: 98, percentage: 8, color: 'bg-blue-500', icon: MessageSquare },
                      { name: 'Email', count: 46, percentage: 4, color: 'bg-purple-500', icon: Mail },
                    ].map((channel, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <channel.icon className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">{channel.name}</span>
                          </div>
                          <span className="text-sm font-bold text-gray-900">{channel.count} ({channel.percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className={`${channel.color} h-2 rounded-full`} style={{ width: `${channel.percentage}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-indigo-600" />
                    Performance por Canal
                  </CardTitle>
                  <CardDescription>Métricas de cada canal</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'WhatsApp', avgTime: '2m 20s', resolution: '95%', satisfaction: 4.8 },
                      { name: 'Instagram', avgTime: '3m 10s', resolution: '92%', satisfaction: 4.6 },
                      { name: 'Widget Web', avgTime: '1m 50s', resolution: '97%', satisfaction: 4.9 },
                      { name: 'Email', avgTime: '45m', resolution: '89%', satisfaction: 4.5 },
                    ].map((channel, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">{channel.name}</h4>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-gray-500">Tempo Médio</p>
                            <p className="font-medium">{channel.avgTime}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Resolução</p>
                            <p className="font-medium text-green-600">{channel.resolution}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Satisfação</p>
                            <p className="font-medium text-amber-600">{channel.satisfaction}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* SLA */}
          <TabsContent value="sla" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-indigo-600" />
                    SLA Primeira Resposta
                  </CardTitle>
                  <CardDescription>Cumprimento do SLA de primeira resposta</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-green-100">
                      <div>
                        <p className="text-4xl font-bold text-green-600">92%</p>
                        <p className="text-sm text-gray-600">Cumprido</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Dentro do SLA</span>
                      <span className="font-bold text-green-600">1,136</span>
                    </div>
                    <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Fora do SLA</span>
                      <span className="font-bold text-red-600">98</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Tempo Médio</span>
                      <span className="font-bold text-gray-900">2m 34s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                    SLA Resolução
                  </CardTitle>
                  <CardDescription>Cumprimento do SLA de resolução</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-green-100">
                      <div>
                        <p className="text-4xl font-bold text-green-600">88%</p>
                        <p className="text-sm text-gray-600">Cumprido</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Dentro do SLA</span>
                      <span className="font-bold text-green-600">1,086</span>
                    </div>
                    <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Fora do SLA</span>
                      <span className="font-bold text-red-600">148</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Tempo Médio</span>
                      <span className="font-bold text-gray-900">18m 45s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-indigo-600" />
                    Tendência de SLA
                  </CardTitle>
                  <CardDescription>Evolução do cumprimento de SLA ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Gráfico de Linha - Taxa de cumprimento SLA por dia</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Satisfação */}
          <TabsContent value="satisfaction" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-indigo-600" />
                    Distribuição de Avaliações
                  </CardTitle>
                  <CardDescription>Pesquisas de satisfação respondidas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { stars: 5, count: 456, percentage: 68 },
                      { stars: 4, count: 145, percentage: 22 },
                      { stars: 3, count: 42, percentage: 6 },
                      { stars: 2, count: 18, percentage: 3 },
                      { stars: 1, count: 9, percentage: 1 },
                    ].map((rating) => (
                      <div key={rating.stars}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[...Array(rating.stars)].map((_, i) => (
                                <Star key={i} className="h-4 w-4 text-amber-500 fill-amber-500" />
                              ))}
                            </div>
                            <span className="text-sm text-gray-600">{rating.stars} estrela{rating.stars > 1 ? 's' : ''}</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">{rating.count} ({rating.percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${rating.percentage}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Avaliação Média</span>
                      <span className="text-2xl font-bold text-amber-600">4.7 / 5.0</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">Baseado em 670 avaliações</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                    Tendência de Satisfação
                  </CardTitle>
                  <CardDescription>Evolução da satisfação ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Gráfico de Área - CSAT ao longo do tempo</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-indigo-600" />
                    Comentários Recentes
                  </CardTitle>
                  <CardDescription>Feedback dos clientes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { rating: 5, comment: 'Atendimento excelente! Muito rápido e eficiente.', agent: 'João Silva', date: 'Há 2 horas' },
                      { rating: 4, comment: 'Boa experiência, resolveram meu problema rapidamente.', agent: 'Maria Santos', date: 'Há 3 horas' },
                      { rating: 5, comment: 'Adorei o atendimento, muito atenciosos!', agent: 'Pedro Costa', date: 'Há 5 horas' },
                    ].map((feedback, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex gap-1">
                            {[...Array(feedback.rating)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 text-amber-500 fill-amber-500" />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">{feedback.date}</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{feedback.comment}</p>
                        <p className="text-xs text-gray-500">Atendido por: <span className="font-medium">{feedback.agent}</span></p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance */}
          <TabsContent value="performance" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Taxa de Retorno</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">8.2%</div>
                  <p className="text-sm text-gray-500 mt-1">Conversas que retornaram</p>
                  <div className="mt-4 flex items-center text-sm text-red-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +1.2% vs. período anterior
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Conversas IA</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">12%</div>
                  <p className="text-sm text-gray-500 mt-1">Resolvidas pelo chatbot</p>
                  <div className="mt-4 flex items-center text-sm text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +3.5% vs. período anterior
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Transferências</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">45</div>
                  <p className="text-sm text-gray-500 mt-1">Conversas transferidas</p>
                  <div className="mt-4 flex items-center text-sm text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1 rotate-180" />
                    -5 vs. período anterior
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-indigo-600" />
                  Comparativo de Performance
                </CardTitle>
                <CardDescription>Este período vs. período anterior</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Gráfico de Barras Comparativo</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
