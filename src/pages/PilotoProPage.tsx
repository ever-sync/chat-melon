import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Zap, Shield, Infinity as InfinityIcon, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function PilotoProPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const benefits = [
    { icon: InfinityIcon, text: 'Análises de IA ilimitadas' },
    { icon: Zap, text: 'Respostas mais rápidas com GPT-4' },
    { icon: Shield, text: 'Funciona em TODAS suas empresas' },
    { icon: Sparkles, text: 'Script de vendas personalizado' },
  ];

  const handleActivate = async () => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    setIsActivating(true);
    try {
      // Atualiza o perfil do usuário para Piloto PRO
      const { error } = await supabase
        .from('profiles')
        .update({
          piloto_pro_subscriber: true,
          piloto_pro_activated_at: new Date().toISOString(),
        } as any)
        .eq('id', user.id);

      if (error) throw error;

      toast.success('🎉 Piloto PRO ativado com sucesso!');

      // Redireciona para configurações de IA para adicionar chave OpenAI
      setTimeout(() => {
        navigate('/settings/ai');
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao ativar Piloto PRO:', error);
      toast.error('Erro ao ativar. Tente novamente.');
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-gradient-to-r from-violet-600 to-purple-600">
              <Sparkles className="w-3 h-3 mr-1" />
              Novo
            </Badge>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              Piloto PRO
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Desbloqueie o poder total da IA para suas vendas. Análises ilimitadas, respostas
              inteligentes e muito mais.
            </p>
          </div>

          {/* Pricing Card */}
          <Card className="max-w-md mx-auto border-2 border-violet-500/50 shadow-xl shadow-violet-500/10">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Plano Piloto PRO</CardTitle>
              <CardDescription>Para quem quer vender mais com IA</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Price */}
              <div className="text-center py-4">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-sm text-muted-foreground">R$</span>
                  <span className="text-5xl font-bold">49</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">ou R$ 470/ano (economize 20%)</p>
              </div>

              {/* Benefits */}
              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                      <benefit.icon className="w-4 h-4 text-violet-600" />
                    </div>
                    <span className="text-sm">{benefit.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Button
                onClick={handleActivate}
                disabled={isActivating}
                className="w-full h-12 text-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              >
                {isActivating ? (
                  'Ativando...'
                ) : (
                  <>
                    Ativar Piloto PRO
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Após ativar, configure sua chave OpenAI nas configurações de IA.
              </p>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <div className="mt-12 text-center">
            <h2 className="text-xl font-semibold mb-4">Perguntas Frequentes</h2>
            <div className="grid gap-4 max-w-2xl mx-auto text-left">
              <Card>
                <CardContent className="pt-4">
                  <h3 className="font-medium mb-2">Como funciona?</h3>
                  <p className="text-sm text-muted-foreground">
                    O Piloto PRO usa a OpenAI (GPT-4) para análises ilimitadas. Você precisará de
                    uma chave da OpenAI, que pode criar gratuitamente com $5 de crédito inicial.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <h3 className="font-medium mb-2">Funciona em todas as empresas?</h3>
                  <p className="text-sm text-muted-foreground">
                    Sim! Uma vez ativado, o Piloto PRO funciona em todas as empresas vinculadas à
                    sua conta.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
