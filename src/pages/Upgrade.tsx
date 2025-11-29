import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Check,
  Crown,
  Zap,
  Building2,
  Users,
  MessageCircle,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Upgrade() {
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const { status, daysRemaining, isTrialExpired } = useSubscriptionStatus();

  // Buscar planos ativos
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['subscription-plans-upgrade'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      return data;
    },
  });

  const handleSelectPlan = (planId: string, planSlug: string) => {
    // Aqui você integraria com o gateway de pagamento (Stripe, PagSeguro, etc)
    console.log('Plano selecionado:', { planId, planSlug, billingPeriod });

    // Por enquanto, apenas mostrar mensagem
    alert(`Plano ${planSlug} selecionado! Integração com pagamento será implementada.`);
  };

  const getPlanIcon = (index: number) => {
    const icons = [Zap, Crown, Sparkles, Building2];
    const Icon = icons[index % icons.length];
    return Icon;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Carregando planos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">EvoTalk Gateway</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-12 text-center space-y-6">
        {isTrialExpired ? (
          <>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive text-sm font-medium">
              <Crown className="h-4 w-4" />
              Seu trial expirou
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Continue usando a plataforma
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Escolha o plano ideal para seu negócio e mantenha o acesso a todas as funcionalidades
            </p>
          </>
        ) : (
          <>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {status === 'trial' && (
                <>
                  <Zap className="h-4 w-4" />
                  {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'} restantes de trial
                </>
              )}
              {status === 'active' && (
                <>
                  <Check className="h-4 w-4" />
                  Assinatura ativa
                </>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Escolha o plano ideal para seu negócio
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Planos flexíveis com tudo que você precisa para escalar suas vendas
            </p>
          </>
        )}
      </section>

      {/* Billing Toggle */}
      <section className="container mx-auto px-6 pb-8">
        <Tabs
          value={billingPeriod}
          onValueChange={(value) => setBillingPeriod(value as 'monthly' | 'yearly')}
          className="w-full max-w-md mx-auto"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">Mensal</TabsTrigger>
            <TabsTrigger value="yearly">
              Anual
              <Badge variant="secondary" className="ml-2">
                -20%
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </section>

      {/* Plans Grid */}
      <section className="container mx-auto px-6 pb-20">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = getPlanIcon(index);
            const price =
              billingPeriod === 'monthly'
                ? plan.price_monthly
                : plan.price_yearly / 12;
            const totalYearly = plan.price_yearly;
            const isRecommended = index === 2; // Professional
            const isFree = plan.is_free_plan;

            return (
              <Card
                key={plan.id}
                className={cn(
                  'relative flex flex-col',
                  isRecommended && 'border-primary shadow-lg scale-105'
                )}
              >
                {isRecommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="px-4 py-1">Recomendado</Badge>
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    {isFree && (
                      <Badge variant="outline">Gratuito</Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="min-h-[48px]">
                    {plan.description || 'Plano de assinatura'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-6">
                  {/* Preço */}
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        {price.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                        })}
                      </span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    {billingPeriod === 'yearly' && !isFree && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {totalYearly.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}{' '}
                        cobrado anualmente
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {plan.max_companies}{' '}
                        {plan.max_companies === 1 ? 'empresa' : 'empresas'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {plan.max_users || '∞'} usuários
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {plan.max_conversations
                          ? `${plan.max_conversations.toLocaleString()} conversas/mês`
                          : 'Conversas ilimitadas'}
                      </span>
                    </div>
                    {plan.trial_days > 0 && !isFree && (
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <Zap className="h-4 w-4" />
                        <span>{plan.trial_days} dias de teste grátis</span>
                      </div>
                    )}
                  </div>

                  {/* Principais features do JSON */}
                  {plan.features && (
                    <div className="space-y-2 pt-4 border-t">
                      {Object.entries(plan.features as Record<string, any>)
                        .filter(([_, value]) => value === true || value === 'unlimited')
                        .slice(0, 5)
                        .map(([key]) => (
                          <div key={key} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-primary" />
                            <span className="capitalize">
                              {key.replace(/_/g, ' ')}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isRecommended ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => handleSelectPlan(plan.id, plan.slug)}
                    disabled={isFree && status === 'trial'}
                  >
                    {isFree
                      ? 'Plano Atual'
                      : isTrialExpired
                      ? 'Escolher Plano'
                      : 'Fazer Upgrade'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>

      {/* FAQ ou Benefícios Adicionais */}
      <section className="container mx-auto px-6 pb-20">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">Todos os planos incluem</h2>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-primary/10 w-fit">
                <Check className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Sem compromisso</h3>
              <p className="text-sm text-muted-foreground">
                Cancele quando quiser, sem multas ou taxas
              </p>
            </div>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-primary/10 w-fit">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Atualizações constantes</h3>
              <p className="text-sm text-muted-foreground">
                Novos recursos adicionados regularmente
              </p>
            </div>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-primary/10 w-fit">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Suporte dedicado</h3>
              <p className="text-sm text-muted-foreground">
                Nossa equipe pronta para ajudar
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
