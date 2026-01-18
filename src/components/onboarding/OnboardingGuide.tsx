import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Building2, Smartphone, CheckCircle, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useCompany } from '@/contexts/CompanyContext';

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
    cnpj: '',
    legalName: '',
    fantasyName: '',
    companyEmail: '',
    companyPhone: '',
  });

  // Step 2: WhatsApp Data (Evolution API)
  const [whatsappData, setWhatsappData] = useState({
    instanceName: '',
  });

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompanyData({ ...companyData, [e.target.name]: e.target.value });
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsappData({ ...whatsappData, [e.target.name]: e.target.value });
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Usuário não autenticado');
        navigate('/auth');
        return;
      }

      // Verificar se CNPJ já existe
      if (companyData.cnpj) {
        const { data: existingCompanies } = await supabase
          .from('companies')
          .select('id, name')
          .eq('cnpj', companyData.cnpj)
          .is('deleted_at', null);

        if (existingCompanies && existingCompanies.length > 0) {
          const existingCompany = existingCompanies[0];

          // Verificar se a empresa pertence ao usuário atual via company_members
          const { data: userCompany } = await supabase
            .from('company_members')
            .select('company_id')
            .eq('user_id', user.id)
            .eq('company_id', existingCompany.id)
            .eq('is_active', true)
            .maybeSingle();

          if (userCompany) {
            // Empresa já existe e pertence ao usuário - pular para próximo step
            localStorage.setItem('onboardingCompanyId', existingCompany.id);
            toast.success('Empresa já cadastrada! Vamos configurar o WhatsApp.');
            setCurrentStep(2);
            setLoading(false);
            return;
          } else {
            // Empresa existe mas pertence a outro usuário
            toast.error(
              `Este CNPJ já está cadastrado pela empresa "${existingCompany.name}". Use outro CNPJ ou entre em contato com o suporte.`,
              { duration: 8000 }
            );
            setLoading(false);
            return;
          }
        }
      }

      // Create company - APENAS name (obrigatória), cnpj e created_by (para RLS)
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyData.fantasyName || companyData.legalName || 'Empresa',
          cnpj: companyData.cnpj || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Atualizar campos extras em segunda query (evita cache)
      const trialEnds = new Date();
      trialEnds.setDate(trialEnds.getDate() + 3);

      await supabase
        .from('companies')
        .update({
          email: companyData.companyEmail,
          phone: companyData.companyPhone,
          trial_started_at: new Date().toISOString(),
          trial_ends_at: trialEnds.toISOString(),
          subscription_status: 'trial',
        })
        .eq('id', company.id);

      // Criar company_users
      await supabase.from('company_users').insert({
        user_id: user.id,
        company_id: company.id,
        is_default: true,
      });

      // Criar company_members
      await supabase.from('company_members').insert({
        user_id: user.id,
        company_id: company.id,
        role: 'admin',
        display_name: user.user_metadata?.full_name || user.email || 'Admin',
        email: user.email,
        is_active: true,
      });

      // Save company ID for next step
      localStorage.setItem('onboardingCompanyId', company.id);

      toast.success('Empresa criada com sucesso! Agora vamos conectar seu WhatsApp.');
      setCurrentStep(2);
    } catch (error: any) {
      console.error('Error:', error);

      if (error.message && error.message.includes('CNPJ já cadastrado')) {
        toast.error('CNPJ já cadastrado!', { duration: 8000 });
      } else {
        toast.error(error.message || 'Erro ao cadastrar empresa');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const companyId = localStorage.getItem('onboardingCompanyId');

      if (!companyId) {
        toast.error('Erro: empresa não encontrada');
        return;
      }

      // Tentar salvar o nome da instância (pode falhar por cache)
      try {
        await supabase
          .from('companies')
          .update({
            evolution_instance_name: whatsappData.instanceName,
          })
          .eq('id', companyId);
      } catch (updateError) {
        console.warn('Não foi possível salvar instância (cache issue):', updateError);
        // Continua mesmo se falhar
      }

      localStorage.removeItem('onboardingCompanyId');
      await refreshCompanies();

      toast.success('WhatsApp configurado! Você pode ajustar nas Configurações.');
      setCurrentStep(3);

      // Wait 2 seconds to show success, then complete
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Erro ao configurar WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipWhatsApp = async () => {
    setLoading(true);

    try {
      localStorage.removeItem('onboardingCompanyId');
      await refreshCompanies();

      toast.success('Você pode configurar o WhatsApp depois em Configurações');
      setCurrentStep(3);

      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Erro ao finalizar');
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
            {currentStep === 1 && 'Configurar Empresa'}
            {currentStep === 2 && 'Conectar WhatsApp'}
            {currentStep === 3 && 'Tudo Pronto!'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-sm text-gray-500">
              <span className={currentStep >= 1 ? 'text-green-600 font-medium' : ''}>
                1. Empresa
              </span>
              <span className={currentStep >= 2 ? 'text-blue-600 font-medium' : ''}>
                2. WhatsApp
              </span>
              <span className={currentStep >= 3 ? 'text-green-600 font-medium' : ''}>
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>💡 Importante:</strong> Você precisa ter uma instância do WhatsApp já
                  criada na Evolution API. As credenciais da API são configuradas pelo administrador
                  do sistema.
                </p>
              </div>

              <p className="text-gray-600">
                Informe o nome da sua instância do WhatsApp na Evolution API:
              </p>

              <div>
                <Label htmlFor="instanceName">Nome da Instância WhatsApp *</Label>
                <Input
                  id="instanceName"
                  name="instanceName"
                  value={whatsappData.instanceName}
                  onChange={handleWhatsAppChange}
                  placeholder="Ex: empresa-whatsapp"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este é o nome da instância que você criou na Evolution API
                </p>
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
                Pular por enquanto (configurar depois em Configurações)
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
