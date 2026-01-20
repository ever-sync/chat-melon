import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Check, AlertTriangle, RefreshCw, Zap, ArrowRight, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Plan {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  max_companies: number | null;
  max_users: number | null;
  max_conversations: number | null;
  is_free_plan: boolean;
  plan_features: {
    is_enabled: boolean;
    platform_features: {
      name: string;
      description: string | null;
      feature_key: string;
    } | null;
  }[];
}

export function SubscriptionBarrier() {
  const { canAccessPlatform, isLoading: statusLoading, status, planId } = useSubscriptionStatus();
  const navigate = useNavigate();
  const location = useLocation();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  // Determinar se deve bloquear
  const isPublicPage = ['/auth', '/signup', '/pricing', '/landing', '/checkout', '/onboarding'].some(path => 
    location.pathname.startsWith(path)
  );
  const isSuperAdminPage = location.pathname.startsWith('/super-admin');
  
  const shouldBlock = !canAccessPlatform && !statusLoading && !isPublicPage && !isSuperAdminPage;

  // Bloquear scroll do corpo quando ativo
  useEffect(() => {
    if (shouldBlock) {
      document.body.style.overflow = 'hidden';
      document.body.style.pointerEvents = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    };
  }, [shouldBlock]);

  // Buscar planos PAGOS com features dinâmicas
  const { data: plans = [] } = useQuery({
    queryKey: ['subscription-plans-barrier-dynamic'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select(`
          *,
          plan_features (
            is_enabled,
            platform_features (
              name,
              description,
              feature_key
            )
          )
        `)
        .eq('is_active', true)
        .eq('is_free_plan', false)
        .order('price_monthly', { ascending: true });

      if (error) throw error;
      return data as any[] as Plan[];
    },
    enabled: shouldBlock,
  });

  if (!shouldBlock) return null;

  const handleSelectPlan = (id: string) => {
    navigate(`/checkout?planId=${id}&billing=${billingPeriod}`);
  };

  // Helper to format features list including limits
  const getPlanFeaturesList = (plan: Plan) => {
    const list: string[] = [];

    // Add Limits
    if (plan.max_companies === null) {
      list.push('Empresas ilimitadas');
    } else if (plan.max_companies > 0) {
      list.push(`${plan.max_companies} ${plan.max_companies === 1 ? 'empresa' : 'empresas'}`);
    }

    if (plan.max_users === null) {
      list.push('Usuários ilimitados');
    } else if (plan.max_users > 0) {
      list.push(`${plan.max_users} usuários`);
    }

    // Add Dynamic Features
    plan.plan_features?.forEach(pf => {
      if (pf.is_enabled && pf.platform_features) {
        list.push(pf.platform_features.name);
      }
    });

    return list;
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4 overflow-y-auto selection:bg-primary/30"
      style={{ pointerEvents: 'auto' }}
    >
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] relative my-auto overflow-hidden text-[#333]">
        {/* Banner de Aviso Crítico */}
        <div className="bg-red-600 text-white py-2 px-4 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.2em]">
          <AlertTriangle className="h-3 w-3" />
          Acesso Restrito - Regularize sua Assinatura
          <AlertTriangle className="h-3 w-3" />
        </div>

        <div className="p-10">
          <header className="text-center mb-12">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
              <Crown className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Sua jornada continua aqui</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
              Para retomar seus atendimentos e acessar seus dados, escolha um plano abaixo.
            </p>

            {/* Billing Toggle (RD Style) */}
            <div className="flex items-center justify-center mt-10">
              <div className="flex bg-gray-100 p-1 rounded-full items-center">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={cn(
                    "px-6 py-2 rounded-full text-xs font-black transition-all",
                    billingPeriod === 'monthly' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setBillingPeriod('yearly')}
                  className={cn(
                    "px-6 py-2 rounded-full text-xs font-black transition-all flex items-center gap-2",
                    billingPeriod === 'yearly' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Anual
                  <Badge className="bg-[#00E5FF] text-slate-900 hover:bg-[#00E5FF] border-none text-[9px] h-4 px-1 font-black">
                    -20%
                  </Badge>
                </button>
              </div>
            </div>
          </header>

          <div className="grid md:grid-cols-3 gap-0 border rounded-2xl overflow-hidden bg-white shadow-sm">
            {plans.map((plan, index) => {
              const price = billingPeriod === 'monthly' ? plan.price_monthly : plan.price_yearly / 12;
              const isCurrentPlan = plan.id === planId;
              const isPopular = plan.slug === 'professional' || plans.length === 1;
              const features = getPlanFeaturesList(plan);

              return (
                <div 
                  key={plan.id}
                  className={cn(
                    "flex flex-col p-8 border-t-[5px] transition-all relative",
                    isCurrentPlan ? "border-primary bg-primary/[0.02]" : "border-slate-100",
                    index !== plans.length - 1 && "md:border-r border-slate-50"
                  )}
                >
                  {isCurrentPlan && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                      <Badge className="bg-primary hover:bg-primary text-white text-[9px] font-black tracking-widest px-3 py-0.5 shadow-lg border-2 border-white">PLANO ANTERIOR</Badge>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">{plan.name}</h3>
                    <p className="text-xs text-slate-400 font-bold leading-relaxed h-[36px] overflow-hidden">
                      {plan.description || "Ideal para organizar seus atendimentos."}
                    </p>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-black text-slate-900">R$</span>
                      <span className="text-3xl font-black text-slate-900 tracking-tighter">
                        {price.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      </span>
                      <span className="text-xs font-bold text-slate-400">/mês</span>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1 uppercase font-black tracking-tighter">
                      No plano {billingPeriod === 'monthly' ? 'Mensal' : 'Anual'}
                    </p>
                  </div>

                  <Button 
                    className={cn(
                      "w-full h-10 text-[11px] font-black group mb-8 transition-all gap-2",
                      isCurrentPlan ? "bg-slate-900 hover:bg-slate-800" : "bg-slate-900 hover:bg-slate-800"
                    )}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {isCurrentPlan ? (
                      <>
                        <RefreshCw className="h-3 w-3" />
                        RENOVAR AGORA
                      </>
                    ) : (
                      <>
                        <Zap className="h-3 w-3" />
                        FAZER UPGRADE
                      </>
                    )}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </Button>

                  <div className="space-y-4 flex-1">
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b pb-2">Benefícios:</p>
                    <ul className="space-y-2.5">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <div className="mt-0.5 flex-shrink-0">
                            <Check className="h-3.5 w-3.5 text-primary" strokeWidth={3} />
                          </div>
                          <span className="text-[11px] text-slate-600 font-bold leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-10 text-center flex flex-col items-center gap-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <MessageCircle className="h-3.5 w-3.5" />
              Precisa de ajuda com o pagamento?
            </p>
            <Button variant="link" className="text-primary font-black text-sm uppercase tracking-tighter h-auto p-0 hover:no-underline hover:text-primary/80 group" onClick={() => window.open('https://wa.me/suporte_melonchat', '_blank')}>
              Fale com um atendente humano agora
              <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
