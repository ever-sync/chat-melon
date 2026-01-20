import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowLeft, ArrowRight, MessageCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch active plans with dynamic features from database
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['subscription-plans-public-dynamic'],
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
        .order('price_monthly', { ascending: true });

      if (error) throw error;
      return data as any[] as Plan[];
    },
  });

  const handleSubscribe = (planId: string) => {
    navigate(`/checkout?planId=${planId}&billing=${billingPeriod}`);
  };

  // Helper to format features list including limits
  const getPlanFeaturesList = (plan: Plan) => {
    const list: string[] = [];

    // Add Limits first
    if (plan.max_companies === null) {
      list.push('Empresas ilimitadas');
    } else if (plan.max_companies > 0) {
      list.push(`${plan.max_companies} ${plan.max_companies === 1 ? 'empresa conectada' : 'empresas conectadas'}`);
    }

    if (plan.max_users === null) {
      list.push('Usuários ilimitados');
    } else if (plan.max_users > 0) {
      list.push(`Até ${plan.max_users} usuários incluídos`);
    }

    if (plan.max_conversations === null) {
      list.push('Conversas ilimitadas');
    } else if (plan.max_conversations > 0) {
      list.push(`${plan.max_conversations.toLocaleString()} conversas/mês`);
    }

    // Add Dynamic Features
    plan.plan_features?.forEach(pf => {
      if (pf.is_enabled && pf.platform_features) {
        list.push(pf.platform_features.name);
      }
    });

    // If list is empty, add a default
    if (list.length === 0) {
      list.push('Benefícios essenciais MelonChat');
    }

    return list;
  };

  return (
    <div className="min-h-screen bg-white text-[#333]">
      {/* Header Minimalista */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <MessageCircle className="h-6 w-6" />
            MelonChat
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/auth" className="text-sm font-semibold hover:text-primary transition-colors">
              Entrar
            </Link>
            <Button size="sm" onClick={() => navigate('/auth?signup=true')}>
              Começar agora
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-12 text-center bg-slate-50/50">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
            Atendimento digital ágil e em um só lugar
          </h1>
          
          {/* Billing Toggle (RD Style) */}
          <div className="flex items-center justify-center mt-12 mb-8">
            <div className="flex bg-gray-200/50 p-1 rounded-full items-center">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={cn(
                  "px-8 py-2.5 rounded-full text-sm font-bold transition-all",
                  billingPeriod === 'monthly' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={cn(
                  "px-8 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2",
                  billingPeriod === 'yearly' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Anual
                <Badge className="bg-[#00E5FF] text-slate-900 hover:bg-[#00E5FF] border-none text-[10px] h-5 px-1.5 font-bold">
                  Economize 20%
                </Badge>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Container */}
      <section className="pb-24 container mx-auto px-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-0 border-x border-b rounded-xl shadow-sm overflow-hidden bg-white max-w-6xl mx-auto">
            {plans.map((plan, index) => {
              const price = billingPeriod === 'monthly' ? plan.price_monthly : plan.price_yearly / 12;
              const isPopular = plan.slug === 'professional' || plans.length === 1;
              const features = getPlanFeaturesList(plan);

              return (
                <div 
                  key={plan.id}
                  className={cn(
                    "flex flex-col p-8 border-t-[6px] transition-all",
                    isPopular ? "border-primary bg-primary/[0.02]" : "border-slate-200",
                    index !== plans.length - 1 && "md:border-r border-slate-100"
                  )}
                >
                  <div className="mb-8">
                    <h3 className="text-2xl font-black text-slate-900 mb-4">{plan.name}</h3>
                    <p className="text-sm text-slate-500 min-h-[40px] leading-relaxed">
                      {plan.description || "Solução ideal para organizar seus atendimentos e crescer."}
                    </p>
                  </div>

                  <div className="mb-8">
                    {plan.price_monthly === 0 && plan.price_yearly === 0 ? (
                       <div className="py-2">
                        <p className="text-2xl font-black text-slate-900">Grátis</p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tight">Para começar</p>
                      </div>
                    ) : plan.slug === 'enterprise' ? (
                      <div className="py-2">
                        <p className="text-2xl font-black text-slate-900">Preço sob consulta</p>
                        <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">Soluções Personalizadas</p>
                      </div>
                    ) : (
                      <div className="py-2">
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-bold text-slate-900">R$</span>
                          <span className="text-4xl font-black text-slate-900 tracking-tighter">
                            {price.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                          </span>
                          <span className="text-sm font-bold text-slate-400">/mês</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tight">
                          Valor cobrado no Plano {billingPeriod === 'monthly' ? 'Mensal' : 'Anual'}
                        </p>
                      </div>
                    )}
                  </div>

                  <Button 
                    className={cn(
                      "w-full h-12 text-sm font-bold group mb-10 transition-all",
                      isPopular ? "bg-slate-900 hover:bg-slate-800" : "bg-slate-900 hover:bg-slate-800"
                    )}
                    onClick={() => handleSubscribe(plan.id)}
                  >
                    {plan.slug === 'enterprise' ? 'Falar com vendas' : 'Contratar agora'}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>

                  <div className="space-y-4 flex-1">
                    <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Recursos Inclusos:</p>
                    <ul className="space-y-3">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="mt-1 flex-shrink-0">
                            <Check className="h-4 w-4 text-primary" strokeWidth={3} />
                          </div>
                          <span className="text-sm text-slate-600 leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link 
                    to="#" 
                    className="mt-10 text-[11px] font-black text-primary uppercase tracking-tighter hover:underline flex items-center gap-1"
                  >
                    Detalhes sobre o plano {plan.name}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-slate-50 border-t">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-black text-slate-900 mb-8">Dúvidas sobre os planos?</h2>
          <p className="text-slate-500 mb-8 max-w-2xl mx-auto">
            Nossa equipe está pronta para ajudar você a escolher a melhor configuração para o seu negócio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" className="border-slate-300 font-bold px-8 h-12">
              Ver FAQ completo
            </Button>
            <Button className="bg-[#4CAF50] hover:bg-[#43A047] text-white font-bold px-8 h-12 gap-2" onClick={() => window.open('https://wa.me/suporte_melonchat', '_blank')}>
              Chamar no WhatsApp
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
