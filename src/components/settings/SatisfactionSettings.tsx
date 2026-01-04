import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCompanyQuery } from '@/hooks/crm/useCompanyQuery';
import { Star, TrendingUp, Loader2, MessageSquare, Clock, Layout, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SatisfactionSettings = () => {
  const { getCompanyId } = useCompanyQuery();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    enabled: false,
    survey_type: 'csat' as 'csat' | 'nps',
    delay_minutes: 5,
    custom_message: '',
    ask_feedback: true,
    feedback_prompt: 'Pode nos contar o que podemos melhorar?',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const companyId = getCompanyId();

      const { data, error } = await supabase
        .from('satisfaction_settings')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          enabled: data.enabled,
          survey_type: data.survey_type as 'csat' | 'nps',
          delay_minutes: data.delay_minutes,
          custom_message: data.custom_message || '',
          ask_feedback: data.ask_feedback,
          feedback_prompt: data.feedback_prompt || 'Pode nos contar o que podemos melhorar?',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const companyId = getCompanyId();

      const { error } = await supabase.from('satisfaction_settings').upsert(
        {
          company_id: companyId,
          enabled: settings.enabled,
          survey_type: settings.survey_type,
          delay_minutes: settings.delay_minutes,
          custom_message: settings.custom_message || null,
          ask_feedback: settings.ask_feedback,
          feedback_prompt: settings.feedback_prompt,
        },
        {
          onConflict: 'company_id',
        }
      );

      if (error) throw error;

      toast.success('Configurações de satisfação salvas!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Não foi possível salvar as configurações');
    } finally {
      setSaving(false);
    }
  };

  const defaultCSATMessage = `Como você avalia nosso atendimento?

Responda com um número de 1 a 5:
⭐ 1 - Muito ruim
⭐ 2 - Ruim  
⭐ 3 - Regular
⭐ 4 - Bom
⭐ 5 - Excelente`;

  const defaultNPSMessage = `De 0 a 10, o quanto você recomendaria nossa empresa?

Responda com um número:
0 - Nunca recomendaria
...
10 - Com certeza recomendaria`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentPreviewMessage = settings.custom_message || (settings.survey_type === 'csat' ? defaultCSATMessage : defaultNPSMessage);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 animate-in fade-in duration-500">
      <div className="space-y-6">
        <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
                <Star className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Pesquisa de Satisfação</CardTitle>
                <CardDescription>
                  Mensure a felicidade dos seus clientes de forma automatizada
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Status Global */}
            <div className={cn(
              "p-6 rounded-[2rem] transition-all duration-300 border-2",
              settings.enabled 
                ? "bg-indigo-50/50 border-indigo-100" 
                : "bg-gray-50 border-gray-100"
            )}>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-bold text-gray-900">Ativação Automática</h4>
                  <p className="text-sm text-gray-500">
                    Enviar pesquisa automaticamente ao encerrar uma conversa
                  </p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
                  className="data-[state=checked]:bg-indigo-600"
                />
              </div>
            </div>

            <div className={cn("grid gap-8 transition-all duration-500", !settings.enabled && "opacity-40 grayscale pointer-events-none")}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tipo de Pesquisa */}
                <div className="space-y-3">
                  <Label className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                    <Layout className="h-4 w-4" />
                    Modelo de Pesquisa
                  </Label>
                  <Select
                    value={settings.survey_type}
                    onValueChange={(value: 'csat' | 'nps') =>
                      setSettings({ ...settings, survey_type: value })
                    }
                  >
                    <SelectTrigger className="h-12 rounded-2xl border-gray-200 focus:ring-indigo-500 transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                      <SelectItem value="csat" className="rounded-xl focus:bg-indigo-50">
                        <div className="flex items-center gap-3 py-1">
                          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-500">
                            <Star className="h-4 w-4 fill-current" />
                          </div>
                          <div>
                            <p className="font-bold">CSAT</p>
                            <p className="text-xs text-gray-400 italic">Satisfação Específica (1-5)</p>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="nps" className="rounded-xl focus:bg-indigo-50">
                        <div className="flex items-center gap-3 py-1">
                          <div className="p-1.5 rounded-lg bg-green-50 text-green-500">
                            <TrendingUp className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold">NPS</p>
                            <p className="text-xs text-gray-400 italic">Lealdade à Marca (0-10)</p>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Delay */}
                <div className="space-y-3">
                  <Label className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Tempo de Espera
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      value={settings.delay_minutes}
                      className="h-12 rounded-2xl border-gray-200 pr-12 font-bold"
                      onChange={(e) => setSettings({ ...settings, delay_minutes: parseInt(e.target.value) || 0 })}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">min</span>
                  </div>
                </div>
              </div>

              {/* Mensagem Customizada */}
              <div className="space-y-3">
                <Label className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Corpo da Mensagem
                </Label>
                <div className="relative">
                   <Textarea
                    placeholder="Deixe vazio para usar o padrão profissional..."
                    value={settings.custom_message}
                    onChange={(e) => setSettings({ ...settings, custom_message: e.target.value })}
                    rows={6}
                    className="rounded-[2rem] border-gray-200 focus:ring-indigo-500 p-6 resize-none shadow-inner"
                  />
                  <div className="absolute top-4 right-4 animate-pulse">
                    <Sparkles className="h-5 w-5 text-indigo-400 opacity-50" />
                  </div>
                </div>
              </div>

              {/* Feedback Condicional */}
              <div className="p-6 rounded-[2rem] bg-gray-50 border-2 border-dashed border-gray-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-bold">Solicitar Comentário</Label>
                    <p className="text-sm text-gray-500">Perguntar o motivo apenas para notas baixas</p>
                  </div>
                  <Switch
                    checked={settings.ask_feedback}
                    onCheckedChange={(checked) => setSettings({ ...settings, ask_feedback: checked })}
                  />
                </div>

                {settings.ask_feedback && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <Input
                      value={settings.feedback_prompt}
                      onChange={(e) => setSettings({ ...settings, feedback_prompt: e.target.value })}
                      className="rounded-xl border-gray-200"
                      placeholder="Ex: O que poderíamos ter feito melhor?"
                    />
                  </div>
                )}
              </div>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={saving} 
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg font-bold shadow-lg shadow-indigo-200 transition-all duration-300 hover:scale-[1.01] active:scale-95"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
              Salvar Configurações
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Preview Section */}
      <div className="lg:sticky lg:top-8 space-y-6">
        <div className="text-center space-y-2">
          <Label className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">
            Preview WhatsApp
          </Label>
        </div>

        <div className="relative mx-auto w-full max-w-[320px] aspect-[9/18.5] bg-gray-900 rounded-[3rem] p-3 shadow-2xl border-[8px] border-gray-800">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-10" />
          
          <div className="w-full h-full bg-[#efeae2] rounded-[2rem] overflow-hidden relative">
             <div className="absolute top-0 w-full h-12 bg-[#075e54] flex items-center px-4 gap-3">
               <div className="w-8 h-8 rounded-full bg-gray-300" />
               <div className="flex-1">
                 <div className="w-24 h-2 bg-white/50 rounded" />
                 <div className="w-16 h-1.5 bg-white/30 rounded mt-1" />
               </div>
             </div>

             <div className="mt-16 px-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="text-[13px] whitespace-pre-wrap leading-relaxed text-gray-800">
                    {currentPreviewMessage}
                  </div>
                  <div className="text-[10px] text-gray-400 text-right mt-1">
                    12:00
                  </div>
                  <div className="absolute left-[-8px] top-0 w-4 h-4 bg-white transform -rotate-45 -z-10" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />
                </div>
             </div>
          </div>
        </div>

        <Card className="bg-indigo-600 text-white border-none rounded-3xl overflow-hidden shadow-xl shadow-indigo-200">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 fill-current" />
              <p className="font-bold">Dica de Especialista</p>
            </div>
            <p className="text-sm text-indigo-50 leading-relaxed">
              Pesquisas enviadas entre 5 a 15 minutos após o atendimento costumam ter 40% mais engajamento.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
