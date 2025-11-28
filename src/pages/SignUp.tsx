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
            toast.error(error.message || "Erro ao cadastrar empresa");
        } finally {
            setLoading(false);
        }
    };

    const progressPercentage = (currentStep / 2) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex">
                {/* Left Side - Image Placeholder */}
                <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 p-12 items-center justify-center relative">
                    <div className="absolute top-8 left-8">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                    </div>
                    <Link to="/auth" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-8">
                        <ArrowLeft className="h-5 w-5" />
                        <span>Voltar para Login</span>
                    </Link>

                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">
                                Passo {currentStep} de 2
                            </span>
                            <span className="text-sm text-gray-500">{progressPercentage}%</span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                    </div>

                    <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
                        {/* Step 1: Personal Data */}
                        {currentStep === 1 && (
                            <>
                                <h1 className="text-4xl font-bold text-gray-900 mb-2">Dados Pessoais</h1>
                                <p className="text-gray-600 mb-8">
                                    Preencha seus dados para criar sua conta
                                </p>

                                <form onSubmit={handleStep1Submit} className="space-y-6">
                                    <div>
                                        <Label htmlFor="fullName" className="text-gray-700 font-medium">
                                            Nome Completo *
                                        </Label>
                                        <Input
                                            id="fullName"
                                            name="fullName"
                                            value={personalData.fullName}
                                            onChange={handlePersonalChange}
                                            placeholder="João Silva"
                                            className="mt-2 h-12 rounded-xl"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="email" className="text-gray-700 font-medium">
                                            Email *
                                        </Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={personalData.email}
                                            onChange={handlePersonalChange}
                                            placeholder="joao@empresa.com"
                                            className="mt-2 h-12 rounded-xl"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="password" className="text-gray-700 font-medium">
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
                                        <Label htmlFor="phone" className="text-gray-700 font-medium">
                                            Telefone *
                                        </Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            value={personalData.phone}
                                            onChange={handlePersonalChange}
                                            placeholder="(00) 00000-0000"
                                            className="mt-2 h-12 rounded-xl"
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
                                            className="mt-1"
                                        />
                                        <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                                            Eu concordo com os{" "}
                                            <Link to="/terms" className="text-purple-600 hover:text-purple-700 underline">
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
                                <h1 className="text-4xl font-bold text-gray-900 mb-2">Dados da Empresa</h1>
                                <p className="text-gray-600 mb-8">
                                    Agora preencha os dados da sua empresa
                                </p>

                                <form onSubmit={handleStep2Submit} className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="cnpj" className="text-gray-700 font-medium">
                                                CNPJ *
                                            </Label>
                                            <Input
                                                id="cnpj"
                                                name="cnpj"
                                                value={companyData.cnpj}
                                                onChange={handleCompanyChange}
                                                placeholder="00.000.000/0000-00"
                                                className="mt-2 h-12 rounded-xl"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="legalName" className="text-gray-700 font-medium">
                                                Razão Social *
                                            </Label>
                                            <Input
                                                id="legalName"
                                                name="legalName"
                                                value={companyData.legalName}
                                                onChange={handleCompanyChange}
                                                className="mt-2 h-12 rounded-xl"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="fantasyName" className="text-gray-700 font-medium">
                                            Nome Fantasia *
                                        </Label>
                                        <Input
                                            id="fantasyName"
                                            name="fantasyName"
                                            value={companyData.fantasyName}
                                            onChange={handleCompanyChange}
                                            className="mt-2 h-12 rounded-xl"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="companyEmail" className="text-gray-700 font-medium">
                                                Email da Empresa *
                                            </Label>
                                            <Input
                                                id="companyEmail"
                                                name="companyEmail"
                                                type="email"
                                                value={companyData.companyEmail}
                                                onChange={handleCompanyChange}
                                                className="mt-2 h-12 rounded-xl"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="companyPhone" className="text-gray-700 font-medium">
                                                Telefone
                                            </Label>
                                            <Input
                                                id="companyPhone"
                                                name="companyPhone"
                                                value={companyData.companyPhone}
                                                onChange={handleCompanyChange}
                                                placeholder="(00) 0000-0000"
                                                className="mt-2 h-12 rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="col-span-2">
                                            <Label htmlFor="postalCode" className="text-gray-700 font-medium">
                                                CEP *
                                            </Label>
                                            <Input
                                                id="postalCode"
                                                name="postalCode"
                                                value={companyData.postalCode}
                                                onChange={handleCompanyChange}
                                                placeholder="00000-000"
                                                className="mt-2 h-12 rounded-xl"
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
                                            <Label htmlFor="street" className="text-gray-700 font-medium">
                                                Rua *
                                            </Label>
                                            <Input
                                                id="street"
                                                name="street"
                                                value={companyData.street}
                                                onChange={handleCompanyChange}
                                                className="mt-2 h-12 rounded-xl"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="number" className="text-gray-700 font-medium">
                                                Número *
                                            </Label>
                                            <Input
                                                id="number"
                                                name="number"
                                                value={companyData.number}
                                                onChange={handleCompanyChange}
                                                className="mt-2 h-12 rounded-xl"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <Label htmlFor="complement" className="text-gray-700 font-medium">
                                                Complemento
                                            </Label>
                                            <Input
                                                id="complement"
                                                name="complement"
                                                value={companyData.complement}
                                                onChange={handleCompanyChange}
                                                className="mt-2 h-12 rounded-xl"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="neighborhood" className="text-gray-700 font-medium">
                                                Bairro *
                                            </Label>
                                            <Input
                                                id="neighborhood"
                                                name="neighborhood"
                                                value={companyData.neighborhood}
                                                onChange={handleCompanyChange}
                                                className="mt-2 h-12 rounded-xl"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="city" className="text-gray-700 font-medium">
                                                Cidade *
                                            </Label>
                                            <Input
                                                id="city"
                                                name="city"
                                                value={companyData.city}
                                                onChange={handleCompanyChange}
                                                className="mt-2 h-12 rounded-xl"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="state" className="text-gray-700 font-medium">
                                            Estado *
                                        </Label>
                                        <Input
                                            id="state"
                                            name="state"
                                            value={companyData.state}
                                            onChange={handleCompanyChange}
                                            maxLength={2}
                                            placeholder="SP"
                                            className="mt-2 h-12 rounded-xl"
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
