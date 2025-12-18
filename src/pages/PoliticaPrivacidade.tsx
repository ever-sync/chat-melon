import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Lock, Eye, FileText, Users, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const PoliticaPrivacidade = () => {
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
                            <Shield className="w-8 h-8 text-indigo-600" />
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold mb-4 text-slate-900">
                            Política de Privacidade
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
                                <h2 className="text-2xl font-bold text-slate-900 m-0">1. Introdução</h2>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                                <p className="text-slate-700 leading-relaxed mb-4">
                                    A Nucleus ("nós", "nosso" ou "nossa") está comprometida em proteger a privacidade e segurança dos dados pessoais de nossos usuários. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações ao utilizar nossa plataforma de CRM integrado com IA.
                                </p>
                                <p className="text-slate-700 leading-relaxed m-0">
                                    Ao utilizar o Nucleus, você concorda com as práticas descritas nesta política.
                                </p>
                            </div>
                        </section>

                        {/* Seção 2 */}
                        <section className="mb-12">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                                    <Eye className="w-5 h-5 text-indigo-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 m-0">2. Informações que Coletamos</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-white rounded-xl p-6 border border-slate-200">
                                    <h3 className="text-lg font-bold text-slate-900 mb-3">2.1. Informações Fornecidas por Você</h3>
                                    <ul className="space-y-2 text-slate-700">
                                        <li className="flex items-start gap-2">
                                            <span className="text-indigo-600 mt-1">•</span>
                                            <span>Dados de cadastro (nome, e-mail, telefone, empresa)</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-indigo-600 mt-1">•</span>
                                            <span>Informações de contatos e leads inseridos na plataforma</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-indigo-600 mt-1">•</span>
                                            <span>Conversas e interações registradas no sistema</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-indigo-600 mt-1">•</span>
                                            <span>Documentos e arquivos carregados</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="bg-white rounded-xl p-6 border border-slate-200">
                                    <h3 className="text-lg font-bold text-slate-900 mb-3">2.2. Informações Coletadas Automaticamente</h3>
                                    <ul className="space-y-2 text-slate-700">
                                        <li className="flex items-start gap-2">
                                            <span className="text-indigo-600 mt-1">•</span>
                                            <span>Dados de uso da plataforma (páginas acessadas, recursos utilizados)</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-indigo-600 mt-1">•</span>
                                            <span>Informações técnicas (endereço IP, navegador, sistema operacional)</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-indigo-600 mt-1">•</span>
                                            <span>Cookies e tecnologias similares</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Seção 3 */}
                        <section className="mb-12">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                                    <Users className="w-5 h-5 text-indigo-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 m-0">3. Como Usamos suas Informações</h2>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                                <p className="text-slate-700 leading-relaxed mb-4">Utilizamos suas informações para:</p>
                                <ul className="space-y-3 text-slate-700">
                                    <li className="flex items-start gap-2">
                                        <span className="text-indigo-600 mt-1 font-bold">→</span>
                                        <span>Fornecer, operar e melhorar nossos serviços</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-indigo-600 mt-1 font-bold">→</span>
                                        <span>Processar transações e enviar notificações relacionadas</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-indigo-600 mt-1 font-bold">→</span>
                                        <span>Treinar e melhorar nossos modelos de IA (sempre de forma anônima e agregada)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-indigo-600 mt-1 font-bold">→</span>
                                        <span>Enviar comunicações importantes sobre o serviço</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-indigo-600 mt-1 font-bold">→</span>
                                        <span>Garantir a segurança e prevenir fraudes</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-indigo-600 mt-1 font-bold">→</span>
                                        <span>Cumprir obrigações legais</span>
                                    </li>
                                </ul>
                            </div>
                        </section>

                        {/* Seção 4 */}
                        <section className="mb-12">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                                    <Lock className="w-5 h-5 text-indigo-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 m-0">4. Segurança dos Dados</h2>
                            </div>
                            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-6 border border-indigo-100">
                                <p className="text-slate-700 leading-relaxed mb-4">
                                    Implementamos medidas técnicas e organizacionais apropriadas para proteger seus dados:
                                </p>
                                <ul className="space-y-2 text-slate-700">
                                    <li className="flex items-start gap-2">
                                        <Check className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                                        <span>Criptografia end-to-end para dados em trânsito e em repouso</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                                        <span>Autenticação de dois fatores disponível</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                                        <span>Backups regulares e redundância de dados</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                                        <span>Controles de acesso rigorosos</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                                        <span>Monitoramento contínuo de segurança</span>
                                    </li>
                                </ul>
                            </div>
                        </section>

                        {/* Seção 5 */}
                        <section className="mb-12">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-indigo-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 m-0">5. Seus Direitos</h2>
                            </div>
                            <div className="bg-white rounded-xl p-6 border border-slate-200">
                                <p className="text-slate-700 leading-relaxed mb-4">
                                    De acordo com a LGPD (Lei Geral de Proteção de Dados), você tem direito a:
                                </p>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-slate-50 rounded-lg p-4">
                                        <p className="font-semibold text-slate-900 mb-1">Acesso</p>
                                        <p className="text-sm text-slate-600">Solicitar cópia dos seus dados</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-4">
                                        <p className="font-semibold text-slate-900 mb-1">Correção</p>
                                        <p className="text-sm text-slate-600">Atualizar dados incompletos ou incorretos</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-4">
                                        <p className="font-semibold text-slate-900 mb-1">Exclusão</p>
                                        <p className="text-sm text-slate-600">Solicitar a remoção dos seus dados</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-4">
                                        <p className="font-semibold text-slate-900 mb-1">Portabilidade</p>
                                        <p className="text-sm text-slate-600">Receber seus dados em formato estruturado</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Seção 6 */}
                        <section className="mb-12">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                                    <Mail className="w-5 h-5 text-indigo-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 m-0">6. Contato</h2>
                            </div>
                            <div className="bg-indigo-900 text-white rounded-xl p-8">
                                <p className="text-indigo-100 mb-4">
                                    Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato conosco:
                                </p>
                                <div className="space-y-2">
                                    <p className="text-white">
                                        <strong>E-mail:</strong> privacidade@nucleus.com.br
                                    </p>
                                    <p className="text-white">
                                        <strong>Encarregado de Dados (DPO):</strong> dpo@nucleus.com.br
                                    </p>
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

const Check = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

export default PoliticaPrivacidade;
