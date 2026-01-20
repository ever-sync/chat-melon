import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAsaasCheckout } from '@/hooks/useAsaasCheckout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Check, CreditCard, QrCode, FileText, ArrowLeft, Loader2 } from 'lucide-react';

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { createSubscription, isLoading: isProcessing } = useAsaasCheckout();
  
  const planId = searchParams.get('planId');
  const billing = searchParams.get('billing') as 'monthly' | 'yearly' || 'monthly';

  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'BOLETO' | 'CREDIT_CARD'>('PIX');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    cpfCnpj: '',
    phone: '',
  });
  const [creditCard, setCreditCard] = useState({
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: '',
  });

  const [paymentResult, setPaymentResult] = useState<any>(null);

  // Fetch plan details
  const { data: plan, isLoading: isLoadingPlan } = useQuery({
    queryKey: ['plan', planId],
    queryFn: async () => {
      if (!planId) return null;
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!planId,
  });

  // Fetch current company
  const { data: company, isLoading: isLoadingCompany } = useQuery({
    queryKey: ['company-checkout'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile?.company_id || '')
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  useEffect(() => {
    if (user && profile) {
      setCustomerInfo(prev => ({
        ...prev,
        name: profile.full_name || '',
        email: user.email || '',
      }));
    }
  }, [user, profile]);

  useEffect(() => {
    if (company) {
      setCustomerInfo(prev => ({
        ...prev,
        cpfCnpj: company.cnpj || prev.cpfCnpj,
        phone: company.phone || prev.phone,
      }));
    }
  }, [company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planId || !profile?.company_id) {
      toast.error('Informações do plano ou empresa ausentes');
      return;
    }

    try {
      const result = await createSubscription({
        companyId: profile.company_id,
        planId: planId,
        billingType: paymentMethod,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerCpfCnpj: customerInfo.cpfCnpj,
        customerPhone: customerInfo.phone,
        ...(paymentMethod === 'CREDIT_CARD' ? { 
          creditCard,
          creditCardHolderInfo: {
            name: customerInfo.name,
            email: customerInfo.email,
            cpfCnpj: customerInfo.cpfCnpj,
            phone: customerInfo.phone,
            postalCode: company?.postal_code || '00000000',
            addressNumber: company?.number || 'SN',
          }
        } : {})
      });

      if (result.success) {
        setPaymentResult(result);
        toast.success('Assinatura criada com sucesso!');
      }
    } catch (error) {
      // Error handled by hook
    }
  };

  if (isLoadingPlan || isLoadingCompany) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando detalhes do checkout...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
        <h1 className="text-2xl font-bold">Plano não encontrado</h1>
        <p className="text-muted-foreground text-sm max-w-md">
          Não conseguimos localizar o plano selecionado. Por favor, volte e escolha um plano válido.
        </p>
        <Button onClick={() => navigate('/pricing')}>Ver Planos</Button>
      </div>
    );
  }

  if (paymentResult) {
    return (
      <div className="min-h-screen bg-muted/30 py-12 px-4">
        <div className="max-w-xl mx-auto space-y-6 text-center">
          <Card className="border-primary">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Assinatura Solicitada!</CardTitle>
              <CardDescription>
                Sua assinatura do plano <strong>{plan.name}</strong> está sendo processada.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {paymentMethod === 'PIX' && paymentResult.paymentDetails && (
                <div className="space-y-4">
                  <p className="text-sm font-medium">Escaneie o QR Code abaixo para pagar:</p>
                  <div className="mx-auto w-48 h-48 border rounded-lg bg-white p-2">
                    <img src={`data:image/png;base64,${paymentResult.paymentDetails.pixQrCode}`} alt="PIX QR Code" className="w-full h-full" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Código Copia e Cola:</Label>
                    <div className="relative">
                      <Input readOnly value={paymentResult.paymentDetails.pixCopyPaste} className="pr-20 text-xs" />
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="absolute right-1 top-1 h-7"
                        onClick={() => {
                          navigator.clipboard.writeText(paymentResult.paymentDetails.pixCopyPaste);
                          toast.success('Copiado!');
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'BOLETO' && paymentResult.paymentDetails && (
                <div className="space-y-4 py-4">
                  <p className="text-sm">Seu boleto foi gerado com sucesso.</p>
                  <Button asChild className="w-full h-12">
                    <a href={paymentResult.paymentDetails.boletoUrl} target="_blank" rel="noopener noreferrer">
                      <FileText className="mr-2 h-4 w-4" />
                      Imprimir Boleto
                    </a>
                  </Button>
                </div>
              )}

              {paymentMethod === 'CREDIT_CARD' && (
                <div className="py-4">
                  <p className="text-sm text-muted-foreground">
                    Sua assinatura está aguardando a confirmação do pagamento pela operadora do cartão.
                  </p>
                </div>
              )}

              <div className="pt-6 border-t">
                <p className="text-xs text-muted-foreground mb-4">
                  Assim que o pagamento for confirmado, sua conta será ativada automaticamente.
                </p>
                <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard')}>
                  Ir para o Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      <div className="max-w-4xl mx-auto grid gap-8 md:grid-cols-5">
        {/* Formulário de Checkout */}
        <div className="md:col-span-3 space-y-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 mb-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Cliente</CardTitle>
                <CardDescription>Dados necessários para a emissão da nota e cadastro no Asaas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome Completo / Razão Social</Label>
                  <Input 
                    id="name" 
                    value={customerInfo.name} 
                    onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={customerInfo.email} 
                      onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Telefone / WhatsApp</Label>
                    <Input 
                      id="phone" 
                      value={customerInfo.phone} 
                      onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cpfCnpj">CPF or CNPJ</Label>
                  <Input 
                    id="cpfCnpj" 
                    value={customerInfo.cpfCnpj} 
                    onChange={e => setCustomerInfo({...customerInfo, cpfCnpj: e.target.value})}
                    required 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Forma de Pagamento</CardTitle>
                <CardDescription>Selecione como deseja pagar sua assinatura</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)} className="grid gap-4">
                  <Label
                    htmlFor="pix"
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'PIX' ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
                  >
                    <div className="flex items-center gap-3">
                      <QrCode className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">PIX</p>
                        <p className="text-xs text-muted-foreground">Liberação instantânea</p>
                      </div>
                    </div>
                    <RadioGroupItem value="PIX" id="pix" />
                  </Label>

                  <Label
                    htmlFor="credit_card"
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'CREDIT_CARD' ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Cartão de Crédito</p>
                        <p className="text-xs text-muted-foreground">Recorrência automática</p>
                      </div>
                    </div>
                    <RadioGroupItem value="CREDIT_CARD" id="credit_card" />
                  </Label>

                  <Label
                    htmlFor="boleto"
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'BOLETO' ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Boleto Bancário</p>
                        <p className="text-xs text-muted-foreground">Liberação em até 2 dias úteis</p>
                      </div>
                    </div>
                    <RadioGroupItem value="BOLETO" id="boleto" />
                  </Label>
                </RadioGroup>

                {paymentMethod === 'CREDIT_CARD' && (
                  <div className="grid gap-4 mt-6 pt-6 border-t animate-in fade-in slide-in-from-top-2">
                    <div className="grid gap-2">
                      <Label htmlFor="card_number">Número do Cartão</Label>
                      <Input 
                        id="card_number" 
                        value={creditCard.number}
                        onChange={e => setCreditCard({...creditCard, number: e.target.value})}
                        placeholder="0000 0000 0000 0000"
                        required 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="holder_name">Nome no Cartão</Label>
                      <Input 
                        id="holder_name" 
                        value={creditCard.holderName}
                        onChange={e => setCreditCard({...creditCard, holderName: e.target.value})}
                        placeholder="Como está no cartão"
                        required 
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="expiry_month">Mês</Label>
                        <Input 
                          id="expiry_month" 
                          value={creditCard.expiryMonth}
                          onChange={e => setCreditCard({...creditCard, expiryMonth: e.target.value})}
                          placeholder="MM"
                          maxLength={2}
                          required 
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="expiry_year">Ano</Label>
                        <Input 
                          id="expiry_year" 
                          value={creditCard.expiryYear}
                          onChange={e => setCreditCard({...creditCard, expiryYear: e.target.value})}
                          placeholder="AAAA"
                          maxLength={4}
                          required 
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="ccv">CCV</Label>
                        <Input 
                          id="ccv" 
                          value={creditCard.ccv}
                          onChange={e => setCreditCard({...creditCard, ccv: e.target.value})}
                          placeholder="123"
                          maxLength={4}
                          required 
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button type="submit" className="w-full h-12 text-lg" disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processando...
                </>
              ) : (
                'Finalizar Assinatura'
              )}
            </Button>
          </form>
        </div>

        {/* Resumo do Pedido */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-primary/5 border-primary/20 sticky top-12">
            <CardHeader>
              <CardTitle className="text-lg">Resumo da Assinatura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{plan.name}</p>
                  <p className="text-sm text-muted-foreground">Recorrência {billing === 'monthly' ? 'Mensal' : 'Anual'}</p>
                </div>
                <p className="font-semibold">
                  {(billing === 'monthly' ? plan.price_monthly : plan.price_yearly).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </p>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>
                    {(billing === 'monthly' ? plan.price_monthly : plan.price_yearly).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>
                    {(billing === 'monthly' ? plan.price_monthly : plan.price_yearly).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </div>
              </div>

              <div className="pt-6 space-y-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Benefícios incluídos:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Acesso a todas as ferramentas do plano</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Suporte prioritário</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Cancelamento sem taxas</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-primary/5 pt-6">
              <p className="text-[10px] text-center w-full text-muted-foreground">
                Pagamento seguro processado via Asaas. Ao finalizar, você concorda com nossos Termos de Serviço e Política de Privacidade.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
