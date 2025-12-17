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
import { Star, TrendingUp, Loader2 } from 'lucide-react';

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

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const defaultCSATMessage = `Como você avalia nosso atendimento?

Responda com um número de 1 a 5:
⭐ 1 - Muito ruim
⭐⭐ 2 - Ruim  
⭐⭐⭐ 3 - Regular
⭐⭐⭐⭐ 4 - Bom
⭐⭐⭐⭐⭐ 5 - Excelente`;

  const defaultNPSMessage = `De 0 a 10, o quanto você recomendaria nossa empresa?

Responda com um número:
0 - Nunca recomendaria
...
10 - Com certeza recomendaria`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Pesquisa de Satisfação
        </CardTitle>
        <CardDescription>
          Configure pesquisas CSAT ou NPS para medir a satisfação dos clientes após o atendimento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enviar pesquisa ao fechar conversa</Label>
            <p className="text-sm text-muted-foreground">
              Automaticamente envia pesquisa após finalizar atendimento
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
          />
        </div>

        {settings.enabled && (
          <>
            <div className="space-y-2">
              <Label>Tipo de Pesquisa</Label>
              <Select
                value={settings.survey_type}
                onValueChange={(value: 'csat' | 'nps') =>
                  setSettings({ ...settings, survey_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csat">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      CSAT (1-5 estrelas)
                    </div>
                  </SelectItem>
                  <SelectItem value="nps">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      NPS (0-10)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {settings.survey_type === 'csat'
                  ? 'CSAT mede a satisfação com o atendimento específico'
                  : 'NPS mede a probabilidade de recomendar sua empresa'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Delay após fechamento (minutos)</Label>
              <Input
                type="number"
                min={0}
                max={1440}
                value={settings.delay_minutes}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    delay_minutes: parseInt(e.target.value) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Aguarda este tempo antes de enviar a pesquisa
              </p>
            </div>

            <div className="space-y-2">
              <Label>Mensagem da Pesquisa</Label>
              <Textarea
                placeholder={
                  settings.survey_type === 'csat' ? defaultCSATMessage : defaultNPSMessage
                }
                value={settings.custom_message}
                onChange={(e) => setSettings({ ...settings, custom_message: e.target.value })}
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                Deixe vazio para usar a mensagem padrão
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Pedir feedback em notas baixas</Label>
                <p className="text-sm text-muted-foreground">
                  Se nota for baixa, pergunta o que pode melhorar
                </p>
              </div>
              <Switch
                checked={settings.ask_feedback}
                onCheckedChange={(checked) => setSettings({ ...settings, ask_feedback: checked })}
              />
            </div>

            {settings.ask_feedback && (
              <div className="space-y-2">
                <Label>Mensagem de Feedback</Label>
                <Textarea
                  value={settings.feedback_prompt}
                  onChange={(e) => setSettings({ ...settings, feedback_prompt: e.target.value })}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Enviada quando cliente dá nota baixa (CSAT {'<'} 3 ou NPS {'<'} 7)
                </p>
              </div>
            )}
          </>
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Configurações'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
