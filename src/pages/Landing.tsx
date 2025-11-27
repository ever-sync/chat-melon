import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, MessageSquare, Users, BarChart3, Zap, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  const features = [
    {
      icon: MessageSquare,
      title: "Chat Multicanal",
      description: "Integração completa com WhatsApp via Evolution API",
    },
    {
      icon: Users,
      title: "CRM Integrado",
      description: "Gerencie seus contatos e leads em um só lugar",
    },
    {
      icon: BarChart3,
      title: "Relatórios Avançados",
      description: "Analytics e métricas em tempo real",
    },
    {
      icon: Zap,
      title: "Automação",
      description: "Automatize atendimentos e fluxos de trabalho",
    },
    {
      icon: Building2,
      title: "Multi-Empresa",
      description: "Gerencie múltiplas empresas em uma conta",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 fixed top-0 w-full z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              ChatHub
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/pricing">
              <Button>Ver Planos</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-32 pb-20 text-center">
        <div className="animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Atendimento Inteligente
            <br />
            para o Futuro
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Transforme seu atendimento com tecnologia de ponta. Multi-empresa, WhatsApp integrado e automação completa.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pricing">
              <Button size="lg" className="text-lg px-8">
                Começar Grátis
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Ver Planos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">
          Recursos Poderosos
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50"
            >
              <feature.icon className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Plans Preview Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-4">
          Planos para Todos os Tamanhos
        </h2>
        <p className="text-center text-muted-foreground mb-12 text-lg">
          Escolha o plano ideal para o seu negócio
        </p>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { name: "Starter", price: "97", features: ["1 empresa", "5 usuários", "1.000 conversas/mês"] },
            { name: "Professional", price: "297", features: ["3 empresas", "15 usuários", "5.000 conversas/mês"], popular: true },
            { name: "Enterprise", price: "697", features: ["Empresas ilimitadas", "50 usuários", "Conversas ilimitadas"] },
          ].map((plan, index) => (
            <Card
              key={index}
              className={`p-8 text-center ${
                plan.popular ? "border-primary shadow-lg scale-105" : "border-border/50"
              }`}
            >
              {plan.popular && (
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                  Mais Popular
                </span>
              )}
              <h3 className="text-2xl font-bold mt-4 mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">R$ {plan.price}</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to="/pricing">
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                >
                  Contratar
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="p-12 text-center bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <h2 className="text-4xl font-bold mb-4">
            Pronto para Começar?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de empresas que já transformaram seu atendimento
          </p>
          <Link to="/pricing">
            <Button size="lg" className="text-lg px-8">
              Começar Agora
            </Button>
          </Link>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 ChatHub. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;