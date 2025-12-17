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
import { useState } from 'react';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';

export function KBSettings() {
  const { currentCompany } = useCompany();
  const [settings, setSettings] = useState({
    embeddingModel: 'text-embedding-3-small',
    chunkSize: 500,
    chunkOverlap: 50,
    enableAutoTraining: true,
    maxTokensPerResponse: 1000,
    temperature: 0.7,
  });

  const handleSave = () => {
    toast.success('Configurações salvas com sucesso');
  };

  return (
    <div className="space-y-6">
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
                value={settings.embeddingModel}
                onValueChange={(value) => setSettings({ ...settings, embeddingModel: value })}
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
                value={settings.chunkSize}
                onChange={(e) => setSettings({ ...settings, chunkSize: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label>Overlap entre Chunks</Label>
              <Input
                type="number"
                value={settings.chunkOverlap}
                onChange={(e) =>
                  setSettings({ ...settings, chunkOverlap: parseInt(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Max Tokens por Resposta</Label>
              <Input
                type="number"
                value={settings.maxTokensPerResponse}
                onChange={(e) =>
                  setSettings({ ...settings, maxTokensPerResponse: parseInt(e.target.value) })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comportamento da IA</CardTitle>
          <CardDescription>Configure como a IA responde às perguntas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Treinamento Automático</Label>
              <p className="text-sm text-muted-foreground">
                Reprocessar documentos automaticamente quando alterados
              </p>
            </div>
            <Switch
              checked={settings.enableAutoTraining}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enableAutoTraining: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Temperatura (Criatividade): {settings.temperature}</Label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.temperature}
              onChange={(e) =>
                setSettings({ ...settings, temperature: parseFloat(e.target.value) })
              }
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              0 = Mais preciso e determinístico | 1 = Mais criativo e variado
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Salvar Configurações</Button>
      </div>
    </div>
  );
}
