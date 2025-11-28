import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, MessageSquare, Users, BarChart3, Zap, Building2, Palette, ArrowRight, Shield, Globe, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  const features = [
    {
      icon: MessageSquare,
      title: "Chat Unificado",
      description: "Centralize WhatsApp, Instagram e Webchat em uma única tela.",
    },
    {
      icon: Palette,
      title: "Adaptável como um Camaleão",
      description: "Personalize fluxos, campos e a interface para se moldar ao seu negócio.",
    },
    {
      icon: Users,
      title: "CRM Flexível",
      description: "Gerencie leads e clientes com pipelines que você define.",
    },
    {
      icon: Zap,
      title: "Automação Inteligente",
      description: "Crie bots e fluxos de trabalho sem digitar uma linha de código.",
    },
    {
      icon: BarChart3,
      title: "Analytics em Tempo Real",
      description: "Tome decisões baseadas em dados com dashboards detalhados.",
    },
    {
      icon: Building2,
      title: "Multi-Empresa",
      description: "Gerencie múltiplas operações ou filiais em uma única conta.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-2 rounded-xl text-white">
              <span className="text-2xl">🦎</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              CamalaChat
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-emerald-600 transition-colors">Recursos</a>
            <a href="#solutions" className="hover:text-emerald-600 transition-colors">Soluções</a>
            <a href="#pricing" className="hover:text-emerald-600 transition-colors">Preços</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" className="font-medium hover:text-emerald-600 hover:bg-emerald-50">Login</Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 shadow-lg shadow-emerald-500/20">
                Começar Grátis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-400/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-400/20 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-8 border border-emerald-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Novo: Integração com IA Generativa
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-slate-900">
            O Chat que se <br />
            <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 bg-clip-text text-transparent">
              Adapta ao seu Negócio
            </span>
          </h1>

          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            CamalaChat é a plataforma de comunicação e CRM que muda de cor conforme sua necessidade.
            Atenda, venda e fidelize em um só lugar.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/signup">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 transition-all hover:scale-105">
                Iniciar Teste Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-2 hover:bg-slate-50">
                Ver Planos e Preços
              </Button>
            </Link>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-20 relative mx-auto max-w-5xl">
            <div className="rounded-3xl border border-slate-200 bg-white/50 backdrop-blur-xl p-2 shadow-2xl shadow-slate-200/50">
              <div className="rounded-2xl overflow-hidden border border-slate-100 bg-white">
                <img
                  src="https://placehold.co/1200x800/f8fafc/e2e8f0?text=Dashboard+Preview"
                  alt="CamalaChat Dashboard"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
            {/* Floating Elements */}
            <div className="absolute -right-12 top-1/3 p-4 bg-white rounded-2xl shadow-xl border border-slate-100 animate-bounce delay-1000 hidden md:block">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Venda Realizada!</p>
                  <p className="text-xs text-slate-500">R$ 1.450,00 via WhatsApp</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners/Social Proof */}
      <section className="py-10 border-y border-slate-100 bg-slate-50/50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-8">
            Empresas que confiam na nossa adaptação
          </p>
          <div className="flex flex-wrap justify-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Placeholders for logos */}
            {['TechCorp', 'GlobalSales', 'InnovateX', 'GrowthLabs', 'FutureScale'].map((brand) => (
              <span key={brand} className="text-xl font-bold text-slate-400 flex items-center gap-2">
                <Building2 className="h-6 w-6" /> {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Um ecossistema completo
            </h2>
            <p className="text-lg text-slate-600">
              Tudo o que você precisa para transformar conversas em conversões, em uma interface que você vai adorar usar.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg shadow-slate-200/40 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 group">
                <CardContent className="p-8">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6 group-hover:bg-emerald-500 transition-colors duration-300">
                    <feature.icon className="h-7 w-7 text-emerald-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Chameleon Feature Highlight */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-block px-4 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-medium text-sm mb-6 border border-emerald-500/30">
                Flexibilidade Total
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Adapta-se como um <br />
                <span className="text-emerald-400">Camaleão</span>
              </h2>
              <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                Não mude seu processo para caber no software. O CamalaChat se molda ao seu fluxo de trabalho. Crie campos personalizados, pipelines ilimitados e automações que refletem exatamente como sua empresa funciona.
              </p>
              <ul className="space-y-4">
                {[
                  "Campos de contato ilimitados",
                  "Pipelines de vendas customizáveis",
                  "Tags e segmentação dinâmica",
                  "Permissões granulares por usuário"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-200">
                    <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Check className="h-4 w-4 text-emerald-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
              <div className="relative bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-2xl">
                {/* Mockup of customization UI */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                    <div className="h-3 w-24 bg-slate-600 rounded-full"></div>
                    <div className="h-8 w-8 bg-emerald-500 rounded-lg"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-slate-700 rounded-full"></div>
                    <div className="h-2 w-3/4 bg-slate-700 rounded-full"></div>
                    <div className="h-2 w-1/2 bg-slate-700 rounded-full"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="h-20 bg-slate-700/50 rounded-xl border border-slate-600 border-dashed flex items-center justify-center text-slate-500 text-xs">
                      Campo Customizado
                    </div>
                    <div className="h-20 bg-slate-700/50 rounded-xl border border-slate-600 border-dashed flex items-center justify-center text-slate-500 text-xs">
                      Nova Etapa
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Planos Transparentes
            </h2>
            <p className="text-lg text-slate-600">
              Comece pequeno e cresça. Sem contratos de fidelidade ou taxas escondidas.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Starter",
                price: "97",
                description: "Para pequenos negócios iniciantes",
                features: ["1 usuário", "1 conexão WhatsApp", "CRM Básico", "1.000 conversas/mês"]
              },
              {
                name: "Pro",
                price: "297",
                popular: true,
                description: "Para times em crescimento",
                features: ["5 usuários", "3 conexões WhatsApp", "Automação de Marketing", "CRM Avançado", "Conversas Ilimitadas"]
              },
              {
                name: "Business",
                price: "697",
                description: "Para grandes operações",
                features: ["15 usuários", "10 conexões WhatsApp", "API Aberta", "Gerente de Conta", "SLA Garantido"]
              },
            ].map((plan, index) => (
              <Card
                key={index}
                className={`relative p-8 border-0 shadow-xl transition-all duration-300 hover:-translate-y-2 ${plan.popular
                    ? "bg-white ring-2 ring-emerald-500 shadow-emerald-500/10"
                    : "bg-white shadow-slate-200/50"
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                    Mais Escolhido
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <p className="text-slate-500 text-sm">{plan.description}</p>
                </div>
                <div className="mb-8">
                  <span className="text-4xl font-bold text-slate-900">R$ {plan.price}</span>
                  <span className="text-slate-500">/mês</span>
                </div>
                <Link to="/signup">
                  <Button
                    className={`w-full h-12 rounded-xl font-bold mb-8 ${plan.popular
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                      }`}
                  >
                    Começar Agora
                  </Button>
                </Link>
                <ul className="space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                      <Check className={`h-5 w-5 ${plan.popular ? "text-emerald-500" : "text-slate-400"}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl shadow-emerald-900/20">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold mb-8">
                Pronto para evoluir seu atendimento?
              </h2>
              <p className="text-xl text-emerald-100 mb-10">
                Junte-se a mais de 500 empresas que já usam o CamalaChat para vender mais e atender melhor.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup">
                  <Button size="lg" className="h-14 px-10 text-lg bg-white text-emerald-700 hover:bg-emerald-50 font-bold rounded-full shadow-xl">
                    Criar Conta Grátis
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline" className="h-14 px-10 text-lg border-2 border-emerald-400 text-white hover:bg-emerald-600/50 rounded-full">
                    Falar com Consultor
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">🦎</span>
                <span className="text-2xl font-bold text-white">CamalaChat</span>
              </div>
              <p className="text-slate-400 max-w-sm mb-6">
                A plataforma de comunicação que se adapta ao seu negócio. Atendimento, CRM e Automação em um só lugar.
              </p>
              <div className="flex gap-4">
                {/* Social Icons Placeholders */}
                <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer">
                  <Globe className="h-5 w-5" />
                </div>
                <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer">
                  <Smartphone className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Produto</h4>
              <ul className="space-y-4">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Recursos</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Integrações</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Changelog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Empresa</h4>
              <ul className="space-y-4">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Sobre Nós</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Carreiras</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Contato</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>© 2025 CamalaChat. Todos os direitos reservados.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
              <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;