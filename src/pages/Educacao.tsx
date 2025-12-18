import { Button } from '@/components/ui/button';
import {
    ArrowRight,
    MessageSquare,
    Users,
    Bot,
    BarChart3,
    Check,
    Zap,
    Globe,
    Calendar,
    GraduationCap,
    FileText,
    ChevronDown,
    TrendingUp,
    Clock,
    BookOpen,
    Target,
    DollarSign,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Educacao = () => {
    const navItems = [
        { label: 'Início', href: '/' },
        { label: 'Funcionalidades', href: '/#features' },
        { label: 'Soluções', href: '/#solutions' },
        { label: 'Recursos', href: '/#resources' },
        { label: 'Preços', href: '/#pricing' },
    ];

    const segmentItems = [
        { label: 'Educação', href: '/educacao' },
        { label: 'Imobiliárias', href: '/imobiliarias' },
        { label: 'Concessionárias', href: '/concessionarias' },
    ];

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100">
            {/* Background Dot Pattern */}
            <div className="fixed inset-0 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none -z-10"></div>

            {/* Header */}
            <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full border-2 border-white"></div>
                        </div>
                        <span className="text-2xl font-bold text-slate-900 tracking-tight">Nucleus</span>
                    </Link>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center bg-gray-50/80 px-2 py-1.5 rounded-full border border-gray-100 shadow-sm gap-1">
                        {navItems.map((item) => (
                            <a
                                key={item.label}
                                href={item.href}
                                className={`px-5 py-2 text-sm font-medium rounded-full transition-all hover:text-indigo-600 text-slate-500`}
                            >
                                {item.label}
                            </a>
                        ))}

                        {/* Segmentos Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger className="px-5 py-2 text-sm font-medium rounded-full transition-all hover:text-indigo-600 text-indigo-600 flex items-center gap-1 outline-none">
                                Segmentos
                                <ChevronDown className="w-3.5 h-3.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-white">
                                {segmentItems.map((segment) => (
                                    <DropdownMenuItem key={segment.label} asChild>
                                        <Link
                                            to={segment.href}
                                            className="cursor-pointer text-slate-700 hover:text-indigo-600 focus:text-indigo-600"
                                        >
                                            {segment.label}
                                        </Link>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        <Link to="/auth">
                            <Button
                                variant="ghost"
                                className="font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                            >
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
            <main className="pt-32 pb-20 overflow-hidden">
                <div className="container mx-auto px-4 relative z-10">
                    {/* Badge */}
                    <div className="inline-flex items-center justify-center mb-8 w-full">
                        <div className="px-5 py-2 rounded-full border border-indigo-100 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all cursor-default">
                            <span className="bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent font-semibold text-sm">
                                IA + CRM para captação e relacionamento com alunos
                            </span>
                        </div>
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-slate-900 leading-[1.1] text-center">
                        Do primeiro "oi" sobre o curso até a matrícula confirmada, com contexto em cada etapa
                    </h1>

                    {/* Subheadline */}
                    <p className="text-xl text-slate-500 mb-10 max-w-3xl mx-auto leading-relaxed font-medium text-center">
                        O Nucleus centraliza atendimentos de faculdades, escolas, cursos livres e EAD em um só fluxo.
                        <br />
                        Cada conversa vira lead, oportunidade, matrícula, renovação ou reativação, sem perder aluno no meio do caminho.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24">
                        <Link to="/signup">
                            <Button
                                size="lg"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white h-14 px-10 text-lg rounded-xl shadow-xl shadow-indigo-200 transition-all hover:scale-105 font-semibold"
                            >
                                Começar agora
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            size="lg"
                            className="bg-white hover:bg-slate-50 h-14 px-10 text-lg rounded-xl border-slate-200 transition-all hover:scale-105 font-semibold"
                        >
                            Agendar demo para sua instituição de ensino
                        </Button>
                    </div>
                </div>
            </main>

            {/* Seção 1 – A realidade do time de captação e atendimento */}
            <section className="py-24 bg-slate-50">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 text-center">
                            Muitos canais, muitos alunos e pouca visibilidade do funil
                        </h2>

                        <div className="bg-white rounded-3xl p-12 shadow-sm border border-slate-100 mb-8">
                            <p className="text-xl text-slate-600 leading-relaxed mb-8">
                                O aluno pergunta no Instagram, volta no WhatsApp, manda e-mail, entra no site.
                                Isso vale para faculdades, escolas, cursos técnicos, cursinhos e EAD.
                            </p>

                            <p className="text-xl text-slate-600 leading-relaxed mb-8">
                                Enquanto isso, o time responde correndo, sem histórico e sem saber em que estágio cada pessoa está.
                            </p>

                            <div className="space-y-4 mb-8">
                                <p className="text-lg font-bold text-slate-900">O resultado costuma ser:</p>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3 text-slate-600">
                                        <div className="mt-1 w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                                            <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                                        </div>
                                        <span>leads de campanha sem acompanhamento</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-slate-600">
                                        <div className="mt-1 w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                                            <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                                        </div>
                                        <span>dúvidas repetidas sobre curso, série, turma, bolsa, turno e mensalidade</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-slate-600">
                                        <div className="mt-1 w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                                            <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                                        </div>
                                        <span>aluno interessado que some antes da matrícula</span>
                                    </li>
                                </ul>
                            </div>

                            <p className="text-xl font-bold text-indigo-600 text-center">
                                Com o Nucleus, cada contato vira um registro vivo no CRM, não um chat perdido.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Seção 2 – Como o Nucleus ajuda instituições de ensino */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                            Captação, matrícula, rematrícula e cobrança em um fluxo contínuo
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-2xl border border-indigo-100 shadow-sm hover:shadow-md transition-all">
                            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 text-indigo-600">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Chat omnichannel para candidatos e alunos</h3>
                            <p className="text-slate-600 leading-relaxed">
                                WhatsApp integrado ao CRM, com outros canais entrando no roadmap.
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition-all">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 text-purple-600">
                                <GraduationCap className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">CRM por curso, turma, turno e etapa do funil</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Você vê onde cada lead está: interesse, prova ou teste, visita, matrícula e rematrícula.
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-50 to-white p-8 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-all">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6 text-emerald-600">
                                <Clock className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Automação da jornada do aluno</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Lembretes de prova, visitas, entrevistas, documentação, prazo de matrícula, rematrícula e renegociação, tudo automático.
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-amber-50 to-white p-8 rounded-2xl border border-amber-100 shadow-sm hover:shadow-md transition-all">
                            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-6 text-amber-600">
                                <Bot className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">IA treinada nos seus regulamentos e cursos</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Responde dúvidas sobre cursos, séries, modalidades, bolsas, documentação e normas com base nos seus documentos.
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-rose-50 to-white p-8 rounded-2xl border border-rose-100 shadow-sm hover:shadow-md transition-all">
                            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mb-6 text-rose-600">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Visão de gestão para captação e sucesso do aluno</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Relatórios por curso, unidade, canal, campanha e etapa da jornada.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Seção 3 – Fluxos prontos para educação */}
            <section className="py-24 bg-slate-50">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                            Fluxos que conectam marketing, comercial, secretaria e financeiro
                        </h2>
                    </div>

                    <div className="max-w-5xl mx-auto space-y-6">
                        {/* Fluxo 1 */}
                        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                                    <Target className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-3">Captação de leads de campanhas</h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        O lead entra por formulário ou landing page, o Nucleus cria o contato e dispara uma mensagem de boas-vindas com informações do curso, série ou turma, mais um CTA para falar com um atendente.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Fluxo 2 */}
                        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                                    <BookOpen className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-3">Atendimento sobre cursos, turmas e bolsas</h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        A IA responde as dúvidas mais comuns, como grade, duração, turno, mensalidade e políticas de bolsa, e encaminha para o time quando precisa de atenção humana.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Fluxo 3 */}
                        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                                    <FileText className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-3">Prova, teste ou processo seletivo</h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        Confirmação de inscrição, lembretes de data e hora, envio de resultado e próximos passos totalmente organizados.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Fluxo 4 */}
                        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                                    <Calendar className="w-6 h-6 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-3">Matrícula e documentação</h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        Sequência de mensagens guiando o responsável ou o aluno em documentos, prazos e status, com histórico acessível para todo o time.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Fluxo 5 */}
                        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
                                    <Zap className="w-6 h-6 text-rose-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-3">Rematrícula e retenção</h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        Campanhas segmentadas para alunos em risco de evasão ou atrasados, com comunicação personalizada por turma, curso ou unidade.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Fluxo 6 */}
                        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                    <DollarSign className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-3">Cobrança mais humana</h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        Mensagens em massa segmentadas para negociações e lembretes, sem poluir o canal do aluno ou do responsável.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Seção 4 – Para cada área da instituição */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                            Uma visão única do aluno para todas as áreas
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                        {/* Marketing e captação */}
                        <div className="group relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white">
                            <div className="absolute top-0 right-0 -m-8 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <Target className="w-6 h-6 text-indigo-400" /> Marketing e captação
                            </h3>
                            <ul className="space-y-4 text-slate-300 text-sm">
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" /> Funil claro, da campanha à matrícula
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" /> Leads segmentados por curso, série, unidade e canal
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" /> Métricas de conversão por campanha
                                </li>
                            </ul>
                        </div>

                        {/* Comercial e atendimento */}
                        <div className="group relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white">
                            <div className="absolute top-0 right-0 -m-8 w-32 h-32 bg-emerald-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <Users className="w-6 h-6 text-emerald-400" /> Comercial e atendimento
                            </h3>
                            <ul className="space-y-4 text-slate-300 text-sm">
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> Histórico completo de cada interessado ou aluno
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> IA sugerindo respostas e próximos passos
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> Handoff limpo entre atendentes, turnos e unidades
                                </li>
                            </ul>
                        </div>

                        {/* Secretaria e área acadêmica */}
                        <div className="group relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white">
                            <div className="absolute top-0 right-0 -m-8 w-32 h-32 bg-amber-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <BookOpen className="w-6 h-6 text-amber-400" /> Secretaria e área acadêmica
                            </h3>
                            <ul className="space-y-4 text-slate-300 text-sm">
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" /> Visão rápida de status de documentos e matrícula
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" /> Comunicação organizada por turma, curso e unidade
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" /> Registros centralizados de contatos e solicitações
                                </li>
                            </ul>
                        </div>

                        {/* Financeiro */}
                        <div className="group relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white">
                            <div className="absolute top-0 right-0 -m-8 w-32 h-32 bg-rose-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <DollarSign className="w-6 h-6 text-rose-400" /> Financeiro
                            </h3>
                            <ul className="space-y-4 text-slate-300 text-sm">
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" /> Base pronta para disparos de cobrança e renegociação
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" /> Segmentação por atraso, valor, curso, série ou plano
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" /> Registro de interações para cada negociação
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Seção 5 – IA aplicada à educação */}
            <section className="py-24 bg-indigo-900 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-4xl md:text-5xl font-bold mb-8 text-center">
                            IA que fala a língua da sua instituição
                        </h2>

                        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-10 border border-white/20">
                            <p className="text-xl text-indigo-100 leading-relaxed mb-8 italic">
                                "A IA do Nucleus aprende com seus regulamentos, manuais, políticas, FAQs, PDFs de cursos, propostas comerciais e histórico de atendimento, seja em faculdade, escola, curso técnico ou EAD."
                            </p>

                            <div className="space-y-4 mb-8">
                                <p className="text-lg font-bold text-white">Ela te ajuda a:</p>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3 text-indigo-100">
                                        <div className="mt-1 w-5 h-5 rounded-full bg-indigo-400/20 flex items-center justify-center shrink-0">
                                            <Check className="w-3 h-3 text-indigo-300" />
                                        </div>
                                        <span>responder as mesmas perguntas de sempre sem sobrecarregar o time</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-indigo-100">
                                        <div className="mt-1 w-5 h-5 rounded-full bg-indigo-400/20 flex items-center justify-center shrink-0">
                                            <Check className="w-3 h-3 text-indigo-300" />
                                        </div>
                                        <span>manter a consistência da informação em todos os canais e unidades</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-indigo-100">
                                        <div className="mt-1 w-5 h-5 rounded-full bg-indigo-400/20 flex items-center justify-center shrink-0">
                                            <Check className="w-3 h-3 text-indigo-300" />
                                        </div>
                                        <span>resumir interações longas antes de passar o caso para outro setor</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="text-center">
                                <a
                                    href="#"
                                    className="inline-flex items-center gap-2 text-lg font-semibold text-white hover:text-indigo-200 transition-all"
                                >
                                    Ver Nucleus em ação para educação →
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <footer className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white pt-24 pb-8 overflow-hidden relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[180%] h-[1000px] bg-white/5 rounded-[100%] blur-3xl pointer-events-none -translate-y-1/2"></div>

                <div className="container mx-auto px-6 text-center relative z-10 mb-20">
                    <div className="flex justify-center mb-6">
                        <div className="w-6 h-6 rotate-45 bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)]"></div>
                    </div>
                    <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                        Transforme interesse em matrícula e matrícula em relacionamento contínuo
                    </h2>
                    <p className="text-xl text-indigo-100 mb-10 max-w-3xl mx-auto">
                        Use IA, CRM e automação para cuidar de cada etapa da jornada do aluno, da primeira dúvida à renovação, em qualquer tipo de instituição de ensino.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/signup">
                            <Button className="bg-white text-indigo-900 border-none hover:bg-slate-100 font-bold h-12 px-8 rounded-lg shadow-lg">
                                Começar agora
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            className="bg-slate-900/30 text-white border-white/20 hover:bg-slate-900/50 font-bold h-12 px-8 rounded-lg"
                        >
                            Agendar demo para educação
                        </Button>
                    </div>
                </div>

                {/* Footer Links */}
                <div className="container mx-auto px-4">
                    <div className="bg-white rounded-3xl p-12 text-slate-900 shadow-2xl">
                        <div className="grid md:grid-cols-4 gap-12 mb-8">
                            <div className="col-span-1 md:col-span-1">
                                <Link to="/" className="flex items-center gap-2 mb-6">
                                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                                        <div className="w-4 h-4 rounded-full border-2 border-white"></div>
                                    </div>
                                    <span className="text-2xl font-bold text-slate-900 tracking-tight">Nucleus</span>
                                </Link>
                                <p className="text-slate-500">
                                    IA + CRM para instituições de ensino que não perdem alunos
                                </p>
                            </div>

                            <div>
                                <h4 className="font-bold mb-6">Funcionalidades</h4>
                                <ul className="space-y-4 text-slate-500">
                                    <li><a href="/#features" className="hover:text-indigo-600">Chat Omnichannel</a></li>
                                    <li><a href="/#features" className="hover:text-indigo-600">CRM Completo</a></li>
                                    <li><a href="/#features" className="hover:text-indigo-600">Automação & IA</a></li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-bold mb-6">Segmentos</h4>
                                <ul className="space-y-4 text-slate-500">
                                    <li><Link to="/educacao" className="hover:text-indigo-600">Educação</Link></li>
                                    <li><Link to="/imobiliarias" className="hover:text-indigo-600">Imobiliárias</Link></li>
                                    <li><Link to="/concessionarias" className="hover:text-indigo-600">Concessionárias</Link></li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-bold mb-6">Empresa</h4>
                                <ul className="space-y-4 text-slate-500">
                                    <li><a href="#" className="hover:text-indigo-600">Sobre nós</a></li>
                                    <li><a href="/#pricing" className="hover:text-indigo-600">Preços</a></li>
                                    <li><a href="#" className="hover:text-indigo-600">Contato</a></li>
                                </ul>
                            </div>
                        </div>

                        <div className="border-t border-slate-200 pt-8 text-center text-slate-500 text-sm">
                            © 2024 Nucleus. Todos os direitos reservados.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Educacao;
