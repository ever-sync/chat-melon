import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";

export default function SignUp() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // Step 1: Personal Data
    const [personalData, setPersonalData] = useState({
        fullName: "",
        email: "",
        password: "",
        phone: "",
        agreedToTerms: false,
    });

    // Step 2: Company Data
    const [companyData, setCompanyData] = useState({
        cnpj: "",
        legalName: "",
        fantasyName: "",
        companyEmail: "",
        companyPhone: "",
        postalCode: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
    });

    const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPersonalData({ ...personalData, [e.target.name]: e.target.value });
    };

    const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCompanyData({ ...companyData, [e.target.name]: e.target.value });
    };

    const searchCEP = async () => {
        if (companyData.postalCode.length !== 8) {
            toast.error("CEP deve ter 8 dígitos");
            return;
        }

        try {
            const response = await fetch(`https://viacep.com.br/ws/${companyData.postalCode}/json/`);
            const data = await response.json();

            if (data.erro) {
                toast.error("CEP não encontrado");
                return;
            }

            setCompanyData({
                ...companyData,
                street: data.logradouro || "",
                neighborhood: data.bairro || "",
                city: data.localidade || "",
                state: data.uf || "",
            });

            toast.success("Endereço encontrado!");
        } catch (error) {
            toast.error("Erro ao buscar CEP");
        }
    };

    const handleStep1Submit = async (e: React.FormEvent) => {
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
            // Create Supabase auth user
            const { data, error } = await supabase.auth.signUp({
                email: personalData.email,
                password: personalData.password,
                options: {
                    data: {
                        full_name: personalData.fullName,
                        phone: personalData.phone,
                    },
                },
            });

            if (error) throw error;

            if (data.user) {
                setUserId(data.user.id);
                toast.success("Conta criada! Agora complete os dados da empresa.");
                setCurrentStep(2);
            }
        } catch (error: any) {
            toast.error(error.message || "Erro ao criar conta");
        } finally {
            setLoading(false);
        }
    };

    const handleStep2Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!userId) {
                toast.error("Erro: usuário não encontrado");
                return;
            }

            // Validar CNPJ único antes de inserir
            if (companyData.cnpj) {
                const { data: existingCompany, error: checkError } = await supabase
                    .from("companies")
                    .select("id, name")
                    .eq("cnpj", companyData.cnpj)
                    .is("deleted_at", null)
                    .maybeSingle();

                if (checkError && checkError.code !== 'PGRST116') {
                    throw checkError;
                }

                if (existingCompany) {
                    toast.error(
                        `CNPJ já cadastrado! Este CNPJ já está sendo usado pela empresa "${existingCompany.name}". ` +
                        `Se você já possui uma conta, faça login. Caso contrário, entre em contato com o suporte.`,
                        { duration: 8000 }
                    );
                    setLoading(false);
                    return;
                }
            }

            // Calculate trial end date (3 days from now)
            const trialStartsAt = new Date();
            const trialEndsAt = new Date();
            trialEndsAt.setDate(trialEndsAt.getDate() + 3);

            // Create company
            const { data: company, error: companyError } = await supabase
                .from("companies")
                .insert({
                    name: companyData.fantasyName,
                    legal_name: companyData.legalName,
                    cnpj: companyData.cnpj,
                    email: companyData.companyEmail,
                    phone: companyData.companyPhone,
                    responsible_name: personalData.fullName,
                    responsible_phone: personalData.phone,
                    postal_code: companyData.postalCode,
                    street: companyData.street,
                    number: companyData.number,
                    complement: companyData.complement,
                    neighborhood: companyData.neighborhood,
                    city: companyData.city,
                    state: companyData.state,
                    status: "active",
                    is_active: true,
                    subscription_status: "trial",
                    trial_started_at: trialStartsAt.toISOString(),
                    trial_ends_at: trialEndsAt.toISOString(),
                    created_by: userId,
                })
                .select()
                .single();

            if (companyError) throw companyError;

            // Create company_users relationship
            const { error: companyUserError } = await supabase
                .from("company_users")
                .insert({
                    user_id: userId,
                    company_id: company.id,
                    is_default: true,
                });

            if (companyUserError) throw companyUserError;

            // Create company_members with admin role
            const { error: memberError } = await supabase
                .from("company_members")
                .insert({
                    user_id: userId,
                    company_id: company.id,
                    role: "admin",
                    display_name: personalData.fullName,
                    email: personalData.email,
                    is_active: true,
                });

            if (memberError) throw memberError;

            toast.success("Cadastro concluído! Você tem 3 dias de trial gratuito.");
            navigate("/dashboard");
        } catch (error: any) {
            console.error("Error:", error);

            // Tratamento específico para CNPJ duplicado
            if (error.message && error.message.includes('CNPJ já cadastrado')) {
                toast.error(
                    "CNPJ já cadastrado! Este CNPJ já está sendo usado por outra empresa. " +
                    "Se você já possui uma conta, faça login. Caso contrário, entre em contato com o suporte.",
                    { duration: 8000 }
                );
            } else if (error.code === '23505' && error.message.includes('unique_company_cnpj')) {
                // Constraint violation do PostgreSQL
                toast.error(
                    "CNPJ já cadastrado! Este CNPJ já está sendo usado por outra empresa.",
                    { duration: 8000 }
                );
            } else {
                toast.error(error.message || "Erro ao cadastrar empresa");
            }
        } finally {
            setLoading(false);
        }
    };

    const progressPercentage = (currentStep / 2) * 100;

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

                        {/* Progress Steps */}
                        <div className="flex items-center justify-center gap-4 mb-8">
                            <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-[#10B981]' : 'text-gray-600'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-[#10B981]' : 'bg-gray-700'}`}>
                                    {currentStep > 1 ? <CheckCircle2 className="w-5 h-5 text-white" /> : <span className="text-white text-sm">1</span>}
                                </div>
                                <span className="text-sm font-medium hidden md:inline">Dados Pessoais</span>
                            </div>
                            <div className="h-0.5 w-12 bg-gray-700"></div>
                            <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-[#10B981]' : 'text-gray-600'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-[#10B981]' : 'bg-gray-700'}`}>
                                    <span className="text-white text-sm">2</span>
                                </div>
                                <span className="text-sm font-medium hidden md:inline">Dados da Empresa</span>
                            </div>
                        </div>
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

                        {/* Step 1: Personal Data */}
                        {currentStep === 1 && (
                            <>
                                <h1 className="text-3xl font-bold text-white mb-2">Dados Pessoais</h1>
                                <p className="text-gray-400 mb-8">
                                    Preencha seus dados para criar sua conta
                                </p>

                                <form onSubmit={handleStep1Submit} className="space-y-5">
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
                                        className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-xl font-medium text-base"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Criando conta...
                                            </>
                                        ) : (
                                            <>
                                                Próximo
                                                <ArrowRight className="ml-2 h-5 w-5" />
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </>
                        )}

                        {/* Step 2: Company Data */}
                        {currentStep === 2 && (
                            <>
                                <h1 className="text-3xl font-bold text-white mb-2">Dados da Empresa</h1>
                                <p className="text-gray-400 mb-8">
                                    Agora preencha os dados da sua empresa
                                </p>

                                <form onSubmit={handleStep2Submit} className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="cnpj" className="text-gray-300 font-medium">
                                                CNPJ *
                                            </Label>
                                            <Input
                                                id="cnpj"
                                                name="cnpj"
                                                value={companyData.cnpj}
                                                onChange={handleCompanyChange}
                                                placeholder="00.000.000/0000-00"
                                                className="mt-2 h-12 rounded-xl bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-gray-500"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="legalName" className="text-gray-300 font-medium">
                                                Razão Social *
                                            </Label>
                                            <Input
                                                id="legalName"
                                                name="legalName"
                                                value={companyData.legalName}
                                                onChange={handleCompanyChange}
                                                className="mt-2 h-12 rounded-xl bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-gray-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="fantasyName" className="text-gray-300 font-medium">
                                            Nome Fantasia *
                                        </Label>
                                        <Input
                                            id="fantasyName"
                                            name="fantasyName"
                                            value={companyData.fantasyName}
                                            onChange={handleCompanyChange}
                                            className="mt-2 h-12 rounded-xl bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-gray-500"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="companyEmail" className="text-gray-300 font-medium">
                                                Email da Empresa *
                                            </Label>
                                            <Input
                                                id="companyEmail"
                                                name="companyEmail"
                                                type="email"
                                                value={companyData.companyEmail}
                                                onChange={handleCompanyChange}
                                                className="mt-2 h-12 rounded-xl bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-gray-500"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="companyPhone" className="text-gray-300 font-medium">
                                                Telefone
                                            </Label>
                                            <Input
                                                id="companyPhone"
                                                name="companyPhone"
                                                value={companyData.companyPhone}
                                                onChange={handleCompanyChange}
                                                placeholder="(00) 0000-0000"
                                                className="mt-2 h-12 rounded-xl bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-gray-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="col-span-2">
                                            <Label htmlFor="postalCode" className="text-gray-300 font-medium">
                                                CEP *
                                            </Label>
                                            <Input
                                                id="postalCode"
                                                name="postalCode"
                                                value={companyData.postalCode}
                                                onChange={handleCompanyChange}
                                                placeholder="00000-000"
                                                className="mt-2 h-12 rounded-xl bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-gray-500"
                                                maxLength={8}
                                                required
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={searchCEP}
                                                className="w-full h-12 rounded-xl"
                                            >
                                                Buscar
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="col-span-2">
                                            <Label htmlFor="street" className="text-gray-300 font-medium">
                                                Rua *
                                            </Label>
                                            <Input
                                                id="street"
                                                name="street"
                                                value={companyData.street}
                                                onChange={handleCompanyChange}
                                                className="mt-2 h-12 rounded-xl bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-gray-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="number" className="text-gray-300 font-medium">
                                                Número *
                                            </Label>
                                            <Input
                                                id="number"
                                                name="number"
                                                value={companyData.number}
                                                onChange={handleCompanyChange}
                                                className="mt-2 h-12 rounded-xl bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-gray-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <Label htmlFor="complement" className="text-gray-300 font-medium">
                                                Complemento
                                            </Label>
                                            <Input
                                                id="complement"
                                                name="complement"
                                                value={companyData.complement}
                                                onChange={handleCompanyChange}
                                                className="mt-2 h-12 rounded-xl bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-gray-500"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="neighborhood" className="text-gray-300 font-medium">
                                                Bairro *
                                            </Label>
                                            <Input
                                                id="neighborhood"
                                                name="neighborhood"
                                                value={companyData.neighborhood}
                                                onChange={handleCompanyChange}
                                                className="mt-2 h-12 rounded-xl bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-gray-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="city" className="text-gray-300 font-medium">
                                                Cidade *
                                            </Label>
                                            <Input
                                                id="city"
                                                name="city"
                                                value={companyData.city}
                                                onChange={handleCompanyChange}
                                                className="mt-2 h-12 rounded-xl bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-gray-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="state" className="text-gray-300 font-medium">
                                            Estado *
                                        </Label>
                                        <Input
                                            id="state"
                                            name="state"
                                            value={companyData.state}
                                            onChange={handleCompanyChange}
                                            maxLength={2}
                                            placeholder="SP"
                                            className="mt-2 h-12 rounded-xl bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-gray-500"
                                            required
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setCurrentStep(1)}
                                            className="flex-1 h-12 rounded-xl"
                                            disabled={loading}
                                        >
                                            <ArrowLeft className="mr-2 h-5 w-5" />
                                            Voltar
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 h-12 bg-black hover:bg-gray-800 text-white rounded-xl font-medium"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    Finalizando...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="mr-2 h-5 w-5" />
                                                    Começar Trial Gratuito
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
