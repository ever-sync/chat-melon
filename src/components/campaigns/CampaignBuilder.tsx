import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Send, Calendar } from 'lucide-react';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useSegments } from '@/hooks/useSegments';
import { useInstanceHealth } from '@/hooks/useInstanceHealth';
import { useVariables } from '@/hooks/useVariables';
import { useCustomFields } from '@/hooks/useCustomFields';
import { useCompanyQuery } from '@/hooks/crm/useCompanyQuery';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertTriangle, Info, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CampaignValidation } from './CampaignValidation';

interface CampaignBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CampaignBuilder({ open, onOpenChange }: CampaignBuilderProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    message_content: '',
    message_type: 'text' as const,
    segment_id: '',
    sending_rate: 10,
    schedule_at: '',
    business_hours_only: false,
    business_hours_start: '09:00',
    business_hours_end: '18:00',
  });

  const { createCampaign, startCampaign } = useCampaigns();
  const { segments } = useSegments();
  const { instances, refetch: refetchInstances } = useInstanceHealth();
  const { companyId } = useCompanyQuery();
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Verificar status real da instância chamando a Evolution API
  const checkInstanceStatus = async () => {
    if (!companyId) return;

    setCheckingStatus(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await supabase.functions.invoke('evolution-instance-manager', {
        body: {
          action: 'check-status',
          companyId,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) {
        toast.error('Erro ao verificar status');
      } else if (response.data?.isConnected) {
        toast.success('Instância conectada!');
      } else {
        toast.info(`Status: ${response.data?.status || 'desconhecido'}`);
      }

      // Atualizar cache local
      await refetchInstances();
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      toast.error('Erro ao verificar status');
    } finally {
      setCheckingStatus(false);
    }
  };

  // Atualizar status das instâncias quando o modal abrir
  useEffect(() => {
    if (open) {
      refetchInstances();
    }
  }, [open, refetchInstances]);

  const { variables: companyVariables } = useVariables();
  const { fields: customFields } = useCustomFields('contact');

  const selectedSegment = segments.find((s) => s.id === formData.segment_id);

  // Variáveis padrão do sistema (campos do contato)
  const defaultVariables = [
    { key: 'nome', label: 'Nome do Contato', description: 'Nome completo do contato' },
    { key: 'primeiro_nome', label: 'Primeiro Nome', description: 'Primeiro nome do contato' },
    { key: 'telefone', label: 'Telefone', description: 'Número de telefone' },
    { key: 'email', label: 'Email', description: 'Email do contato' },
    { key: 'empresa', label: 'Empresa', description: 'Nome da empresa (se for contato PJ)' },
  ];

  // Inserir variável no texto
  const insertVariable = (key: string) => {
    const variable = `{{${key}}}`;
    setFormData({ ...formData, message_content: formData.message_content + variable });
  };

  // Renderizar preview com variáveis substituídas
  const renderPreview = (text: string) => {
    let preview = text;
    // Substituir variáveis padrão com exemplos
    preview = preview.replace(/\{\{nome\}\}/g, 'João Silva');
    preview = preview.replace(/\{\{primeiro_nome\}\}/g, 'João');
    preview = preview.replace(/\{\{telefone\}\}/g, '(11) 99999-9999');
    preview = preview.replace(/\{\{email\}\}/g, 'joao@email.com');
    preview = preview.replace(/\{\{empresa\}\}/g, 'Empresa ABC');

    // Substituir variáveis da empresa
    companyVariables.forEach(v => {
      preview = preview.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'g'), v.value);
    });

    // Substituir campos personalizados com placeholder
    customFields.forEach(cf => {
      preview = preview.replace(new RegExp(`\\{\\{${cf.field_name}\\}\\}`, 'g'), `[${cf.field_label}]`);
    });

    return preview || 'Sua mensagem aparecerá aqui...';
  };

  const handleSubmit = async (startNow: boolean) => {
    // Validate instance connection
    const connectedInstances = instances.filter((i) => i.is_connected);
    if (connectedInstances.length === 0) {
      toast.error('Nenhuma instância WhatsApp conectada', {
        description: 'Conecte uma instância WhatsApp antes de iniciar a campanha.',
      });
      return;
    }

    try {
      const campaign = await createCampaign.mutateAsync({
        ...formData,
        status: startNow ? 'running' : 'scheduled',
        schedule_at: startNow ? undefined : formData.schedule_at || undefined,
      });

      if (startNow && campaign) {
        await startCampaign.mutateAsync(campaign.id);
      }

      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      name: '',
      description: '',
      message_content: '',
      message_type: 'text',
      segment_id: '',
      sending_rate: 10,
      schedule_at: '',
      business_hours_only: false,
      business_hours_start: '09:00',
      business_hours_end: '18:00',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Campanha - Etapa {step} de 5</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Configuration */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>1. Configuração</CardTitle>
                <CardDescription>Defina as informações básicas da campanha</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome da Campanha *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Promoção Black Friday"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva o objetivo desta campanha..."
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Message */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>2. Mensagem</CardTitle>
                <CardDescription>Crie a mensagem que será enviada</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="message_type">Tipo de Mensagem</Label>
                  <Select
                    value={formData.message_type}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, message_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="image">Imagem</SelectItem>
                      <SelectItem value="video">Vídeo</SelectItem>
                      <SelectItem value="document">Documento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="message_content">Conteúdo da Mensagem *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Info className="h-4 w-4 mr-2" />
                          Inserir Variável
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="end">
                        <div className="p-3 border-b">
                          <h4 className="font-medium text-sm">Variáveis Disponíveis</h4>
                          <p className="text-xs text-muted-foreground">Clique para inserir</p>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {/* Variáveis Padrão */}
                          <div className="p-2">
                            <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                              Dados do Contato
                            </div>
                            {defaultVariables.map((v) => (
                              <button
                                key={v.key}
                                onClick={() => insertVariable(v.key)}
                                className="w-full flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-muted text-left"
                              >
                                <span>{v.label}</span>
                                <Badge variant="secondary" className="text-xs font-mono">
                                  {`{{${v.key}}}`}
                                </Badge>
                              </button>
                            ))}
                          </div>

                          {/* Variáveis da Empresa */}
                          {companyVariables.length > 0 && (
                            <div className="p-2 border-t">
                              <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                                Variáveis da Empresa
                              </div>
                              {companyVariables.map((v) => (
                                <button
                                  key={v.key}
                                  onClick={() => insertVariable(v.key)}
                                  className="w-full flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-muted text-left"
                                >
                                  <div>
                                    <span>{v.label}</span>
                                    <span className="text-xs text-muted-foreground ml-2">= {v.value}</span>
                                  </div>
                                  <Badge variant="secondary" className="text-xs font-mono">
                                    {`{{${v.key}}}`}
                                  </Badge>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Campos Personalizados */}
                          {customFields.length > 0 && (
                            <div className="p-2 border-t">
                              <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                                Campos Personalizados
                              </div>
                              {customFields.map((cf) => (
                                <button
                                  key={cf.id}
                                  onClick={() => insertVariable(cf.field_name)}
                                  className="w-full flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-muted text-left"
                                >
                                  <span>{cf.field_label}</span>
                                  <Badge variant="outline" className="text-xs font-mono">
                                    {`{{${cf.field_name}}}`}
                                  </Badge>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Textarea
                    id="message_content"
                    value={formData.message_content}
                    onChange={(e) => setFormData({ ...formData, message_content: e.target.value })}
                    placeholder="Olá {{nome}}, tudo bem?&#10;&#10;Temos uma promoção especial para você..."
                    rows={8}
                  />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {defaultVariables.slice(0, 3).map((v) => (
                      <Badge
                        key={v.key}
                        variant="secondary"
                        className="cursor-pointer hover:bg-secondary/80 text-xs"
                        onClick={() => insertVariable(v.key)}
                      >
                        {`{{${v.key}}}`}
                      </Badge>
                    ))}
                    {companyVariables.slice(0, 2).map((v) => (
                      <Badge
                        key={v.key}
                        variant="outline"
                        className="cursor-pointer hover:bg-muted text-xs"
                        onClick={() => insertVariable(v.key)}
                      >
                        {`{{${v.key}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="text-sm font-medium mb-2">Preview:</div>
                  <div className="bg-background rounded-lg p-3 whitespace-pre-wrap">
                    {renderPreview(formData.message_content)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Recipients */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>3. Destinatários</CardTitle>
                <CardDescription>Selecione para quem enviar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="segment">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="segment">Segmento</TabsTrigger>
                    <TabsTrigger value="filter">Filtro Personalizado</TabsTrigger>
                  </TabsList>

                  <TabsContent value="segment" className="space-y-4">
                    <div>
                      <Label>Selecionar Segmento</Label>
                      <Select
                        value={formData.segment_id}
                        onValueChange={(value) => setFormData({ ...formData, segment_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha um segmento..." />
                        </SelectTrigger>
                        <SelectContent>
                          {segments.map((segment) => (
                            <SelectItem key={segment.id} value={segment.id}>
                              {segment.name} ({segment.contact_count} contatos)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedSegment && (
                      <div className="p-4 bg-primary/10 rounded-lg">
                        <div className="text-sm font-medium">
                          📊 Esta campanha será enviada para{' '}
                          <span className="text-primary font-bold">
                            {selectedSegment.contact_count} contatos
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {selectedSegment.description}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="filter">
                    <div className="text-center py-8 text-muted-foreground">
                      Construtor de filtros em breve...
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Schedule */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>4. Agendamento</CardTitle>
                <CardDescription>Quando enviar as mensagens</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="schedule_at">Data e Hora (opcional)</Label>
                  <Input
                    id="schedule_at"
                    type="datetime-local"
                    value={formData.schedule_at}
                    onChange={(e) => setFormData({ ...formData, schedule_at: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Deixe vazio para enviar imediatamente
                  </p>
                </div>

                <div>
                  <Label htmlFor="sending_rate">Taxa de Envio (mensagens por minuto)</Label>
                  <Input
                    id="sending_rate"
                    type="number"
                    min={1}
                    max={60}
                    value={formData.sending_rate}
                    onChange={(e) =>
                      setFormData({ ...formData, sending_rate: parseInt(e.target.value) })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Recomendado: 10-20 msgs/min para evitar bloqueios
                  </p>
                </div>

                {/* Instance Health Warnings */}
                {instances.length > 0 &&
                  instances.some((i) => {
                    const daysSinceCreation = Math.floor(
                      (Date.now() - new Date(i.created_at).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return daysSinceCreation < 7;
                  }) && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-blue-500">
                            Instância Nova Detectada
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            Sua instância foi criada recentemente. Recomendamos começar com taxa
                            menor (5-10 msgs/min) e aumentar gradualmente nos próximos dias para
                            evitar bloqueios do WhatsApp.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="business_hours_only">Apenas em Horário Comercial</Label>
                      <p className="text-xs text-muted-foreground">
                        Pausa automaticamente fora do horário e retoma quando entrar no período
                      </p>
                    </div>
                    <input
                      id="business_hours_only"
                      type="checkbox"
                      checked={formData.business_hours_only}
                      onChange={(e) =>
                        setFormData({ ...formData, business_hours_only: e.target.checked })
                      }
                      className="h-4 w-4"
                    />
                  </div>

                  {formData.business_hours_only && (
                    <div className="grid grid-cols-2 gap-4 pl-4">
                      <div>
                        <Label htmlFor="business_hours_start">Início</Label>
                        <Input
                          id="business_hours_start"
                          type="time"
                          value={formData.business_hours_start}
                          onChange={(e) =>
                            setFormData({ ...formData, business_hours_start: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="business_hours_end">Fim</Label>
                        <Input
                          id="business_hours_end"
                          type="time"
                          value={formData.business_hours_end}
                          onChange={(e) =>
                            setFormData({ ...formData, business_hours_end: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <Card>
              <CardHeader>
                <CardTitle>5. Revisão</CardTitle>
                <CardDescription>Confira todos os detalhes antes de enviar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Nome:</span>
                    <span className="font-medium">{formData.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Destinatários:</span>
                    <span className="font-medium">
                      {selectedSegment?.contact_count || 0} contatos
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Taxa de envio:</span>
                    <span className="font-medium">{formData.sending_rate} msgs/min</span>
                  </div>
                  {formData.business_hours_only && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Horário comercial:</span>
                      <span className="font-medium">
                        {formData.business_hours_start} - {formData.business_hours_end}
                      </span>
                    </div>
                  )}
                  {formData.schedule_at && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Agendado para:</span>
                      <span className="font-medium">
                        {new Date(formData.schedule_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  )}

                  {formData.message_content.length > 1000 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mt-4">
                      <div className="flex items-start gap-2">
                        <span className="text-yellow-500">⚠️</span>
                        <div>
                          <p className="text-sm font-medium text-yellow-500">
                            Mensagem Muito Longa
                          </p>
                          <p className="text-xs text-yellow-600 dark:text-yellow-400">
                            Sua mensagem tem {formData.message_content.length} caracteres.
                            Recomendamos manter abaixo de 1000 caracteres para melhor
                            entregabilidade.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm font-medium mb-2">Mensagem:</div>
                  <div className="text-sm whitespace-pre-wrap">{formData.message_content}</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {formData.message_content.length} caracteres
                  </div>
                </div>

                {/* Instance Connection Warning */}
                {instances.filter((i) => i.is_connected).length === 0 && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-500">
                            Instância WhatsApp Desconectada
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            Nenhuma instância WhatsApp está conectada. Conecte uma instância em
                            Configurações antes de iniciar a campanha.
                          </p>
                          {instances.length > 0 && instances[0].instance_status && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Status atual: {instances[0].instance_status}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={checkInstanceStatus}
                        disabled={checkingStatus}
                        className="shrink-0"
                      >
                        <RefreshCw className={`h-4 w-4 mr-1 ${checkingStatus ? 'animate-spin' : ''}`} />
                        {checkingStatus ? 'Verificando...' : 'Verificar'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Instance Connected - Show status */}
                {instances.filter((i) => i.is_connected).length > 0 && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        Instância WhatsApp Conectada: {instances.find((i) => i.is_connected)?.instance_name}
                      </span>
                    </div>
                  </div>
                )}

                {/* Validation Warnings */}
                <CampaignValidation
                  messageLength={formData.message_content.length}
                  sendingRate={formData.sending_rate}
                  totalContacts={selectedSegment?.contact_count || 0}
                  isNewInstance={
                    instances[0] &&
                    Math.floor(
                      (Date.now() - new Date(instances[0].created_at).getTime()) /
                        (1000 * 60 * 60 * 24)
                    ) < 7
                  }
                  instanceDaysSinceCreation={
                    instances[0]
                      ? Math.floor(
                          (Date.now() - new Date(instances[0].created_at).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )
                      : 0
                  }
                />
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 1}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            {step < 5 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !formData.name) ||
                  (step === 2 && !formData.message_content) ||
                  (step === 3 && !formData.segment_id)
                }
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleSubmit(false)}
                  disabled={
                    !formData.name ||
                    !formData.message_content ||
                    !formData.segment_id ||
                    instances.filter((i) => i.is_connected).length === 0
                  }
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar
                </Button>
                <Button
                  onClick={() => handleSubmit(true)}
                  disabled={
                    !formData.name ||
                    !formData.message_content ||
                    !formData.segment_id ||
                    instances.filter((i) => i.is_connected).length === 0
                  }
                >
                  <Send className="h-4 w-4 mr-2" />
                  Iniciar Agora
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
