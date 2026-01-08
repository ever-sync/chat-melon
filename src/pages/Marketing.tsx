import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, TrendingUp, Users, Mail, MessageSquare, BarChart3, Zap, Send, Bot, GitMerge, Store, Package, Truck } from 'lucide-react';

export default function Marketing() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();

  const marketingFeatures = [
    {
      icon: Target,
      title: 'Segmentação Avançada',
      description: 'Crie segmentos personalizados de clientes para campanhas direcionadas',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      icon: TrendingUp,
      title: 'Análise de Performance',
      description: 'Acompanhe métricas e ROI das suas campanhas de marketing',
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      icon: Users,
      title: 'Gestão de Leads',
      description: 'Capture e qualifique leads através de múltiplos canais',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      icon: Mail,
      title: 'Email Marketing',
      description: 'Crie e envie campanhas de email personalizadas',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      icon: MessageSquare,
      title: 'WhatsApp Marketing',
      description: 'Alcance seus clientes através do WhatsApp',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
    },
    {
      icon: BarChart3,
      title: 'Relatórios Detalhados',
      description: 'Visualize dados e insights sobre suas campanhas',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50',
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketing</h1>
          <p className="text-gray-500 mt-2">
            Ferramentas e recursos para suas campanhas de marketing
          </p>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="atrair">Atrair</TabsTrigger>
            <TabsTrigger value="converter">Converter</TabsTrigger>
            <TabsTrigger value="relacionar">Relacionar</TabsTrigger>
            <TabsTrigger value="vender">Vender</TabsTrigger>
            <TabsTrigger value="analisar">Analisar</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Nenhuma campanha em andamento</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Abertura</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0%</div>
                  <p className="text-xs text-muted-foreground">Média das últimas campanhas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversões</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Total de conversões este mês</p>
                </CardContent>
              </Card>
            </div>

            {/* Marketing Features */}
            <Card>
              <CardHeader>
                <CardTitle>Recursos de Marketing</CardTitle>
                <CardDescription>
                  Explore as ferramentas disponíveis para suas estratégias de marketing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {marketingFeatures.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div
                        key={index}
                        className="flex flex-col items-start p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        <div className={`p-3 rounded-lg ${feature.bgColor} mb-3`}>
                          <Icon className={`h-6 w-6 ${feature.color}`} />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                        <p className="text-sm text-gray-500">{feature.description}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Atrair Tab */}
          <TabsContent value="atrair" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Atrair</CardTitle>
                <CardDescription>
                  Ferramentas para atrair novos clientes e gerar leads
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Postagem em Mídias Sociais */}
                  <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left">
                    <MessageSquare className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">Postagem em Mídias Sociais</span>
                  </button>

                  {/* Lead Ads */}
                  <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left">
                    <Users className="h-5 w-5 text-purple-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">Lead Ads</span>
                  </button>

                  {/* Públicos para Anúncios */}
                  <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left">
                    <Target className="h-5 w-5 text-orange-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">Públicos para Anúncios</span>
                  </button>

                  {/* Otimização de Páginas (SEO) */}
                  <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left">
                    <TrendingUp className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">Otimização de Páginas (SEO)</span>
                  </button>

                  {/* Link da Bio */}
                  <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left">
                    <Mail className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">Link da Bio</span>
                  </button>

                  {/* Canais */}
                  <button
                    onClick={() => navigate('/channels')}
                    className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition-colors text-left"
                  >
                    <MessageSquare className="h-5 w-5 text-teal-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">Canais</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Converter Tab */}
          <TabsContent value="converter" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Converter</CardTitle>
                <CardDescription>
                  Estratégias para converter leads em clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Landing Pages */}
                  <button
                    onClick={() => navigate('/marketing/landing-pages')}
                    className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left relative"
                  >
                    <Target className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">Landing Pages</span>
                    <span className="ml-auto px-2 py-0.5 text-xs font-semibold text-purple-600 bg-purple-50 rounded flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      IA
                    </span>
                  </button>

                  {/* Formulários */}
                  <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left">
                    <Mail className="h-5 w-5 text-purple-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">Formulários</span>
                  </button>

                  {/* Pop-ups */}
                  <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left">
                    <MessageSquare className="h-5 w-5 text-orange-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">Pop-ups</span>
                  </button>

                  {/* Campos Personalizados */}
                  <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left">
                    <Users className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">Campos Personalizados</span>
                  </button>

                  {/* Botões de WhatsApp */}
                  <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left">
                    <MessageSquare className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">Botões de WhatsApp</span>
                  </button>

                  {/* Web Push */}
                  <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left relative">
                    <BarChart3 className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">Web Push</span>
                    <span className="ml-auto px-2 py-0.5 text-xs font-semibold text-teal-600 bg-teal-50 rounded">
                      NOVO
                    </span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relacionar Tab */}
          <TabsContent value="relacionar" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Relacionar</CardTitle>
                <CardDescription>
                  Ferramentas para relacionamento e engajamento com clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Links de Pagamento */}
                  <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left">
                    <Target className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">Links de Pagamento</span>
                  </button>

                  {/* Base de Leads */}
                  <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left">
                    <Users className="h-5 w-5 text-purple-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">Base de Leads</span>
                  </button>

                  {/* Lead Scoring (Pro) */}
                  <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left">
                    <TrendingUp className="h-5 w-5 text-orange-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">Lead Scoring (Pro)</span>
                  </button>

                  {/* Lista Inteligente de Leads */}
                  <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left">
                    <Users className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">Lista Inteligente de Leads</span>
                    <span className="ml-auto px-2 py-0.5 text-xs font-semibold text-teal-600 bg-teal-50 rounded">
                      NOVO
                    </span>
                  </button>

                  {/* Lead Tracking (Pro) */}
                  <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left">
                    <Target className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">Lead Tracking (Pro)</span>
                  </button>

                  {/* Segmentação de Leads */}
                  <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left">
                    <Users className="h-5 w-5 text-pink-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">Segmentação de Leads</span>
                  </button>

                  {/* Email */}
                  <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left">
                    <Mail className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">Email</span>
                  </button>

                  {/* Mensagem de WhatsApp */}
                  <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left">
                    <MessageSquare className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">Mensagem de WhatsApp</span>
                  </button>

                  {/* Mensagem de SMS */}
                  <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left">
                    <MessageSquare className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">Mensagem de SMS</span>
                    <span className="ml-auto px-2 py-0.5 text-xs font-semibold text-teal-600 bg-teal-50 rounded">
                      NOVO
                    </span>
                  </button>

                  {/* Campanhas */}
                  <button
                    onClick={() => navigate('/campaigns')}
                    className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left"
                  >
                    <Send className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">Campanhas</span>
                  </button>

                  {/* Automações */}
                  <button
                    onClick={() => navigate('/automation')}
                    className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-colors text-left"
                  >
                    <Zap className="h-5 w-5 text-violet-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">Automações</span>
                  </button>

                  {/* Chatbots */}
                  <button
                    onClick={() => navigate('/chatbots')}
                    className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-cyan-300 hover:bg-cyan-50 transition-colors text-left"
                  >
                    <Bot className="h-5 w-5 text-cyan-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">Chatbots</span>
                  </button>

                  {/* Cadences */}
                  <button
                    onClick={() => navigate('/cadences')}
                    className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors text-left"
                  >
                    <GitMerge className="h-5 w-5 text-orange-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">Cadences</span>
                  </button>

                  {/* Integrações */}
                  <button
                    onClick={() => navigate('/integrations')}
                    className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-colors text-left"
                  >
                    <Zap className="h-5 w-5 text-amber-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">Integrações</span>
                    <span className="ml-auto px-2 py-0.5 text-xs font-semibold text-amber-600 bg-amber-100 rounded">
                      SOON
                    </span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vender Tab */}
          <TabsContent value="vender" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Vender</CardTitle>
                <CardDescription>
                  Gerencie sua loja, produtos e pedidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Minha Loja */}
                  <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left">
                    <Store className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">Minha Loja</span>
                  </button>

                  {/* Pedidos */}
                  <button
                    onClick={() => navigate('/orders')}
                    className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors text-left"
                  >
                    <Package className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">Pedidos</span>
                  </button>

                  {/* Produtos */}
                  <button
                    onClick={() => navigate('/products')}
                    className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors text-left"
                  >
                    <Package className="h-5 w-5 text-purple-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">Produtos</span>
                  </button>

                  {/* Entregas */}
                  <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left">
                    <Truck className="h-5 w-5 text-orange-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">Entregas</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analisar Tab */}
          <TabsContent value="analisar" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Analisar</CardTitle>
                <CardDescription>
                  Métricas e análises das suas campanhas de marketing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Análise de Canais */}
                    <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left">
                      <BarChart3 className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      <span className="font-medium text-gray-900">Análise de Canais</span>
                    </button>

                    {/* Análise de Marketing e Vendas */}
                    <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left">
                      <TrendingUp className="h-5 w-5 text-purple-500 flex-shrink-0" />
                      <span className="font-medium text-gray-900">Análise de Marketing e Vendas</span>
                    </button>

                    {/* Análise de Anúncios */}
                    <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left">
                      <Target className="h-5 w-5 text-orange-500 flex-shrink-0" />
                      <span className="font-medium text-gray-900">Análise de Anúncios</span>
                      <span className="ml-auto px-2 py-0.5 text-xs font-semibold text-teal-600 bg-teal-50 rounded">
                        NOVO
                      </span>
                    </button>

                    {/* Alcance */}
                    <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left">
                      <Users className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="font-medium text-gray-900">Alcance</span>
                    </button>

                    {/* Exportar Relatórios */}
                    <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left">
                      <Mail className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                      <span className="font-medium text-gray-900">Exportar Relatórios</span>
                    </button>

                    {/* Páginas Mais Acessadas */}
                    <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left">
                      <BarChart3 className="h-5 w-5 text-pink-500 flex-shrink-0" />
                      <span className="font-medium text-gray-900">Páginas Mais Acessadas</span>
                    </button>

                    {/* Relatórios */}
                    <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left">
                      <BarChart3 className="h-5 w-5 text-red-500 flex-shrink-0" />
                      <span className="font-medium text-gray-900">Relatórios</span>
                    </button>
                  </div>

                  {/* Análise Avançada Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                      Análise Avançada
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Atribuição de Conversão */}
                      <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left">
                        <Target className="h-5 w-5 text-violet-500 flex-shrink-0" />
                        <span className="font-medium text-gray-900">Atribuição de Conversão</span>
                      </button>

                      {/* Dashboards Personalizados */}
                      <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left">
                        <BarChart3 className="h-5 w-5 text-cyan-500 flex-shrink-0" />
                        <span className="font-medium text-gray-900">Dashboards Personalizados</span>
                        <span className="ml-auto px-2 py-0.5 text-xs font-semibold text-purple-600 bg-purple-50 rounded">
                          PLANO ADVANCED
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
