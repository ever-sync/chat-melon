import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Check, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  const plans = [
    {
      slug: "starter",
      name: "Starter",
      priceMonthly: 97,
      priceYearly: 931.20,
      features: [
        "1 empresa",
        "5 usuários",
        "1.000 conversas/mês",
        "WhatsApp integrado",
        "CRM básico",
        "Relatórios",
        "Suporte por email",
      ],
    },
    {
      slug: "professional",
      name: "Professional",
      priceMonthly: 297,
      priceYearly: 2851.20,
      popular: true,
      features: [
        "3 empresas",
        "15 usuários",
        "5.000 conversas/mês",
        "WhatsApp integrado",
        "CRM avançado",
        "Relatórios completos",
        "Automação",
        "Suporte prioritário",
      ],
    },
    {
      slug: "enterprise",
      name: "Enterprise",
      priceMonthly: 697,
      priceYearly: 6691.20,
      features: [
        "Empresas ilimitadas",
        "50 usuários",
        "Conversas ilimitadas",
        "WhatsApp integrado",
        "CRM completo",
        "Relatórios avançados",
        "Automação completa",
        "White label",
        "API pública",
        "Suporte 24/7",
      ],
    },
  ];

  const handleSubscribe = async (planSlug: string) => {
    setLoading(planSlug);
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Redirect to auth page with return URL
        toast.info("Faça login para continuar");
        navigate("/auth?redirect=/pricing");
        return;
      }

      // Create checkout session (we'll implement this edge function next)
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { 
          planSlug,
          billingPeriod: isYearly ? "yearly" : "monthly"
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      toast.error("Erro ao processar pagamento. Tente novamente.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 fixed top-0 w-full z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </Link>
          <Link to="/auth">
            <Button variant="ghost">Login</Button>
          </Link>
        </div>
      </header>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 pt-32 pb-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Escolha Seu Plano
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Planos flexíveis para empresas de todos os tamanhos
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={!isYearly ? "font-semibold" : "text-muted-foreground"}>
              Mensal
            </span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} />
            <span className={isYearly ? "font-semibold" : "text-muted-foreground"}>
              Anual
            </span>
            {isYearly && (
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
                Economize 20%
              </span>
            )}
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const price = isYearly ? plan.priceYearly : plan.priceMonthly;
            const monthlyEquivalent = isYearly ? price / 12 : price;

            return (
              <Card
                key={plan.slug}
                className={`p-8 flex flex-col ${
                  plan.popular
                    ? "border-primary shadow-2xl scale-105 relative"
                    : "border-border/50"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                      Mais Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-5xl font-bold">
                      R$ {monthlyEquivalent.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  {isYearly && (
                    <p className="text-sm text-muted-foreground">
                      R$ {price.toFixed(2)} cobrado anualmente
                    </p>
                  )}
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  size="lg"
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSubscribe(plan.slug)}
                  disabled={loading !== null}
                >
                  {loading === plan.slug ? "Processando..." : "Contratar Agora"}
                </Button>
              </Card>
            );
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-20 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Dúvidas?</h2>
          <p className="text-muted-foreground mb-4">
            Todos os planos incluem 14 dias de garantia. Cancele a qualquer momento.
          </p>
          <p className="text-muted-foreground">
            Entre em contato conosco para planos personalizados ou dúvidas sobre funcionalidades.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Pricing;