import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Save, FileAudio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

interface TranscriptionConfig {
  id?: string;
  company_id: string;
  provider: 'groq' | 'openai' | 'assemblyai';
  auto_transcribe: boolean;
  language: string;
  model: string;
}

export function TranscriptionSettings() {
  const { currentCompany } = useCompany();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<TranscriptionConfig>({
    company_id: currentCompany?.id || '',
    provider: 'groq',
    auto_transcribe: true,
    language: 'pt',
    model: 'whisper-large-v3',
  });

  useEffect(() => {
    loadConfig();
  }, [currentCompany?.id]);

  const loadConfig = async () => {
    if (!currentCompany?.id) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('transcription_configs')
        .select('*')
        .eq('company_id', currentCompany.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfig(data);
      }
    } catch (error: any) {
      console.error('Error loading config:', error);
      toast({
        title: 'Erro ao carregar configurações',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentCompany?.id) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('transcription_configs')
        .upsert({
          ...config,
          company_id: currentCompany.id,
        });

      if (error) throw error;

      toast({
        title: 'Configurações salvas',
        description: 'As configurações de transcrição foram atualizadas.',
      });
    } catch (error: any) {
      console.error('Error saving config:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileAudio className="w-5 h-5" />
          <CardTitle>Transcrição de Áudios</CardTitle>
        </div>
        <CardDescription>
          Configure a transcrição automática de mensagens de áudio usando IA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto Transcribe Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-transcribe">Transcrição Automática</Label>
            <p className="text-sm text-muted-foreground">
              Transcrever automaticamente todas as mensagens de áudio recebidas
            </p>
          </div>
          <Switch
            id="auto-transcribe"
            checked={config.auto_transcribe}
            onCheckedChange={(checked) =>
              setConfig({ ...config, auto_transcribe: checked })
            }
          />
        </div>

        {/* Provider Selection */}
        <div className="space-y-2">
          <Label htmlFor="provider">Provedor de Transcrição</Label>
          <Select
            value={config.provider}
            onValueChange={(value: 'groq' | 'openai' | 'assemblyai') =>
              setConfig({ ...config, provider: value })
            }
          >
            <SelectTrigger id="provider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="groq">
                Groq (Whisper Large V3) - Recomendado
              </SelectItem>
              <SelectItem value="openai">
                OpenAI (Whisper V1)
              </SelectItem>
              <SelectItem value="assemblyai">
                AssemblyAI
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Groq oferece transcrição rápida e gratuita com alta precisão
          </p>
        </div>

        {/* Language Selection */}
        <div className="space-y-2">
          <Label htmlFor="language">Idioma Padrão</Label>
          <Select
            value={config.language}
            onValueChange={(value) =>
              setConfig({ ...config, language: value })
            }
          >
            <SelectTrigger id="language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Detectar Automaticamente</SelectItem>
              <SelectItem value="pt">Português (PT)</SelectItem>
              <SelectItem value="en">Inglês (EN)</SelectItem>
              <SelectItem value="es">Espanhol (ES)</SelectItem>
              <SelectItem value="fr">Francês (FR)</SelectItem>
              <SelectItem value="de">Alemão (DE)</SelectItem>
              <SelectItem value="it">Italiano (IT)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Escolha o idioma principal dos seus áudios para melhor precisão
          </p>
        </div>

        {/* Model Selection (for Groq) */}
        {config.provider === 'groq' && (
          <div className="space-y-2">
            <Label htmlFor="model">Modelo</Label>
            <Select
              value={config.model}
              onValueChange={(value) =>
                setConfig({ ...config, model: value })
              }
            >
              <SelectTrigger id="model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whisper-large-v3">
                  Whisper Large V3 (Melhor qualidade)
                </SelectItem>
                <SelectItem value="whisper-large-v2">
                  Whisper Large V2
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Info Box */}
        <div className="rounded-lg bg-muted p-4 text-sm">
          <h4 className="font-medium mb-2">Como funciona:</h4>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Áudios recebidos são automaticamente enviados para transcrição</li>
            <li>A transcrição aparece abaixo da mensagem de áudio</li>
            <li>Você pode buscar por palavras nas transcrições</li>
            <li>Transcrições podem ser copiadas com um clique</li>
          </ul>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
