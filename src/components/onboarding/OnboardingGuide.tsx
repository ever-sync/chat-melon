import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, Smartphone, CheckCircle, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useCompany } from "@/contexts/CompanyContext";

interface OnboardingGuideProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function OnboardingGuide({ isOpen, onComplete }: OnboardingGuideProps) {
  const navigate = useNavigate();
  const { refreshCompanies } = useCompany();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Company Data
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

  // Step 2: WhatsApp Data (Evolution API)
  const [whatsappData, setWhatsappData] = useState({
    apiUrl: "",
    apiKey: "",
    instanceName: "",
  });

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompanyData({ ...companyData, [e.target.name]: e.target.value });
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsappData({ ...whatsappData, [e.target.name]: e.target.value });
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
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Usuário não autenticado");
        navigate("/auth");
        return;
      }

      // Validar CNPJ único
      if (companyData.cnpj) {
        const { data: existingCompany } = await supabase
          .from("companies")
          .select("id, name")
          .eq("cnpj", companyData.cnpj)
          .is("deleted_at", null)
          .maybeSingle();

        if (existingCompany) {
          toast.error(
            `CNPJ já cadastrado! Este CNPJ já está sendo usado pela empresa "${existingCompany.name}".`,
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
          created_by: user.id,
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Create company_users relationship
      const { error: companyUserError } = await supabase
        .from("company_users")
        .insert({
          user_id: user.id,
          company_id: company.id,
          is_default: true,
        });

      if (companyUserError) throw companyUserError;

      // Create company_members with admin role
      const { error: memberError } = await supabase
        .from("company_members")
        .insert({
          user_id: user.id,
          company_id: company.id,
          role: "admin",
          display_name: user.user_metadata?.full_name || user.email,
          email: user.email,
          is_active: true,
        });

      if (memberError) throw memberError;

      // Save company ID for next step
      localStorage.setItem("onboardingCompanyId", company.id);

      toast.success("Empresa criada com sucesso! Agora vamos conectar seu WhatsApp.");
      setCurrentStep(2);
    } catch (error: any) {
      console.error("Error:", error);

      if (error.message && error.message.includes("CNPJ já cadastrado")) {
        toast.error("CNPJ já cadastrado!", { duration: 8000 });
      } else {
        toast.error(error.message || "Erro ao cadastrar empresa");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const companyId = localStorage.getItem("onboardingCompanyId");

      if (!companyId) {
        toast.error("Erro: empresa não encontrada");
        return;
      }

      // Update company with Evolution API config
      const { error } = await supabase
        .from("companies")
        .update({
          evolution_api_url: whatsappData.apiUrl,
          evolution_api_key: whatsappData.apiKey,
          evolution_instance_name: whatsappData.instanceName,
        })
        .eq("id", companyId);

      if (error) throw error;

      localStorage.removeItem("onboardingCompanyId");
      await refreshCompanies();

      toast.success("WhatsApp configurado! Redirecionando para o dashboard...");
      setCurrentStep(3);

      // Wait 2 seconds to show success, then complete
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Erro ao configurar WhatsApp");
    } finally {
      setLoading(false);
    }
  };

  const handleSkipWhatsApp = async () => {
    setLoading(true);

    try {
      localStorage.removeItem("onboardingCompanyId");
      await refreshCompanies();

      toast.success("Você pode configurar o WhatsApp depois em Configurações");
      setCurrentStep(3);

      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Erro ao finalizar");
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = (currentStep / 3) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {currentStep === 1 && <Building2 className="w-6 h-6 text-green-600" />}
            {currentStep === 2 && <Smartphone className="w-6 h-6 text-blue-600" />}
            {currentStep === 3 && <CheckCircle className="w-6 h-6 text-green-600" />}
            {currentStep === 1 && "Configurar Empresa"}
            {currentStep === 2 && "Conectar WhatsApp"}
            {currentStep === 3 && "Tudo Pronto!"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-sm text-gray-500">
              <span className={currentStep >= 1 ? "text-green-600 font-medium" : ""}>
                1. Empresa
              </span>
              <span className={currentStep >= 2 ? "text-blue-600 font-medium" : ""}>
                2. WhatsApp
              </span>
              <span className={currentStep >= 3 ? "text-green-600 font-medium" : ""}>
                3. Concluído
              </span>
            </div>
          </div>

          {/* Step 1: Company */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <p className="text-gray-600">
                Para usar o app, você precisa criar uma empresa. Preencha os dados abaixo:
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    name="cnpj"
                    value={companyData.cnpj}
                    onChange={handleCompanyChange}
                    placeholder="00.000.000/0000-00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="legalName">Razão Social *</Label>
                  <Input
                    id="legalName"
                    name="legalName"
                    value={companyData.legalName}
                    onChange={handleCompanyChange}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="fantasyName">Nome Fantasia *</Label>
                <Input
                  id="fantasyName"
                  name="fantasyName"
                  value={companyData.fantasyName}
                  onChange={handleCompanyChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyEmail">Email da Empresa *</Label>
                  <Input
                    id="companyEmail"
                    name="companyEmail"
                    type="email"
                    value={companyData.companyEmail}
                    onChange={handleCompanyChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="companyPhone">Telefone</Label>
                  <Input
                    id="companyPhone"
                    name="companyPhone"
                    value={companyData.companyPhone}
                    onChange={handleCompanyChange}
                    placeholder="(00) 0000-0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="postalCode">CEP *</Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    value={companyData.postalCode}
                    onChange={handleCompanyChange}
                    placeholder="00000-000"
                    maxLength={8}
                    required
                  />
                </div>
                <div className="flex items-end">
                  <Button type="button" variant="outline" onClick={searchCEP} className="w-full">
                    Buscar CEP
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="street">Rua *</Label>
                  <Input
                    id="street"
                    name="street"
                    value={companyData.street}
                    onChange={handleCompanyChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="number">Número *</Label>
                  <Input
                    id="number"
                    name="number"
                    value={companyData.number}
                    onChange={handleCompanyChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    name="complement"
                    value={companyData.complement}
                    onChange={handleCompanyChange}
                  />
                </div>
                <div>
                  <Label htmlFor="neighborhood">Bairro *</Label>
                  <Input
                    id="neighborhood"
                    name="neighborhood"
                    value={companyData.neighborhood}
                    onChange={handleCompanyChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={companyData.city}
                    onChange={handleCompanyChange}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="state">Estado *</Label>
                <Input
                  id="state"
                  name="state"
                  value={companyData.state}
                  onChange={handleCompanyChange}
                  maxLength={2}
                  placeholder="SP"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando empresa...
                  </>
                ) : (
                  <>
                    Próximo: Conectar WhatsApp
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Step 2: WhatsApp */}
          {currentStep === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <p className="text-gray-600">
                Configure sua conexão com WhatsApp através da Evolution API:
              </p>

              <div>
                <Label htmlFor="apiUrl">URL da API Evolution *</Label>
                <Input
                  id="apiUrl"
                  name="apiUrl"
                  value={whatsappData.apiUrl}
                  onChange={handleWhatsAppChange}
                  placeholder="https://api.seudominio.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="apiKey">API Key *</Label>
                <Input
                  id="apiKey"
                  name="apiKey"
                  type="password"
                  value={whatsappData.apiKey}
                  onChange={handleWhatsAppChange}
                  placeholder="Sua chave de API"
                  required
                />
              </div>

              <div>
                <Label htmlFor="instanceName">Nome da Instância *</Label>
                <Input
                  id="instanceName"
                  name="instanceName"
                  value={whatsappData.instanceName}
                  onChange={handleWhatsAppChange}
                  placeholder="minha-instancia"
                  required
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1"
                  disabled={loading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      Conectar WhatsApp
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={handleSkipWhatsApp}
                className="w-full"
                disabled={loading}
              >
                Pular por enquanto (configurar depois)
              </Button>
            </form>
          )}

          {/* Step 3: Success */}
          {currentStep === 3 && (
            <div className="text-center py-8 space-y-4">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-green-600">Tudo Pronto!</h3>
              <p className="text-gray-600">
                Sua empresa foi configurada com sucesso. Você tem 3 dias de trial gratuito.
              </p>
              <p className="text-sm text-gray-500">Redirecionando para o dashboard...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
