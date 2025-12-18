import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, AlertCircle, CheckCircle, XCircle, Scale, DollarSign, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermosUso = () => {
    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans">
            {/* Background Dot Pattern */}
            <div className="fixed inset-0 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none -z-10"></div>

            {/* Header */}
            <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full border-2 border-white"></div>
                        </div>
                        <span className="text-2xl font-bold text-slate-900 tracking-tight">Nucleus</span>
                    </Link>

                    <Link to="/">
                        <Button variant="ghost" className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Voltar ao site
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-32 pb-20">
                <div className="container mx-auto px-6 max-w-4xl">
                    {/* Hero */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mb-6">
                            <Scale className="w-8 h-8 text-indigo-600" />
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold mb-4 text-slate-900">
                            Termos de Uso
                        </h1>
                        <p className="text-lg text-slate-500">
                            Última atualização: 17 de dezembro de 2024
                        </p>
                    </div>

                    {/* Content */}
                    <div className="prose prose-slate max-w-none">
                        {/* Seção 1 */}
                        <section className="mb-12">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-indigo-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 m-0">1. Aceitação dos Termos</h2>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                                <p className="text-slate-700 leading-relaxed mb-4">
                                    Ao acessar e usar a plataforma Nucleus, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deve usar nossos serviços.
                                </p>
                                <p className="text-slate-700 leading-relaxed m-0">
                                    Reservamo-nos o direito de modificar estes termos a qualquer momento. Mudanças significativas serão comunicadas com antecedência.
                                </p>
                            </div>
                        </section>

                        {/* Seção 2 */}
                        <section className="mb-12">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                                    <Users className="w-5 h-5 text-indigo-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 m-0">2. Descrição do Serviço</h2>
                            </div>
                            <div className="bg-white rounded-xl p-6 border border-slate-200">
                                <p className="text-slate-700 leading-relaxed mb-4">
                                    O Nucleus é uma plataforma SaaS (Software as a Service) que oferece:
                                </p>
                                <ul className="space-y-2 text-slate-700">
                                    <li className="flex items-start gap-2">
                                        <span className="text-indigo-600 mt-1">•</span>
                                        <span>Sistema de CRM (Customer Relationship Management)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-indigo-600 mt-1">•</span>
                                        <span>Integração com WhatsApp e outros canais de comunicação</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-indigo-600 mt-1">•</span>
                                        <span>Automações e fluxos de trabalho</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-indigo-600 mt-1">•</span>
                                        <span>Assistente de IA para atendimento e análise</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-indigo-600 mt-1">•</span>
                                        <span>Relatórios e analytics</span>
                                    </li>
                                </ul>
                            </div>
                        </section>

                        {/* Seção 3 */}
                        <section className="mb-12">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-indigo-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 m-0">3. Uso Permitido</h2>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-6 border border-emerald-100">
                                <p className="text-slate-700 leading-relaxed mb-4 font-semibold">Você PODE usar o Nucleus para:</p>
                                <ul className="space-y-2 text-slate-700">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>Gerenciar relacionamentos com clientes e leads</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>Automatizar processos de vendas e atendimento</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>Integrar com suas ferramentas de comunicação</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>Utilizar a IA para melhorar seu atendimento</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>Gerar relatórios e análises de desempenho</span>
                                    </li>
                                </ul>
                            </div>
                        </section>

                        {/* Seção 4 */}
                        <section className="mb-12">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center">
                                    <XCircle className="w-5 h-5 text-rose-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 m-0">4. Uso Proibido</h2>
                            </div>
                            <div className="bg-gradient-to-br from-rose-50 to-white rounded-xl p-6 border border-rose-100">
                                <p className="text-slate-700 leading-relaxed mb-4 font-semibold">Você NÃO PODE usar o Nucleus para:</p>
                                <ul className="space-y-2 text-slate-700">
                                    <li className="flex items-start gap-2">
                                        <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                        <span>Enviar spam ou mensagens não solicitadas em massa</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                        <span>Violar leis de proteção de dados (LGPD, GDPR, etc.)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                        <span>Enviar conteúdo ilegal, ofensivo ou fraudulento</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                        <span>Tentar acessar ou comprometer a segurança da plataforma</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                        <span>Revender ou redistribuir o serviço sem autorização</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                        <span>Fazer engenharia reversa ou copiar funcionalidades</span>
                                    </li>
                                </ul>
                            </div>
                        </section>

                        {/* Seção 5 */}
                        <section className="mb-12">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-indigo-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 m-0">5. Pagamentos e Assinaturas</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-white rounded-xl p-6 border border-slate-200">
                                    <h3 className="text-lg font-bold text-slate-900 mb-3">5.1. Planos e Preços</h3>
                                    <p className="text-slate-700 leading-relaxed">
                                        Oferecemos diferentes planos de assinatura com funcionalidades variadas. Os preços estão disponíveis em nosso site e podem ser alterados mediante aviso prévio de 30 dias.
                                    </p>
                                </div>

                                <div className="bg-white rounded-xl p-6 border border-slate-200">
                                    <h3 className="text-lg font-bold text-slate-900 mb-3">5.2. Período Gratuito</h3>
                                    <p className="text-slate-700 leading-relaxed mb-3">
                                        Oferecemos um período de teste gratuito de 3 dias. Após este período, será necessário assinar um plano pago para continuar usando o serviço.
                                    </p>
                                    <p className="text-slate-700 leading-relaxed">
                                        Você pode cancelar a qualquer momento durante o período gratuito sem cobrança.
                                    </p>
                                </div>

                                <div className="bg-white rounded-xl p-6 border border-slate-200">
                                    <h3 className="text-lg font-bold text-slate-900 mb-3">5.3. Renovação e Cancelamento</h3>
                                    <p className="text-slate-700 leading-relaxed mb-3">
                                        As assinaturas são renovadas automaticamente. Você pode cancelar sua assinatura a qualquer momento através do painel de configurações.
                                    </p>
                                    <p className="text-slate-700 leading-relaxed">
                                        Não oferecemos reembolsos proporcionais para cancelamentos antecipados, mas você manterá acesso até o fim do período pago.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Seção 6 */}
                        <section className="mb-12">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                                    <AlertCircle className="w-5 h-5 text-indigo-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 m-0">6. Propriedade Intelectual</h2>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                                <p className="text-slate-700 leading-relaxed mb-4">
                                    Todo o conteúdo, design, código-fonte, marcas e outros elementos da plataforma Nucleus são propriedade exclusiva da empresa e estão protegidos por leis de direitos autorais e propriedade intelectual.
                                </p>
                                <p className="text-slate-700 leading-relaxed">
                                    Seus dados e conteúdos inseridos na plataforma permanecem sua propriedade. Concedemos a nós uma licença limitada para processar esses dados apenas para fornecer o serviço.
                                </p>
                            </div>
                        </section>

                        {/* Seção 7 */}
                        <section className="mb-12">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                                    <Scale className="w-5 h-5 text-indigo-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 m-0">7. Limitação de Responsabilidade</h2>
                            </div>
                            <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
                                <p className="text-slate-700 leading-relaxed mb-4">
                                    O Nucleus é fornecido "como está". Não garantimos que o serviço será ininterrupto ou livre de erros, embora nos esforcemos para manter alta disponibilidade.
                                </p>
                                <p className="text-slate-700 leading-relaxed mb-4">
                                    Não nos responsabilizamos por:
                                </p>
                                <ul className="space-y-2 text-slate-700">
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-600 mt-1">⚠</span>
                                        <span>Perdas de dados causadas por problemas de terceiros (ex: WhatsApp)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-600 mt-1">⚠</span>
                                        <span>Uso indevido da plataforma por você ou sua equipe</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-600 mt-1">⚠</span>
                                        <span>Violações de políticas de plataformas de terceiros</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-600 mt-1">⚠</span>
                                        <span>Danos indiretos ou consequenciais decorrentes do uso</span>
                                    </li>
                                </ul>
                            </div>
                        </section>

                        {/* Seção 8 */}
                        <section className="mb-12">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-indigo-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 m-0">8. Disposições Gerais</h2>
                            </div>
                            <div className="bg-white rounded-xl p-6 border border-slate-200">
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-2">Lei Aplicável</h3>
                                        <p className="text-slate-700">
                                            Estes termos são regidos pelas leis brasileiras. Qualquer disputa será resolvida no foro da comarca de São Paulo, SP.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-2">Divisibilidade</h3>
                                        <p className="text-slate-700">
                                            Se qualquer disposição destes termos for considerada inválida, as demais permanecerão em vigor.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-2">Contato</h3>
                                        <p className="text-slate-700">
                                            Para dúvidas sobre estes termos, entre em contato: <strong>juridico@nucleus.com.br</strong>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* CTA */}
                    <div className="mt-16 text-center">
                        <Link to="/">
                            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                Voltar para o site
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 py-8">
                <div className="container mx-auto px-6 text-center text-slate-500 text-sm">
                    <p>© 2024 Nucleus. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
};

export default TermosUso;
