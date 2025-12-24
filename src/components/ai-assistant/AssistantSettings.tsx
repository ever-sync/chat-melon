import React from 'react';
import {
  Bot,
  Bell,
  Clock,
  Target,
  AlertTriangle,
  Lightbulb,
  Volume2,
  Settings2,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/ui/use-toast';
import { useAssistantSettings } from '@/hooks/ai-assistant/useAssistantSettings';
import {
  AssistantSettings as AssistantSettingsType,
  NotificationLevel,
  AssistantPosition,
} from '@/types/ai-assistant';

interface AssistantSettingsProps {
  companyId: string;
}

export function AssistantSettings({ companyId }: AssistantSettingsProps) {
  const { toast } = useToast();
  const {
    settings,
    isLoading,
    updateSettings,
    isUpdating,
    ensureSettings,
  } = useAssistantSettings();

  const [localSettings, setLocalSettings] = React.useState<Partial<AssistantSettingsType>>({});

  // Inicializar settings locais quando carregar
  React.useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  // Garantir que settings existam
  React.useEffect(() => {
    if (!settings && !isLoading && companyId) {
      ensureSettings(companyId);
    }
  }, [settings, isLoading, companyId, ensureSettings]);

  const handleChange = <K extends keyof AssistantSettingsType>(
    key: K,
    value: AssistantSettingsType[K]
  ) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateSettings(localSettings, {
      onSuccess: () => {
        toast({
          title: 'Configurações salvas!',
          description: 'Suas preferências do assistente foram atualizadas.',
        });
      },
      onError: () => {
        toast({
          title: 'Erro ao salvar',
          description: 'Não foi possível salvar as configurações. Tente novamente.',
          variant: 'destructive',
        });
      },
    });
  };

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  const currentSettings = { ...settings, ...localSettings };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Assistente IA</h3>
            <p className="text-sm text-muted-foreground">
              Configure o comportamento do assistente
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isUpdating}>
          <Save className="h-4 w-4 mr-2" />
          {isUpdating ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>

      {/* Ativação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ativação</CardTitle>
          <CardDescription>
            Habilite ou desabilite o assistente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="enabled">Assistente habilitado</Label>
            </div>
            <Switch
              id="enabled"
              checked={currentSettings.is_enabled}
              onCheckedChange={(checked) => handleChange('is_enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Posição */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Posição do Assistente</CardTitle>
          <CardDescription>
            Escolha onde o botão flutuante aparece
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={currentSettings.position}
            onValueChange={(value) => handleChange('position', value as AssistantPosition)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="bottom-left" id="bottom-left" />
              <Label htmlFor="bottom-left">Canto inferior esquerdo</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="bottom-right" id="bottom-right" />
              <Label htmlFor="bottom-right">Canto inferior direito</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </CardTitle>
          <CardDescription>
            Controle quais alertas você recebe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Nível de notificação */}
          <div className="space-y-3">
            <Label>Nível de notificação</Label>
            <RadioGroup
              value={currentSettings.notification_level}
              onValueChange={(value) => handleChange('notification_level', value as NotificationLevel)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="flex flex-col">
                  <span>Todas</span>
                  <span className="text-xs text-muted-foreground">
                    Receber todas as notificações e alertas
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="important" id="important" />
                <Label htmlFor="important" className="flex flex-col">
                  <span>Importantes</span>
                  <span className="text-xs text-muted-foreground">
                    Apenas alertas de alta prioridade
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="critical" id="critical" />
                <Label htmlFor="critical" className="flex flex-col">
                  <span>Críticas</span>
                  <span className="text-xs text-muted-foreground">
                    Apenas alertas urgentes
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="none" />
                <Label htmlFor="none" className="flex flex-col">
                  <span>Nenhuma</span>
                  <span className="text-xs text-muted-foreground">
                    Desativar todas as notificações
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Tipos de alertas */}
          <div className="space-y-4">
            <Label>Tipos de alertas</Label>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="slow-response">Resposta lenta</Label>
                </div>
                <Switch
                  id="slow-response"
                  checked={currentSettings.alert_slow_response}
                  onCheckedChange={(checked) => handleChange('alert_slow_response', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="quality-issues">Problemas de qualidade</Label>
                </div>
                <Switch
                  id="quality-issues"
                  checked={currentSettings.alert_quality_issues}
                  onCheckedChange={(checked) => handleChange('alert_quality_issues', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="customer-frustration">Cliente frustrado</Label>
                </div>
                <Switch
                  id="customer-frustration"
                  checked={currentSettings.alert_customer_frustration}
                  onCheckedChange={(checked) => handleChange('alert_customer_frustration', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="forgotten">Conversas esquecidas</Label>
                </div>
                <Switch
                  id="forgotten"
                  checked={currentSettings.alert_forgotten_conversations}
                  onCheckedChange={(checked) => handleChange('alert_forgotten_conversations', checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Limites */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Limites Personalizados
          </CardTitle>
          <CardDescription>
            Ajuste os thresholds para alertas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tempo de resposta */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Tempo máximo de resposta</Label>
              <span className="text-sm font-medium">
                {formatSeconds(currentSettings.slow_response_threshold || 300)}
              </span>
            </div>
            <Slider
              value={[currentSettings.slow_response_threshold || 300]}
              onValueChange={([value]) => handleChange('slow_response_threshold', value)}
              min={60}
              max={900}
              step={30}
            />
            <p className="text-xs text-muted-foreground">
              Alerta quando uma conversa fica sem resposta por mais tempo que este limite
            </p>
          </div>

          <Separator />

          {/* Score de qualidade */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Score mínimo de qualidade</Label>
              <span className="text-sm font-medium">
                {currentSettings.quality_threshold || 70}/100
              </span>
            </div>
            <Slider
              value={[currentSettings.quality_threshold || 70]}
              onValueChange={([value]) => handleChange('quality_threshold', value)}
              min={50}
              max={95}
              step={5}
            />
            <p className="text-xs text-muted-foreground">
              Alerta quando o score de qualidade cai abaixo deste valor
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sugestões */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Sugestões
          </CardTitle>
          <CardDescription>
            Escolha quais tipos de sugestões você deseja receber
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">💬</span>
              <Label htmlFor="response-suggestions">Sugestões de resposta</Label>
            </div>
            <Switch
              id="response-suggestions"
              checked={currentSettings.show_response_suggestions}
              onCheckedChange={(checked) => handleChange('show_response_suggestions', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <Label htmlFor="action-suggestions">Sugestões de ação</Label>
            </div>
            <Switch
              id="action-suggestions"
              checked={currentSettings.show_action_suggestions}
              onCheckedChange={(checked) => handleChange('show_action_suggestions', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">💡</span>
              <Label htmlFor="coaching-tips">Dicas de coaching</Label>
            </div>
            <Switch
              id="coaching-tips"
              checked={currentSettings.show_coaching_tips}
              onCheckedChange={(checked) => handleChange('show_coaching_tips', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-9 w-24" />
      </div>
      <Skeleton className="h-32" />
      <Skeleton className="h-40" />
      <Skeleton className="h-64" />
      <Skeleton className="h-48" />
      <Skeleton className="h-40" />
    </div>
  );
}

function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}min`;
}

export default AssistantSettings;
