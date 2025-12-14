import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100">
            {/* Background Dot Pattern */}
            <div className="fixed inset-0 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none -z-10"></div>

            {/* Header */}
            <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="bg-indigo-600 rounded-lg p-1.5 flex items-center justify-center">
                            <span className="text-white font-bold text-xl tracking-tighter leading-none">UD</span>
                        </div>
                        <span className="text-2xl font-bold text-slate-900 tracking-tight">CLARA</span>
                    </Link>

                    <nav className="hidden md:flex items-center bg-gray-50/80 px-2 py-1.5 rounded-full border border-gray-100 shadow-sm">
                        <Link to="/" className="px-5 py-2 text-sm font-medium text-slate-500 hover:text-indigo-600 rounded-full transition-all">
                            Home
                        </Link>
                        <Link to="/#features" className="px-5 py-2 text-sm font-medium text-slate-500 hover:text-indigo-600 rounded-full transition-all">
                            Features
                        </Link>
                        <Link to="/#pricing" className="px-5 py-2 text-sm font-medium text-slate-500 hover:text-indigo-600 rounded-full transition-all">
                            Pricing
                        </Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        <Link to="/auth">
                            <Button variant="ghost" className="font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50">
                                Log In
                            </Button>
                        </Link>
                        <Link to="/signup">
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl px-6 shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02]">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="pt-32 pb-20 container mx-auto px-6 max-w-4xl">
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8">Termos de Serviço</h1>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-6">
                    <p>Última atualização: {new Date().getFullYear()}</p>

                    <h3 className="text-2xl font-bold text-slate-800 mt-8">1. Termos</h3>
                    <p>
                        Ao acessar ao site Clara, concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis ​​e concorda que é responsável pelo cumprimento de todas as leis locais aplicáveis. Se você não concordar com algum desses termos, está proibido de usar ou acessar este site. Os materiais contidos neste site são protegidos pelas leis de direitos autorais e marcas comerciais aplicáveis.
                    </p>

                    <h3 className="text-2xl font-bold text-slate-800 mt-8">2. Uso de Licença</h3>
                    <p>
                        É concedida permissão para baixar temporariamente uma cópia dos materiais (informações ou software) no site Clara , apenas para visualização transitória pessoal e não comercial. Esta é a concessão de uma licença, não uma transferência de título e, sob esta licença, você não pode:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>modificar ou copiar os materiais;</li>
                        <li>usar os materiais para qualquer finalidade comercial ou para exibição pública (comercial ou não comercial);</li>
                        <li>tentar descompilar ou fazer engenharia reversa de qualquer software contido no site Clara;</li>
                        <li>remover quaisquer direitos autorais ou outras notações de propriedade dos materiais; ou</li>
                        <li>transferir os materiais para outra pessoa ou 'espelhe' os materiais em qualquer outro servidor.</li>
                    </ul>
                    <p>
                        Esta licença será automaticamente rescindida se você violar alguma dessas restrições e poderá ser rescindida por Clara a qualquer momento. Ao encerrar a visualização desses materiais ou após o término desta licença, você deve apagar todos os materiais baixados em sua posse, seja em formato eletrónico ou impresso.
                    </p>

                    <h3 className="text-2xl font-bold text-slate-800 mt-8">3. Isenção de responsabilidade</h3>
                    <p>
                        Os materiais no site da Clara são fornecidos 'como estão'. Clara não oferece garantias, expressas ou implícitas, e, por este meio, isenta e nega todas as outras garantias, incluindo, sem limitação, garantias implícitas ou condições de comercialização, adequação a um fim específico ou não violação de propriedade intelectual ou outra violação de direitos.
                    </p>
                    <p>
                        Além disso, o Clara não garante ou faz qualquer representação relativa à precisão, aos resultados prováveis ​​ou à confiabilidade do uso dos materiais em seu site ou de outra forma relacionado a esses materiais ou em sites vinculados a este site.
                    </p>

                    <h3 className="text-2xl font-bold text-slate-800 mt-8">4. Limitações</h3>
                    <p>
                        Em nenhum caso o Clara ou seus fornecedores serão responsáveis ​​por quaisquer danos (incluindo, sem limitação, danos por perda de dados ou lucro ou devido a interrupção dos negócios) decorrentes do uso ou da incapacidade de usar os materiais em Clara, mesmo que Clara ou um representante autorizado da Clara tenha sido notificado oralmente ou por escrito da possibilidade de tais danos. Como algumas jurisdições não permitem limitações em garantias implícitas, ou limitações de responsabilidade por danos conseqüentes ou incidentais, essas limitações podem não se aplicar a você.
                    </p>

                    <h3 className="text-2xl font-bold text-slate-800 mt-8">5. Precisão dos materiais</h3>
                    <p>
                        Os materiais exibidos no site da Clara podem incluir erros técnicos, tipográficos ou fotográficos. Clara não garante que qualquer material em seu site seja preciso, completo ou atual. Clara pode fazer alterações nos materiais contidos em seu site a qualquer momento, sem aviso prévio. No entanto, Clara não se compromete a atualizar os materiais.
                    </p>

                    <h3 className="text-2xl font-bold text-slate-800 mt-8">6. Links</h3>
                    <p>
                        O Clara não analisou todos os sites vinculados ao seu site e não é responsável pelo conteúdo de nenhum site vinculado. A inclusão de qualquer link não implica endosso por Clara do site. O uso de qualquer site vinculado é por conta e risco do usuário.
                    </p>

                    <h3 className="text-2xl font-bold text-slate-800 mt-8">Modificações</h3>
                    <p>
                        O Clara pode revisar estes termos de serviço do site a qualquer momento, sem aviso prévio. Ao usar este site, você concorda em ficar vinculado à versão atual desses termos de serviço.
                    </p>

                    <h3 className="text-2xl font-bold text-slate-800 mt-8">Lei aplicável</h3>
                    <p>
                        Estes termos e condições são regidos e interpretados de acordo com as leis do Clara e você se submete irrevogavelmente à jurisdição exclusiva dos tribunais naquele estado ou localidade.
                    </p>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white pt-24 pb-8 overflow-hidden relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[180%] h-[1000px] bg-white/5 rounded-[100%] blur-3xl pointer-events-none -translate-y-1/2"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="bg-white rounded-3xl p-12 text-slate-900 shadow-2xl">
                        <div className="grid md:grid-cols-4 gap-12 mb-16">
                            <div className="col-span-1 md:col-span-1">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="bg-indigo-600 rounded-lg p-1.5 flex items-center justify-center">
                                        <span className="text-white font-bold text-xl tracking-tighter leading-none">UD</span>
                                    </div>
                                    <span className="text-2xl font-bold text-slate-900 tracking-tight">CLARA</span>
                                </div>
                                <h3 className="text-3xl font-bold text-slate-400 leading-tight">
                                    Every Customer Insights, <span className="text-slate-900">Intelligently Handled</span>
                                </h3>
                            </div>

                            <div>
                                <h4 className="font-bold mb-6">Company</h4>
                                <ul className="space-y-4 text-slate-500">
                                    <li><Link to="/" className="hover:text-indigo-600">Home</Link></li>
                                    <li><Link to="/auth" className="hover:text-indigo-600">Login</Link></li>
                                    <li><Link to="/signup" className="hover:text-indigo-600">Sign Up</Link></li>
                                </ul>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center text-sm text-slate-400">
                            <p>Copyright {new Date().getFullYear()}, All right reserved by Clara</p>
                            <div className="flex gap-6">
                                <Link to="/privacy-policy" className="hover:text-indigo-600">Privacy policy</Link>
                                <Link to="/terms-of-service" className="hover:text-indigo-600 font-bold text-indigo-600">Terms and condition</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default TermsOfService;
