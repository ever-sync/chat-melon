import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";

export default function SignUp() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Personal Data
    const [personalData, setPersonalData] = useState({
        fullName: "",
        email: "",
        password: "",
        phone: "",
        agreedToTerms: false,
    });

    const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPersonalData({ ...personalData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!personalData.agreedToTerms) {
            toast.error("Você precisa concordar com os Termos e Condições");
            return;
        }

        if (personalData.password.length < 6) {
            toast.error("A senha deve ter no mínimo 6 caracteres");
            return;
        }

        setLoading(true);

        try {
            // Create Supabase auth user (email confirmation required)
            const { data, error } = await supabase.auth.signUp({
                email: personalData.email,
                password: personalData.password,
                options: {
                    data: {
                        full_name: personalData.fullName,
                        phone: personalData.phone,
                    },
                    emailRedirectTo: `${window.location.origin}/dashboard`,
                },
            });

            if (error) throw error;

            if (data.user) {
                toast.success(
                    "Conta criada! Verifique seu e-mail para confirmar o cadastro.",
                    { duration: 8000 }
                );
                navigate("/auth");
            }
        } catch (error: any) {
            toast.error(error.message || "Erro ao criar conta");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
            <div className="w-full max-w-6xl bg-[#111111] rounded-3xl shadow-2xl overflow-hidden flex border border-[#1F1F1F]">
                {/* Left Side - Branding */}
                <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0A0A0A] via-[#0F0F0F] to-[#0A0A0A] p-12 flex-col justify-between relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#10B981]/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#10B981]/5 rounded-full blur-3xl"></div>

                    {/* Logo */}
                    <div className="relative z-10">
                        <Link to="/" className="inline-flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-[#10B981] shadow-lg shadow-[#10B981]/20">
                                <span className="text-3xl">🦎</span>
                            </div>
                            <span className="text-2xl font-bold text-white">CamalaChat</span>
                        </Link>
                    </div>

                    {/* Center Content */}
                    <div className="relative z-10 text-center">
                        <h2 className="text-4xl font-bold text-white mb-4">
                            Comece Gratuitamente
                        </h2>
                        <p className="text-gray-400 text-lg mb-6">
                            Crie sua conta e ganhe 3 dias de trial
                        </p>
                        <p className="text-gray-500 text-sm">
                            Após confirmar seu e-mail, você será guiado<br />
                            para configurar sua empresa e WhatsApp
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="relative z-10 text-center text-gray-500 text-sm">
                        © 2025 CamalaChat. Todos os direitos reservados.
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center bg-[#111111]">
                    <div className="max-w-md mx-auto w-full">
                        {/* Mobile Logo */}
                        <div className="lg:hidden mb-8 text-center">
                            <div className="inline-flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-[#10B981]">
                                    <span className="text-2xl">🦎</span>
                                </div>
                                <span className="text-xl font-bold text-white">CamalaChat</span>
                            </div>
                        </div>

                        {/* Back to Login Link */}
                        <Link to="/auth" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="text-sm">Voltar para Login</span>
                        </Link>

                        <h1 className="text-3xl font-bold text-white mb-2">Criar Conta</h1>
                        <p className="text-gray-400 mb-8">
                            Preencha seus dados pessoais para começar
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <Label htmlFor="fullName" className="text-gray-300 font-medium">
                                            Nome Completo *
                                        </Label>
                                        <Input
                                            id="fullName"
                                            name="fullName"
                                            value={personalData.fullName}
                                            onChange={handlePersonalChange}
                                            placeholder="João Silva"
                                            className="mt-2 h-12 rounded-xl bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-gray-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="email" className="text-gray-300 font-medium">
                                            Email *
                                        </Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={personalData.email}
                                            onChange={handlePersonalChange}
                                            placeholder="joao@empresa.com"
                                            className="mt-2 h-12 rounded-xl bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-gray-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="password" className="text-gray-300 font-medium">
                                            Senha *
                                        </Label>
                                        <div className="relative mt-2">
                                            <Input
                                                id="password"
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                value={personalData.password}
                                                onChange={handlePersonalChange}
                                                placeholder="Mínimo 6 caracteres"
                                                className="h-12 rounded-xl pr-12"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="phone" className="text-gray-300 font-medium">
                                            Telefone *
                                        </Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            value={personalData.phone}
                                            onChange={handlePersonalChange}
                                            placeholder="(00) 00000-0000"
                                            className="mt-2 h-12 rounded-xl bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-gray-500"
                                            required
                                        />
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Checkbox
                                            id="terms"
                                            checked={personalData.agreedToTerms}
                                            onCheckedChange={(checked) =>
                                                setPersonalData({ ...personalData, agreedToTerms: checked as boolean })
                                            }
                                            className="mt-1 border-[#2A2A2A]"
                                        />
                                        <label htmlFor="terms" className="text-sm text-gray-400 leading-relaxed cursor-pointer">
                                            Eu concordo com os{" "}
                                            <Link to="/terms" className="text-[#10B981] hover:text-[#0EA574] underline">
                                                Termos & Condições
                                            </Link>
                                        </label>
                                    </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 bg-[#10B981] hover:bg-[#0EA574] text-white rounded-xl font-medium text-base"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Criando conta...
                                    </>
                                ) : (
                                    <>
                                        Criar Conta
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
