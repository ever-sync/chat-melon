import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Bot,
  Brain,
  Clock,
  Users,
  MessageSquare,
  Loader2,
  Save,
  Sparkles,
  Settings2,
  AlertTriangle,
} from 'lucide-react';
import { useChannelSettings } from '@/hooks/channels/useChannelSettings';
import type { ChannelSettings, BusinessHours, AutoAssignMethod, Priority } from '@/types/channelSettings';
import { toast } from 'sonner';

interface ChannelSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelId: string;
  channelName: string;
  channelType: string;
}

export function ChannelSettingsModal({
  open,
  onOpenChange,
  channelId,
  channelName,
  channelType,
}: ChannelSettingsModalProps) {
  const { settings, isLoading, updateSettings, isUpdating } = useChannelSettings(channelId);
  const [localSettings, setLocalSettings] = useState<Partial<ChannelSettings>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Merge settings com localSettings
  const currentSettings = { ...settings, ...localSettings };

  const handleChange = (key: keyof ChannelSettings, value: any) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateSettings(localSettings);
      setLocalSettings({});
      setHasChanges(false);
      toast.success('Configurações salvas!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    }
  };

  const handleBusinessHoursChange = (day: keyof BusinessHours, field: string, value: any) => {
    const newBusinessHours = {
      ...(currentSettings.business_hours || {}),
      [day]: {
        ...((currentSettings.business_hours as BusinessHours)?.[day] || {}),
        [field]: value,
      },
    };
    handleChange('business_hours', newBusinessHours);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Configurar {channelName}
          </DialogTitle>
          <DialogDescription>
            Configure Bot, IA, horário de atendimento e regras de roteamento
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="bot" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="bot" className="flex items-center gap-1">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">Bot</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-1">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">IA</span>
            </TabsTrigger>
            <TabsTrigger value="hours" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Horário</span>
            </TabsTrigger>
            <TabsTrigger value="routing" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Roteamento</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            {/* Bot Settings */}
            <TabsContent value="bot" className="space-y-4 m-0">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Chatbot</CardTitle>
                      <CardDescription>
                        Configure respostas automáticas e fluxos de conversa
                      </CardDescription>
                    </div>
                    <Switch
                      checked={currentSettings.bot_enabled}
                      onCheckedChange={(checked) => handleChange('bot_enabled', checked)}
                    />
                  </div>
                </CardHeader>
                {currentSettings.bot_enabled && (
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Mensagem de Boas-vindas</Label>
                      <Textarea
                        placeholder="Olá! Seja bem-vindo. Como posso ajudar?"
                        value={currentSettings.bot_welcome_message || ''}
                        onChange={(e) => handleChange('bot_welcome_message', e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Mensagem de Fallback</Label>
                      <Textarea
                        placeholder="Desculpe, não entendi. Um atendente irá ajudá-lo em breve."
                        value={currentSettings.bot_fallback_message || ''}
                        onChange={(e) => handleChange('bot_fallback_message', e.target.value)}
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground">
                        Mensagem enviada quando o bot não entende a intenção
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Palavras-chave para Transferência</Label>
                      <Input
                        placeholder="atendente, humano, pessoa"
                        value={(currentSettings.bot_transfer_to_human_keywords || []).join(', ')}
                        onChange={(e) =>
                          handleChange(
                            'bot_transfer_to_human_keywords',
                            e.target.value.split(',').map((k) => k.trim()).filter(Boolean)
                          )
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Separe as palavras por vírgula
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </TabsContent>

            {/* AI Settings */}
            <TabsContent value="ai" className="space-y-4 m-0">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        Inteligência Artificial
                      </CardTitle>
                      <CardDescription>
                        Use IA para sugestões, categorização e respostas automáticas
                      </CardDescription>
                    </div>
                    <Switch
                      checked={currentSettings.ai_enabled}
                      onCheckedChange={(checked) => handleChange('ai_enabled', checked)}
                    />
                  </div>
                </CardHeader>
                {currentSettings.ai_enabled && (
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Modelo</Label>
                        <Select
                          value={currentSettings.ai_model || 'gpt-4o-mini'}
                          onValueChange={(value) => handleChange('ai_model', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpt-4o-mini">GPT-4o Mini (Rápido)</SelectItem>
                            <SelectItem value="gpt-4o">GPT-4o (Avançado)</SelectItem>
                            <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                            <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                            <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Max Tokens</Label>
                        <Input
                          type="number"
                          value={currentSettings.ai_max_tokens || 500}
                          onChange={(e) => handleChange('ai_max_tokens', parseInt(e.target.value))}
                          min={100}
                          max={4000}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Temperatura: {currentSettings.ai_temperature || 0.7}</Label>
                      <Slider
                        value={[currentSettings.ai_temperature || 0.7]}
                        onValueChange={([value]) => handleChange('ai_temperature', value)}
                        min={0}
                        max={1}
                        step={0.1}
                      />
                      <p className="text-xs text-muted-foreground">
                        Menor = mais preciso, Maior = mais criativo
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Prompt do Sistema</Label>
                      <Textarea
                        placeholder="Você é um assistente de atendimento da empresa X. Seja cordial e ajude os clientes..."
                        value={currentSettings.ai_system_prompt || ''}
                        onChange={(e) => handleChange('ai_system_prompt', e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">Responder Automaticamente</p>
                          <p className="text-xs text-muted-foreground">IA responde sem intervenção</p>
                        </div>
                        <Switch
                          checked={currentSettings.ai_auto_respond}
                          onCheckedChange={(checked) => handleChange('ai_auto_respond', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">Sugerir Respostas</p>
                          <p className="text-xs text-muted-foreground">Mostra sugestões ao agente</p>
                        </div>
                        <Switch
                          checked={currentSettings.ai_suggest_responses}
                          onCheckedChange={(checked) => handleChange('ai_suggest_responses', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">Categorizar Automaticamente</p>
                          <p className="text-xs text-muted-foreground">Classifica o assunto</p>
                        </div>
                        <Switch
                          checked={currentSettings.ai_auto_categorize}
                          onCheckedChange={(checked) => handleChange('ai_auto_categorize', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">Análise de Sentimento</p>
                          <p className="text-xs text-muted-foreground">Detecta humor do cliente</p>
                        </div>
                        <Switch
                          checked={currentSettings.ai_sentiment_analysis}
                          onCheckedChange={(checked) => handleChange('ai_sentiment_analysis', checked)}
                        />
                      </div>
                    </div>

                    {currentSettings.ai_auto_respond && (
                      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                        <p className="text-xs text-amber-800">
                          Com resposta automática ativada, a IA responderá sem supervisão humana.
                          Certifique-se de configurar um bom prompt do sistema.
                        </p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            </TabsContent>

            {/* Business Hours */}
            <TabsContent value="hours" className="space-y-4 m-0">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Horário de Atendimento</CardTitle>
                      <CardDescription>
                        Defina quando sua equipe está disponível
                      </CardDescription>
                    </div>
                    <Switch
                      checked={currentSettings.business_hours_enabled}
                      onCheckedChange={(checked) => handleChange('business_hours_enabled', checked)}
                    />
                  </div>
                </CardHeader>
                {currentSettings.business_hours_enabled && (
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Fuso Horário</Label>
                      <Select
                        value={currentSettings.timezone || 'America/Sao_Paulo'}
                        onValueChange={(value) => handleChange('timezone', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                          <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                          <SelectItem value="America/Fortaleza">Fortaleza (GMT-3)</SelectItem>
                          <SelectItem value="America/Recife">Recife (GMT-3)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map((day) => {
                        const dayNames = {
                          monday: 'Segunda',
                          tuesday: 'Terça',
                          wednesday: 'Quarta',
                          thursday: 'Quinta',
                          friday: 'Sexta',
                          saturday: 'Sábado',
                          sunday: 'Domingo',
                        };
                        const daySettings = (currentSettings.business_hours as BusinessHours)?.[day];

                        return (
                          <div key={day} className="flex items-center gap-3 p-2 border rounded-lg">
                            <Switch
                              checked={daySettings?.enabled}
                              onCheckedChange={(checked) =>
                                handleBusinessHoursChange(day, 'enabled', checked)
                              }
                            />
                            <span className="w-20 text-sm font-medium">{dayNames[day]}</span>
                            {daySettings?.enabled && (
                              <>
                                <Input
                                  type="time"
                                  value={daySettings?.start || '09:00'}
                                  onChange={(e) =>
                                    handleBusinessHoursChange(day, 'start', e.target.value)
                                  }
                                  className="w-28"
                                />
                                <span className="text-muted-foreground">até</span>
                                <Input
                                  type="time"
                                  value={daySettings?.end || '18:00'}
                                  onChange={(e) =>
                                    handleBusinessHoursChange(day, 'end', e.target.value)
                                  }
                                  className="w-28"
                                />
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="space-y-2">
                      <Label>Mensagem Fora do Horário</Label>
                      <Textarea
                        placeholder="Estamos fora do horário de atendimento. Retornaremos em breve!"
                        value={currentSettings.outside_hours_message || ''}
                        onChange={(e) => handleChange('outside_hours_message', e.target.value)}
                        rows={2}
                      />
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Welcome/Away Messages */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Mensagens Automáticas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 mr-4">
                      <p className="text-sm font-medium">Mensagem de Boas-vindas</p>
                      <Input
                        placeholder="Olá! Bem-vindo ao nosso atendimento..."
                        value={currentSettings.welcome_message || ''}
                        onChange={(e) => handleChange('welcome_message', e.target.value)}
                        className="mt-2"
                        disabled={!currentSettings.welcome_message_enabled}
                      />
                    </div>
                    <Switch
                      checked={currentSettings.welcome_message_enabled}
                      onCheckedChange={(checked) => handleChange('welcome_message_enabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 mr-4">
                      <p className="text-sm font-medium">Mensagem de Ausência</p>
                      <Input
                        placeholder="No momento estamos ocupados. Por favor, aguarde..."
                        value={currentSettings.away_message || ''}
                        onChange={(e) => handleChange('away_message', e.target.value)}
                        className="mt-2"
                        disabled={!currentSettings.away_message_enabled}
                      />
                    </div>
                    <Switch
                      checked={currentSettings.away_message_enabled}
                      onCheckedChange={(checked) => handleChange('away_message_enabled', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Routing Settings */}
            <TabsContent value="routing" className="space-y-4 m-0">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Atribuição Automática</CardTitle>
                      <CardDescription>
                        Distribua conversas automaticamente entre agentes
                      </CardDescription>
                    </div>
                    <Switch
                      checked={currentSettings.auto_assign_enabled}
                      onCheckedChange={(checked) => handleChange('auto_assign_enabled', checked)}
                    />
                  </div>
                </CardHeader>
                {currentSettings.auto_assign_enabled && (
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Método de Distribuição</Label>
                      <Select
                        value={currentSettings.auto_assign_method || 'round_robin'}
                        onValueChange={(value) => handleChange('auto_assign_method', value as AutoAssignMethod)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="round_robin">
                            Round Robin (alternado)
                          </SelectItem>
                          <SelectItem value="least_busy">
                            Menos Ocupado
                          </SelectItem>
                          <SelectItem value="random">
                            Aleatório
                          </SelectItem>
                          <SelectItem value="specific_user">
                            Usuário Específico
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* SLA Settings */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">SLA (Acordo de Nível de Serviço)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Prioridade Padrão</Label>
                      <Select
                        value={currentSettings.default_priority || 'normal'}
                        onValueChange={(value) => handleChange('default_priority', value as Priority)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Primeira Resposta (minutos)</Label>
                      <Input
                        type="number"
                        value={currentSettings.sla_first_response_minutes || 30}
                        onChange={(e) =>
                          handleChange('sla_first_response_minutes', parseInt(e.target.value))
                        }
                        min={1}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Resolução (minutos)</Label>
                    <Input
                      type="number"
                      value={currentSettings.sla_resolution_minutes || 480}
                      onChange={(e) =>
                        handleChange('sla_resolution_minutes', parseInt(e.target.value))
                      }
                      min={1}
                    />
                    <p className="text-xs text-muted-foreground">
                      Tempo máximo esperado para resolver a conversa
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            {hasChanges && (
              <Badge variant="secondary" className="text-amber-600 bg-amber-50">
                Alterações não salvas
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
