import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const PrivacyPolicy = () => {
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
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8">Política de Privacidade</h1>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-6">
                    <p>Última atualização: {new Date().getFullYear()}</p>

                    <p>
                        A sua privacidade é importante para nós. É política do Clara respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no site Clara, e outros sites que possuímos e operamos.
                    </p>

                    <h3 className="text-2xl font-bold text-slate-800 mt-8">1. Informações que coletamos</h3>
                    <p>
                        Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento. Também informamos por que estamos coletando e como será usado.
                    </p>

                    <h3 className="text-2xl font-bold text-slate-800 mt-8">2. Como usamos suas informações</h3>
                    <p>
                        Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Quando armazenamos dados, protegemos dentro de meios comercialmente aceitáveis para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados.
                    </p>

                    <h3 className="text-2xl font-bold text-slate-800 mt-8">3. Compartilhamento de dados</h3>
                    <p>
                        Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei.
                    </p>

                    <h3 className="text-2xl font-bold text-slate-800 mt-8">4. Cookies</h3>
                    <p>
                        O nosso site pode ter links para sites externos que não são operados por nós. Esteja ciente de que não temos controle sobre o conteúdo e práticas desses sites e não podemos aceitar responsabilidade por suas respectivas políticas de privacidade.
                    </p>

                    <h3 className="text-2xl font-bold text-slate-800 mt-8">5. Compromisso do Usuário</h3>
                    <p>
                        O usuário se compromete a fazer uso adequado dos conteúdos e da informação que o Clara oferece no site e com caráter enunciativo, mas não limitativo:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>A) Não se envolver em atividades que sejam ilegais ou contrárias à boa fé a à ordem pública;</li>
                        <li>B) Não difundir propaganda ou conteúdo de natureza racista, xenofóbica, ou azar, qualquer tipo de pornografia ilegal, de apologia ao terrorismo ou contra os direitos humanos;</li>
                        <li>C) Não causar danos aos sistemas físicos (hardwares) e lógicos (softwares) do Clara, de seus fornecedores ou terceiros, para introduzir ou disseminar vírus informáticos ou quaisquer outros sistemas de hardware ou software que sejam capazes de causar danos anteriormente mencionados.</li>
                    </ul>

                    <h3 className="text-2xl font-bold text-slate-800 mt-8">Mais informações</h3>
                    <p>
                        Esperemos que esteja esclarecido e, como mencionado anteriormente, se houver algo que você não tem certeza se precisa ou não, geralmente é mais seguro deixar os cookies ativados, caso interaja com um dos recursos que você usa em nosso site.
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
                                <Link to="/privacy-policy" className="hover:text-indigo-600 font-bold text-indigo-600">Privacy policy</Link>
                                <Link to="/terms-of-service" className="hover:text-indigo-600">Terms and condition</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PrivacyPolicy;
