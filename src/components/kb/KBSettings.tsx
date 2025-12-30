import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface KBConfig {
  id?: string;
  company_id: string;
  is_enabled: boolean;
  embedding_provider: string;
  embedding_model: string;
  chunk_size: number;
  chunk_overlap: number;
  top_k: number;
  similarity_threshold: number;
  use_cache: boolean;
  auto_sync_faqs: boolean;
}

export function KBSettings() {
  const { currentCompany } = useCompany();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<KBConfig>({
    company_id: '',
    is_enabled: true,
    embedding_provider: 'openai',
    embedding_model: 'text-embedding-ada-002',
    chunk_size: 500,
    chunk_overlap: 50,
    top_k: 5,
    similarity_threshold: 0.7,
    use_cache: true,
    auto_sync_faqs: false,
  });

  useEffect(() => {
    if (currentCompany?.id) {
      loadSettings();
    }
  }, [currentCompany?.id]);

  const loadSettings = async () => {
    if (!currentCompany?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('kb_configs')
        .select('*')
        .eq('company_id', currentCompany.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data as KBConfig);
      } else {
        // Create default config if not exists
        setSettings(prev => ({ ...prev, company_id: currentCompany.id }));
      }
    } catch (error) {
      console.error('Error loading KB settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentCompany?.id) {
      toast.error('Nenhuma empresa selecionada');
      return;
    }

    try {
      setSaving(true);

      const configData = {
        company_id: currentCompany.id,
        is_enabled: settings.is_enabled,
        embedding_provider: settings.embedding_provider,
        embedding_model: settings.embedding_model,
        chunk_size: settings.chunk_size,
        chunk_overlap: settings.chunk_overlap,
        top_k: settings.top_k,
        similarity_threshold: settings.similarity_threshold,
        use_cache: settings.use_cache,
        auto_sync_faqs: settings.auto_sync_faqs,
      };

      const { error } = await supabase
        .from('kb_configs')
        .upsert(configData, {
          onConflict: 'company_id',
        });

      if (error) throw error;

      toast.success('Configurações salvas com sucesso');
    } catch (error: any) {
      console.error('Error saving KB settings:', error);
      toast.error('Erro ao salvar configurações: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ativar/Desativar KB */}
      <Card>
        <CardHeader>
          <CardTitle>Status do Knowledge Base</CardTitle>
          <CardDescription>
            Ative ou desative o Knowledge Base para esta empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label>Knowledge Base Ativo</Label>
              <p className="text-sm text-muted-foreground">
                Quando ativo, a IA pode usar documentos para responder perguntas
              </p>
            </div>
            <Switch
              checked={settings.is_enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, is_enabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configurações de Embedding</CardTitle>
          <CardDescription>
            Configure como os documentos são processados e indexados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Modelo de Embedding</Label>
              <Select
                value={settings.embedding_model}
                onValueChange={(value) => setSettings({ ...settings, embedding_model: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text-embedding-3-small">
                    OpenAI text-embedding-3-small
                  </SelectItem>
                  <SelectItem value="text-embedding-3-large">
                    OpenAI text-embedding-3-large
                  </SelectItem>
                  <SelectItem value="text-embedding-ada-002">
                    OpenAI text-embedding-ada-002
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tamanho do Chunk (caracteres)</Label>
              <Input
                type="number"
                value={settings.chunk_size}
                onChange={(e) => setSettings({ ...settings, chunk_size: parseInt(e.target.value) || 500 })}
              />
            </div>

            <div className="space-y-2">
              <Label>Overlap entre Chunks</Label>
              <Input
                type="number"
                value={settings.chunk_overlap}
                onChange={(e) =>
                  setSettings({ ...settings, chunk_overlap: parseInt(e.target.value) || 50 })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Top K (Resultados)</Label>
              <Input
                type="number"
                value={settings.top_k}
                onChange={(e) =>
                  setSettings({ ...settings, top_k: parseInt(e.target.value) || 5 })
                }
              />
              <p className="text-xs text-muted-foreground">
                Quantidade de chunks similares a retornar
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comportamento da Busca</CardTitle>
          <CardDescription>Configure como a busca semântica funciona</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Threshold de Similaridade: {settings.similarity_threshold}</Label>
            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={settings.similarity_threshold}
              onChange={(e) =>
                setSettings({ ...settings, similarity_threshold: parseFloat(e.target.value) })
              }
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              0.5 = Mais resultados (menos precisos) | 0.95 = Menos resultados (mais precisos)
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Usar Cache</Label>
              <p className="text-sm text-muted-foreground">
                Cache de respostas para perguntas repetidas
              </p>
            </div>
            <Switch
              checked={settings.use_cache}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, use_cache: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Sincronizar FAQs</Label>
              <p className="text-sm text-muted-foreground">
                Importar automaticamente FAQs para o Knowledge Base
              </p>
            </div>
            <Switch
              checked={settings.auto_sync_faqs}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, auto_sync_faqs: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
