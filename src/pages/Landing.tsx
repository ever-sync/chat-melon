import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  MessageSquare,
  Plus,
  Mail,
  Calendar,
  MoreHorizontal,
  Bot,
  BarChart3,
  Phone,
  Search,
  Check,
  Zap,
  Shield,
  Globe,
  Users,
  Layout,
  GitBranch,
  Headphones
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

const Landing = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const navItems = [
    { label: 'Início', href: '#' },
    { label: 'Funcionalidades', href: '#features' },
    { label: 'Soluções', href: '#solutions' },
    { label: 'Recursos', href: '#resources' },
    { label: 'Preços', href: '#pricing' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100">
      {/* Background Dot Pattern */}
      <div className="fixed inset-0 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none -z-10"></div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 rounded-full border-2 border-white"></div>
            </div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">Nucleus</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center bg-gray-50/80 px-2 py-1.5 rounded-full border border-gray-100 shadow-sm">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`px-5 py-2 text-sm font-medium rounded-full transition-all hover:text-indigo-600 text-slate-500`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" className="font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50">
                Entrar
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold rounded-xl px-6 py-5 shadow-lg shadow-indigo-200 transition-all hover:shadow-indigo-300 hover:scale-[1.02]">
                Começar Grátis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-32 pb-20 overflow-hidden text-center">
        <div className="container mx-auto px-4 relative z-10">

          {/* Badge */}
          <div className="inline-flex items-center justify-center mb-8">
            <div className="px-5 py-2 rounded-full border border-indigo-100 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all cursor-default">
              <span className="bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent font-semibold text-sm">
                Ferramentas de IA para CRM Instantâneas
              </span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-slate-900 leading-[1.1]">
            Insights de Cada Cliente,
            <br />
            <span className="bg-gradient-to-r from-indigo-500 via-indigo-500 to-indigo-600 bg-clip-text text-transparent pb-2">
              Gerenciados com Inteligência
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
            Dê à sua equipe a clareza, contexto e velocidade que eles precisam para entregar
            experiências extraordinárias — em cada ponto de contato.
          </p>

          {/* CTA */}
          <div className="flex justify-center mb-24">
            <Link to="/signup">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white h-14 px-10 text-lg rounded-xl shadow-xl shadow-indigo-200 transition-all hover:scale-105 font-semibold">
                Começar Agora
              </Button>
            </Link>
          </div>

          {/* Interactive Flow Visual (Kept visual, translated content inside) */}
          <div className="relative mx-auto max-w-6xl h-[600px] hidden md:block select-none text-left">
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              <path d="M300,180 C300,250 500,250 500,320" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="6 6" />
              <path d="M850,230 C850,280 650,280 650,320" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="6 6" />
              <path d="M300,380 C300,450 400,450 400,500" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="6 6" />
              <path d="M850,380 C850,450 750,450 750,480" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="6 6" />
            </svg>

            {/* Card 1 */}
            <div className="absolute top-20 left-20 z-10 animate-fade-in-up [animation-delay:200ms]">
              <div className="flex items-center gap-2 text-indigo-500 font-semibold mb-2 text-sm">
                <Calendar className="w-4 h-4" /> Agendamento
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 w-64 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800">Demo Rápida</h4>
                </div>
                <div className="text-xs text-slate-400 mb-4">12 de Maio, 14:30 - 15:30</div>
                <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-9 text-xs font-semibold gap-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  Reunião Iniciada
                </Button>
              </div>
            </div>

            {/* Card 2 */}
            <div className="absolute top-24 right-20 z-10 animate-fade-in-up [animation-delay:400ms]">
              <div className="flex items-center gap-2 text-indigo-500 font-semibold mb-2 text-sm">
                <BarChart3 className="w-4 h-4" /> CRM de Vendas
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 w-80 relative group hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <Phone className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Passo 2: Tentativa de Contato</h4>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                  <div className="h-full w-1/3 bg-indigo-600 rounded-full"></div>
                  <div className="h-full w-1/4 bg-slate-200 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Center Main Card */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 animate-fade-in-up [animation-delay:0ms]">
              <div className="bg-white rounded-3xl p-6 shadow-[0_20px_50px_rgb(0,0,0,0.1)] border border-indigo-100 w-[420px]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <img
                      src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
                      alt="User"
                      className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover"
                    />
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Lucas Santos</h3>
                      <p className="text-sm text-slate-400">Diretor de Tecnologia</p>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="text-slate-300">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </div>
                <div className="flex gap-2 mb-6">
                  <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 shadow-lg shadow-indigo-200">
                    <Mail className="w-4 h-4 mr-2" /> Enviar Email
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-xl border-slate-200">
                    <Calendar className="w-4 h-4 text-slate-500" />
                  </Button>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resumo IA</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Lucas Santos está planejando aumentar a eficiência da equipe através de ferramentas modernas...
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="absolute bottom-20 left-48 z-10 animate-fade-in-up [animation-delay:600ms]">
              <div className="flex items-center gap-2 text-indigo-500 font-semibold mb-2 text-sm">
                <Bot className="w-4 h-4" /> Empresa
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 w-56 hover:shadow-lg transition-shadow relative">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">E</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-800">Empresa Tech</h4>
                      <Link to="#" className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 hover:bg-indigo-200">
                        <ArrowRight className="w-3 h-3 -rotate-45" />
                      </Link>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">São Paulo, SP</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Tudo que você precisa em um só lugar</h2>
            <p className="text-lg text-slate-500">
              O Nucleus unifica suas ferramentas de comunicação, vendas e gestão para que você possa focar no que importa: crescer.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 text-indigo-600">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Chat Omnicanal</h3>
              <p className="text-slate-500 leading-relaxed">
                Centralize WhatsApp, Instagram e Messenger em uma única caixa de entrada inteligente e colaborativa.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 text-purple-600">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">CRM Completo</h3>
              <p className="text-slate-500 leading-relaxed">
                Gerencie pipelines, negócios e contatos sem sair da plataforma. Acompanhe cada etapa da venda.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6 text-emerald-600">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Automação & IA</h3>
              <p className="text-slate-500 leading-relaxed">
                Crie fluxos de cadência, chatbots inteligentes e deixe a IA resumir conversas e sugerir respostas.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-6 text-amber-600">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Campanhas em Massa</h3>
              <p className="text-slate-500 leading-relaxed">
                Dispare campanhas de marketing para milhares de contatos com segurança e alta taxa de entrega.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mb-6 text-rose-600">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Analytics Detalhado</h3>
              <p className="text-slate-500 leading-relaxed">
                Métricas em tempo real sobre atendimento, conversão de vendas e performance da equipe.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Integrações</h3>
              <p className="text-slate-500 leading-relaxed">
                Conecte-se com suas ferramentas favoritas via Webhooks, API e integrações nativas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="py-24 bg-white border-y border-slate-100">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Soluções para cada time</h2>
            <p className="text-lg text-slate-500">
              O Nucleus se adapta ao fluxo de trabalho da sua empresa.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white">
              <div className="absolute top-0 right-0 -m-8 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-indigo-400" /> Vendas
              </h3>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-start gap-2"><Check className="w-5 h-5 text-indigo-400 shrink-0" /> Pipeline Visual</li>
                <li className="flex items-start gap-2"><Check className="w-5 h-5 text-indigo-400 shrink-0" /> Automação de Follow-up</li>
                <li className="flex items-start gap-2"><Check className="w-5 h-5 text-indigo-400 shrink-0" /> Lead Scoring</li>
              </ul>
            </div>

            <div className="group relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white">
              <div className="absolute top-0 right-0 -m-8 w-32 h-32 bg-emerald-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Headphones className="w-6 h-6 text-emerald-400" /> Suporte
              </h3>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-start gap-2"><Check className="w-5 h-5 text-emerald-400 shrink-0" /> Chatbot 24/7</li>
                <li className="flex items-start gap-2"><Check className="w-5 h-5 text-emerald-400 shrink-0" /> Respostas Rápidas</li>
                <li className="flex items-start gap-2"><Check className="w-5 h-5 text-emerald-400 shrink-0" /> Central de Conhecimento</li>
              </ul>
            </div>

            <div className="group relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white">
              <div className="absolute top-0 right-0 -m-8 w-32 h-32 bg-rose-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Zap className="w-6 h-6 text-rose-400" /> Marketing
              </h3>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-start gap-2"><Check className="w-5 h-5 text-rose-400 shrink-0" /> Disparo em Massa</li>
                <li className="flex items-start gap-2"><Check className="w-5 h-5 text-rose-400 shrink-0" /> Segmentação de Leads</li>
                <li className="flex items-start gap-2"><Check className="w-5 h-5 text-rose-400 shrink-0" /> Análise de Campanhas</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* AI Workforce Section (Translated) */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row shadow-2xl rounded-3xl overflow-hidden border border-slate-100">
            {/* Left Content */}
            <div className="w-full md:w-1/2 p-12 md:p-20 bg-white flex flex-col justify-center">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 leading-tight">
                A Força de Trabalho IA com quem você pode contar.
              </h2>
              <p className="text-xl text-slate-500 mb-12 leading-relaxed">
                Nunca para, sempre melhora. Escale seu atendimento para atender qualquer demanda sem perder qualidade.
              </p>
              <Link to="#" className="text-lg font-semibold flex items-center gap-2 hover:gap-4 transition-all group">
                Mais sobre o Nucleus
                <ArrowRight className="w-5 h-5 text-indigo-600 group-hover:text-indigo-700" />
              </Link>
            </div>
            {/* Right Visual */}
            <div className="w-full md:w-1/2 bg-indigo-600 relative min-h-[400px]">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-indigo-700 opacity-90"></div>
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                <span className="text-[20rem] font-bold text-white opacity-10 select-none">IA</span>
              </div>
              <img
                src="https://images.unsplash.com/photo-1573497620053-ea5300f94f21?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="AI Workforce"
                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80 md:opacity-100"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section (Translated) */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm text-sm font-medium text-slate-600 mb-6">
              <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Preços
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Comece pequeno, cresça rápido
            </h2>
            <p className="text-lg text-slate-500 mb-10">
              Comece gratuitamente e faça o upgrade conforme sua equipe cresce.
            </p>

            {/* Toggle */}
            <div className="flex items-center justify-center gap-4 text-sm font-medium">
              <span className={!isAnnual ? "text-slate-900" : "text-slate-500"}>Mensal</span>
              <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
              <span className={isAnnual ? "text-slate-900" : "text-slate-500"}>Anual (-20%)</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Starter */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-xl transition-all">
              <h3 className="font-bold text-lg mb-2">Starter</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold tracking-tight">R$0</span>
                <span className="text-slate-500 text-sm">/ {isAnnual ? "ano" : "mês"}</span>
              </div>
              <p className="text-xs text-slate-500 mb-6 font-medium uppercase tracking-wide">Para uso pessoal</p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" /> 2 Usuários
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" /> Feed de Atividade Básico
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" /> Resumo Inteligente IA
                </li>
              </ul>
              <Button variant="outline" className="w-full rounded-xl h-11 border-slate-200">Acesso Grátis</Button>
            </div>

            {/* Growth */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-xl transition-all">
              <h3 className="font-bold text-lg mb-2">Growth</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold tracking-tight">R${isAnnual ? "129" : "149"}</span>
                <span className="text-slate-500 text-sm">/ {isAnnual ? "ano" : "mês"}</span>
              </div>
              <p className="text-xs text-slate-500 mb-6 font-medium uppercase tracking-wide">Para times em crescimento</p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" /> Até 10 Usuários
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" /> Pontuação de Leads
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" /> Sequências de Email
                </li>
              </ul>
              <Button variant="outline" className="w-full rounded-xl h-11 border-slate-200">Começar Agora</Button>
            </div>

            {/* Pro */}
            <div className="bg-white rounded-2xl p-6 border-2 border-indigo-500 shadow-2xl shadow-indigo-200/50 relative transform md:-translate-y-4">
              <div className="absolute top-0 left-0 w-full h-8 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center justify-center rounded-t-lg -mt-[2px]">
                Mais Popular
              </div>
              <h3 className="font-bold text-lg mb-2 mt-6">Pro</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold tracking-tight">R${isAnnual ? "249" : "299"}</span>
                <span className="text-slate-500 text-sm">/ {isAnnual ? "ano" : "mês"}</span>
              </div>
              <p className="text-xs text-slate-500 mb-6 font-medium uppercase tracking-wide">Para times profissionais</p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" /> Usuários Ilimitados
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" /> Chatbots Avançados
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" /> Sugestões de IA
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" /> Múltiplos Canais
                </li>
              </ul>
              <Button className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl h-11 hover:from-indigo-600 hover:to-indigo-700 shadow-lg shadow-indigo-200">Começar Teste Grátis</Button>
            </div>

            {/* Enterprise */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-xl transition-all">
              <h3 className="font-bold text-lg mb-2">Enterprise</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold tracking-tight text-indigo-500">Custom</span>
              </div>
              <p className="text-xs text-slate-500 mb-6 font-medium uppercase tracking-wide">Para grandes corporações</p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" /> Campos & Dados Customizados
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" /> API Dedicada
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" /> SLA de Suporte
                </li>
              </ul>
              <Button variant="outline" className="w-full rounded-xl h-11 border-slate-200">Falar com Vendas</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Resources & Help */}
      <section id="resources" className="py-24 bg-indigo-900 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-8">Recursos para você ir além</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <a href="#" className="bg-white/10 hover:bg-white/20 p-6 rounded-2xl transition-all block group">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Layout className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Blog do Nucleus</h3>
              <p className="text-indigo-200 text-sm">Dicas de vendas, atendimento e novidades do produto.</p>
            </a>
            <a href="#" className="bg-white/10 hover:bg-white/20 p-6 rounded-2xl transition-all block group">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <GitBranch className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Documentação API</h3>
              <p className="text-indigo-200 text-sm">Guia completo para desenvolvedores integrarem com o Nucleus.</p>
            </a>
            <a href="#" className="bg-white/10 hover:bg-white/20 p-6 rounded-2xl transition-all block group">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Headphones className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Central de Ajuda</h3>
              <p className="text-indigo-200 text-sm">Tutoriais em vídeo e artigos para tirar suas dúvidas.</p>
            </a>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 flex flex-col lg:flex-row gap-16">
          <div className="lg:w-1/3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 shadow-sm text-sm font-medium text-slate-600 mb-6">
              <MessageSquare className="w-3 h-3 text-indigo-500" /> FAQ
            </div>
            <h2 className="text-4xl font-bold text-slate-900 mb-6">
              Dúvidas Frequentes
            </h2>
            <p className="text-slate-500 mb-4">
              Não encontrou o que procurava? <a href="#" className="text-indigo-600 font-semibold hover:underline">Fale Conosco</a>
            </p>
          </div>
          <div className="lg:w-2/3">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-lg font-semibold text-slate-800">Como o Nucleus é diferente de outros CRMs?</AccordionTrigger>
                <AccordionContent className="text-slate-600 text-base leading-relaxed">
                  O Nucleus não apenas armazena dados — ele os entende. Desde resumir interações com clientes até sugerir próximos passos, o Nucleus é como um copiloto que ajuda você a agir mais rápido e com mais confiança.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-lg font-semibold text-slate-800">O Nucleus ajuda minha equipe a economizar tempo?</AccordionTrigger>
                <AccordionContent className="text-slate-600 text-base leading-relaxed">
                  Com certeza. O Nucleus automatiza tarefas rotineiras, agenda acompanhamentos e fornece resumos instantâneos de reuniões, permitindo que sua equipe foque em interações de alto valor.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-lg font-semibold text-slate-800">É difícil configurar o Nucleus?</AccordionTrigger>
                <AccordionContent className="text-slate-600 text-base leading-relaxed">
                  De jeito nenhum. Oferecemos um processo de integração simples, e nossa equipe de suporte está disponível para ajudar a migrar seus dados e configurar seus fluxos de trabalho em poucos cliques.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Mega Footer Section */}
      <footer className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white pt-24 pb-8 overflow-hidden relative">
        {/* Decorative Arcs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[180%] h-[1000px] bg-white/5 rounded-[100%] blur-3xl pointer-events-none -translate-y-1/2"></div>

        {/* CTA Content */}
        <div className="container mx-auto px-6 text-center relative z-10 mb-20">
          <div className="flex justify-center mb-6">
            <div className="w-6 h-6 rotate-45 bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)]"></div>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            Saiba Mais, Aja Rápido e <br /> Feche Mais Vendas.
          </h2>
          <p className="text-xl text-indigo-100 mb-10">
            Clareza impulsionada por IA para cada etapa da jornada do seu cliente
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-white text-indigo-900 border-none hover:bg-slate-100 font-bold h-12 px-8 rounded-lg shadow-lg">
              Começar Agora
            </Button>
            <Button variant="outline" className="bg-slate-900/30 text-white border-white/20 hover:bg-slate-900/50 font-bold h-12 px-8 rounded-lg">
              Agendar Demo
            </Button>
          </div>
        </div>

        {/* White Footer Card */}
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-3xl p-12 text-slate-900 shadow-2xl">
            <div className="grid md:grid-cols-4 gap-12 mb-16">
              {/* Brand */}
              <div className="col-span-1 md:col-span-1">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full border-2 border-white"></div>
                  </div>
                  <span className="text-2xl font-bold text-slate-900 tracking-tight">Nucleus</span>
                </div>
                <h3 className="text-3xl font-bold text-slate-400 leading-tight">
                  Insights de Clientes, <span className="text-slate-900">Gerenciados Inteligente</span>
                </h3>
              </div>

              {/* Links */}
              <div>
                <h4 className="font-bold mb-6">Funcionalidades</h4>
                <ul className="space-y-4 text-slate-500">
                  <li><a href="#" className="hover:text-indigo-600">Feed Nucleus</a></li>
                  <li><a href="#" className="hover:text-indigo-600">Resumo Inteligente</a></li>
                  <li><a href="#" className="hover:text-indigo-600">Pulse Score</a></li>
                  <li><a href="#" className="hover:text-indigo-600">Lembretes de Touchpoint</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold mb-6">Empresa</h4>
                <ul className="space-y-4 text-slate-500">
                  <li><a href="#" className="hover:text-indigo-600">Sobre nós</a></li>
                  <li><a href="#" className="hover:text-indigo-600">Carreiras</a></li>
                  <li><a href="#" className="hover:text-indigo-600">Contato</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold mb-6">Redes Sociais</h4>
                <ul className="space-y-4 text-slate-500">
                  <li><a href="#" className="hover:text-indigo-600">Instagram</a></li>
                  <li><a href="#" className="hover:text-indigo-600">Facebook</a></li>
                  <li><a href="#" className="hover:text-indigo-600">Twitter</a></li>
                  <li><a href="#" className="hover:text-indigo-600">Youtube</a></li>
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center text-sm text-slate-400">
              <p>Copyright 2025, Todos os direitos reservados por Nucleus</p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-indigo-600">Política de Privacidade</a>
                <a href="#" className="hover:text-indigo-600">Termos de Uso</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;