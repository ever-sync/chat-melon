import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyQuery } from '@/hooks/crm/useCompanyQuery';
import {
  Calendar,
  User,
  DollarSign,
  TrendingUp,
  AlertCircle,
  FileText,
  Target,
  Thermometer,
  CheckCircle2,
  Users,
  Briefcase,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import type { Deal } from '@/hooks/crm/useDeals';
import type { TablesInsert } from '@/integrations/supabase/types';

interface DealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: Deal;
  stageId?: string;
  pipelineId?: string;
  defaultContactId?: string;
  onSubmit: (data: TablesInsert<'deals'>) => void;
}

export const DealModal = ({
  open,
  onOpenChange,
  deal,
  stageId,
  pipelineId,
  defaultContactId,
  onSubmit,
}: DealModalProps) => {
  const { companyId } = useCompanyQuery();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors }
  } = useForm<TablesInsert<'deals'>>({
    defaultValues: {
      priority: 'medium',
      temperature: 'warm',
      probability: 50,
      created_at: new Date().toISOString().split('T')[0],
    }
  });

  // Observar o pipeline_id selecionado para buscar stages dinamicamente
  const selectedPipelineId = watch('pipeline_id') || pipelineId;

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('company_id', companyId)
        .order('name');
      return data || [];
    },
    enabled: !!companyId,
  });

  // Buscar funis (pipelines) da empresa
  const { data: pipelines = [] } = useQuery({
    queryKey: ['pipelines', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from('pipelines')
        .select('*')
        .eq('company_id', companyId)
        .order('name');
      return data || [];
    },
    enabled: !!companyId,
  });

  // Buscar etapas do funil selecionado
  const { data: stages = [] } = useQuery({
    queryKey: ['stages', selectedPipelineId],
    queryFn: async () => {
      if (!selectedPipelineId) return [];
      const { data } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('pipeline_id', selectedPipelineId)
        .order('order_index');
      return data || [];
    },
    enabled: !!selectedPipelineId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase.from('profiles').select('*');
      return data || [];
    },
  });

  useEffect(() => {
    if (deal) {
      setValue('title', deal.title);
      setValue('contact_id', deal.contact_id);
      setValue('value', deal.value);
      setValue('expected_close_date', deal.expected_close_date);
      setValue('probability', deal.probability);
      setValue('priority', deal.priority);
      setValue('assigned_to', deal.assigned_to);
      setValue('stage_id', deal.stage_id);
      setValue('pipeline_id', deal.pipeline_id);
      setValue('temperature', deal.temperature);
      setValue('budget_confirmed', deal.budget_confirmed);
      setValue('timeline_confirmed', deal.timeline_confirmed);
      setValue('decision_maker', deal.decision_maker);
      setValue('need_identified', deal.need_identified);
      setValue('competitor', deal.competitor);
      setValue('competitor_strengths', deal.competitor_strengths);
      setValue('our_differentials', deal.our_differentials);
      setValue('next_step', deal.next_step);
      setValue('next_step_date', deal.next_step_date);
      setValue('created_at', deal.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]);
    } else {
      // Pre-fill for new deal
      if (stageId) {
        setValue('stage_id', stageId);
      }
      if (defaultContactId) {
        setValue('contact_id', defaultContactId);
      }
      if (pipelineId) {
        setValue('pipeline_id', pipelineId);
      }
      // Definir data de criação como hoje
      setValue('created_at', new Date().toISOString().split('T')[0]);
    }
  }, [deal, stageId, pipelineId, defaultContactId, setValue]);

  // Limpar etapa quando mudar o funil
  useEffect(() => {
    if (selectedPipelineId && !deal) {
      setValue('stage_id', '');
    }
  }, [selectedPipelineId, setValue, deal]);

  const budgetConfirmed = watch('budget_confirmed');
  const timelineConfirmed = watch('timeline_confirmed');
  const hasDecisionMaker = !!watch('decision_maker');
  const hasNeed = !!watch('need_identified');

  const bantProgress =
    [budgetConfirmed, hasDecisionMaker, hasNeed, timelineConfirmed].filter(Boolean).length * 25;

  const handleFormSubmit = async (data: TablesInsert<'deals'>) => {
    try {
      setIsSubmitting(true);

      // Validação adicional
      if (!companyId) {
        toast.error('Empresa não identificada. Faça login novamente.');
        return;
      }

      if (!data.contact_id) {
        toast.error('Por favor, selecione um contato');
        return;
      }

      if (!data.pipeline_id) {
        toast.error('Por favor, selecione um funil');
        return;
      }

      if (!data.stage_id) {
        toast.error('Por favor, selecione uma etapa');
        return;
      }

      if (!data.created_at) {
        toast.error('Por favor, informe a data de criação');
        return;
      }

      // Validar valor não negativo
      if (data.value && data.value < 0) {
        toast.error('O valor não pode ser negativo');
        return;
      }

      // Validar probabilidade entre 0 e 100
      if (data.probability && (data.probability < 0 || data.probability > 100)) {
        toast.error('A probabilidade deve estar entre 0 e 100');
        return;
      }

      // Garantir que todos os dados necessários estão definidos
      const submitData: any = {
        ...data,
        status: data.status || 'open', // Garantir que status seja 'open' se não definido
      };

      // Limpar campos de data vazios (converter string vazia em null)
      if (submitData.created_at === '') submitData.created_at = null;
      if (submitData.expected_close_date === '') submitData.expected_close_date = null;
      if (submitData.next_step_date === '') submitData.next_step_date = null;

      await onSubmit(submitData as TablesInsert<'deals'>);
      reset();
      onOpenChange(false);
      toast.success(deal ? 'Negócio atualizado com sucesso!' : 'Negócio criado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar negócio:', error);
      toast.error('Erro ao salvar negócio. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">{deal ? 'Editar Negócio' : 'Novo Negócio'}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Preencha os dados para {deal ? 'atualizar' : 'criar'} o negócio
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <Tabs defaultValue="geral" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted/50">
              <TabsTrigger value="geral" className="data-[state=active]:bg-background gap-2">
                <FileText className="h-4 w-4" />
                Geral
              </TabsTrigger>
              <TabsTrigger value="qualificacao" className="data-[state=active]:bg-background gap-2">
                <Target className="h-4 w-4" />
                Qualificação
              </TabsTrigger>
              <TabsTrigger value="competicao" className="data-[state=active]:bg-background gap-2">
                <TrendingUp className="h-4 w-4" />
                Competição
              </TabsTrigger>
              <TabsTrigger value="proximos" className="data-[state=active]:bg-background gap-2">
                <Calendar className="h-4 w-4" />
                Próximos Passos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="geral" className="space-y-5 mt-6">
              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Título *
                </Label>
                <Input
                  id="title"
                  {...register('title', {
                    required: 'O título é obrigatório',
                    minLength: { value: 3, message: 'O título deve ter no mínimo 3 caracteres' }
                  })}
                  placeholder="Ex: Proposta para Cliente X"
                  className={`h-11 ${errors.title ? 'border-red-500' : ''}`}
                />
                {errors.title && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Contato */}
              <div className="space-y-2">
                <Label htmlFor="contact_id" className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Contato *
                </Label>
                <Controller
                  name="contact_id"
                  control={control}
                  rules={{ required: 'Selecione um contato' }}
                  render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger className={`h-11 ${errors.contact_id ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Selecione um contato" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.name || contact.phone_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.contact_id && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.contact_id.message}
                  </p>
                )}
              </div>

              {/* Data de Criação */}
              <div className="space-y-2">
                <Label htmlFor="created_at" className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  Criada em *
                </Label>
                <Input
                  id="created_at"
                  type="date"
                  {...register('created_at', { required: 'A data de criação é obrigatória' })}
                  className={`h-11 ${errors.created_at ? 'border-red-500' : ''}`}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.created_at && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.created_at.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Data de quando o negócio foi criado
                </p>
              </div>

              {/* Valor e Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="value" className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    Valor (R$)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      R$
                    </span>
                    <Input
                      id="value"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('value', {
                        valueAsNumber: true,
                        min: { value: 0, message: 'O valor não pode ser negativo' }
                      })}
                      placeholder="0,00"
                      className={`h-11 pl-10 ${errors.value ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.value && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.value.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expected_close_date" className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    Previsão de Fechamento
                  </Label>
                  <Input
                    id="expected_close_date"
                    type="date"
                    {...register('expected_close_date')}
                    className="h-11"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {/* Probabilidade e Prioridade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="probability" className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    Probabilidade (%)
                  </Label>
                  <div className="relative">
                    <Input
                      id="probability"
                      type="number"
                      min="0"
                      max="100"
                      {...register('probability', {
                        valueAsNumber: true,
                        min: { value: 0, message: 'Mínimo 0%' },
                        max: { value: 100, message: 'Máximo 100%' }
                      })}
                      placeholder="50"
                      className={`h-11 pr-10 ${errors.probability ? 'border-red-500' : ''}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      %
                    </span>
                  </div>
                  {errors.probability && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.probability.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    Prioridade
                  </Label>
                  <Controller
                    name="priority"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value || 'medium'} onValueChange={field.onChange}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">⚪ Baixa</SelectItem>
                          <SelectItem value="medium">🔵 Média</SelectItem>
                          <SelectItem value="high">🟠 Alta</SelectItem>
                          <SelectItem value="urgent">🔴 Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              {/* Funil (Pipeline) */}
              <div className="space-y-2">
                <Label htmlFor="pipeline_id" className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                  Funil *
                </Label>
                <Controller
                  name="pipeline_id"
                  control={control}
                  rules={{ required: 'Selecione um funil' }}
                  render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger className={`h-11 ${errors.pipeline_id ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Selecione um funil" />
                      </SelectTrigger>
                      <SelectContent>
                        {pipelines.map((pipeline) => (
                          <SelectItem key={pipeline.id} value={pipeline.id}>
                            {pipeline.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.pipeline_id && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.pipeline_id.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Selecione o funil de vendas para este negócio
                </p>
              </div>

              {/* Etapa e Responsável */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stage_id" className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-indigo-600" />
                    Etapa *
                  </Label>
                  <Controller
                    name="stage_id"
                    control={control}
                    rules={{ required: 'Selecione uma etapa' }}
                    render={({ field }) => (
                      <Select
                        value={field.value || ''}
                        onValueChange={field.onChange}
                        disabled={!selectedPipelineId}
                      >
                        <SelectTrigger className={`h-11 ${errors.stage_id ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder={selectedPipelineId ? "Selecione uma etapa" : "Selecione um funil primeiro"} />
                        </SelectTrigger>
                        <SelectContent>
                          {stages.length > 0 ? (
                            stages.map((stage) => (
                              <SelectItem key={stage.id} value={stage.id}>
                                {stage.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-stages" disabled>
                              Nenhuma etapa encontrada
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.stage_id && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.stage_id.message}
                    </p>
                  )}
                  {selectedPipelineId && stages.length === 0 && (
                    <p className="text-xs text-orange-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Este funil não possui etapas cadastradas
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assigned_to" className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-cyan-600" />
                    Responsável
                  </Label>
                  <Controller
                    name="assigned_to"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecione um responsável" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              {/* Temperatura */}
              <div className="space-y-2">
                <Label htmlFor="temperature" className="text-sm font-medium flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-red-600" />
                  Temperatura do Lead
                </Label>
                <Controller
                  name="temperature"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || 'warm'} onValueChange={field.onChange}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hot">🔥 Quente - Alta intenção</SelectItem>
                        <SelectItem value="warm">🌡️ Morno - Interesse moderado</SelectItem>
                        <SelectItem value="cold">❄️ Frio - Baixo interesse</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </TabsContent>

            <TabsContent value="qualificacao" className="space-y-5 mt-6">
              {/* Progresso BANT */}
              <div className="rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <Label className="text-base font-semibold">Progresso BANT</Label>
                  </div>
                  <span className="text-2xl font-bold text-primary">{bantProgress}%</span>
                </div>
                <Progress value={bantProgress} className="h-2.5" />
                <p className="text-xs text-muted-foreground mt-2">
                  Budget • Authority • Need • Timeline
                </p>
              </div>

              {/* Budget */}
              <div className={`flex items-center justify-between p-4 border-2 rounded-lg transition-all ${
                watch('budget_confirmed')
                  ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                  : 'border-muted bg-background'
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <DollarSign className={`h-5 w-5 ${watch('budget_confirmed') ? 'text-green-600' : 'text-muted-foreground'}`} />
                    <Label htmlFor="budget_confirmed" className="font-semibold">Budget - Orçamento Confirmado</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    O cliente confirmou ter orçamento disponível?
                  </p>
                </div>
                <Switch
                  id="budget_confirmed"
                  checked={watch('budget_confirmed')}
                  onCheckedChange={(checked) => setValue('budget_confirmed', checked)}
                />
              </div>

              {/* Authority */}
              <div className="space-y-2">
                <Label htmlFor="decision_maker" className="text-sm font-medium flex items-center gap-2">
                  <User className={`h-5 w-5 ${hasDecisionMaker ? 'text-green-600' : 'text-muted-foreground'}`} />
                  Authority - Decisor
                </Label>
                <Input
                  id="decision_maker"
                  {...register('decision_maker')}
                  placeholder="Nome do decisor principal"
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Identifique quem tem autoridade para tomar a decisão
                </p>
              </div>

              {/* Need */}
              <div className="space-y-2">
                <Label htmlFor="need_identified" className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className={`h-5 w-5 ${hasNeed ? 'text-green-600' : 'text-muted-foreground'}`} />
                  Need - Necessidade Identificada
                </Label>
                <Textarea
                  id="need_identified"
                  {...register('need_identified')}
                  placeholder="Descreva a necessidade principal do cliente..."
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Qual problema específico o cliente precisa resolver?
                </p>
              </div>

              {/* Timeline */}
              <div className={`flex items-center justify-between p-4 border-2 rounded-lg transition-all ${
                watch('timeline_confirmed')
                  ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                  : 'border-muted bg-background'
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className={`h-5 w-5 ${watch('timeline_confirmed') ? 'text-green-600' : 'text-muted-foreground'}`} />
                    <Label htmlFor="timeline_confirmed" className="font-semibold">Timeline - Prazo Confirmado</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    O cliente confirmou o prazo para decisão?
                  </p>
                </div>
                <Switch
                  id="timeline_confirmed"
                  checked={watch('timeline_confirmed')}
                  onCheckedChange={(checked) => setValue('timeline_confirmed', checked)}
                />
              </div>
            </TabsContent>

            <TabsContent value="competicao" className="space-y-5 mt-6">
              {/* Concorrente */}
              <div className="space-y-2">
                <Label htmlFor="competitor" className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-red-600" />
                  Concorrente Principal
                </Label>
                <Input
                  id="competitor"
                  {...register('competitor')}
                  placeholder="Nome do concorrente"
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Identifique o principal competidor nesta oportunidade
                </p>
              </div>

              {/* Pontos Fortes */}
              <div className="space-y-2">
                <Label htmlFor="competitor_strengths" className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  Pontos Fortes do Concorrente
                </Label>
                <Textarea
                  id="competitor_strengths"
                  {...register('competitor_strengths')}
                  placeholder="Ex: Preço mais baixo, marca consolidada, presença local..."
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Seja honesto sobre as vantagens do concorrente
                </p>
              </div>

              {/* Nossos Diferenciais */}
              <div className="space-y-2">
                <Label htmlFor="our_differentials" className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Nossos Diferenciais
                </Label>
                <Textarea
                  id="our_differentials"
                  {...register('our_differentials')}
                  placeholder="Ex: Melhor suporte, tecnologia superior, experiência comprovada..."
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Destaque o que torna nossa solução única
                </p>
              </div>

              {/* Dica Visual */}
              <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Dica de Competição
                    </h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Entender a competição ajuda a posicionar melhor sua proposta e antecipar objeções do cliente.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="proximos" className="space-y-5 mt-6">
              {/* Próximo Passo */}
              <div className="space-y-2">
                <Label htmlFor="next_step" className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Próximo Passo
                </Label>
                <Textarea
                  id="next_step"
                  {...register('next_step')}
                  placeholder="Ex: Agendar demonstração do produto, enviar proposta comercial..."
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Defina claramente qual será a próxima ação
                </p>
              </div>

              {/* Data do Próximo Passo */}
              <div className="space-y-2">
                <Label htmlFor="next_step_date" className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  Data do Próximo Passo
                </Label>
                <Input
                  id="next_step_date"
                  type="date"
                  {...register('next_step_date')}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Quando você planeja executar esta ação?
                </p>
              </div>

              {/* Botão Criar Tarefa */}
              <div className="rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 p-4">
                <div className="mb-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-primary" />
                    Automatização de Tarefa
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Crie automaticamente uma tarefa baseada no próximo passo definido
                  </p>
                </div>
                <Button
                  type="button"
                  className="w-full h-11"
                  variant="default"
                  onClick={async () => {
                    const nextStep = watch('next_step');
                    const nextStepDate = watch('next_step_date');
                    const contactId = watch('contact_id');
                    const dealId = deal?.id;

                    // Validações
                    if (!nextStep || !nextStepDate) {
                      toast.error('Preencha o próximo passo e a data para criar a tarefa');
                      return;
                    }

                    if (!contactId) {
                      toast.error('Selecione um contato antes de criar a tarefa');
                      return;
                    }

                    if (!companyId) {
                      toast.error('Empresa não identificada. Faça login novamente.');
                      return;
                    }

                    try {
                      const {
                        data: { user },
                      } = await supabase.auth.getUser();

                      if (!user) {
                        toast.error('Usuário não autenticado');
                        return;
                      }

                      const { error } = await supabase.from('tasks').insert({
                        company_id: companyId,
                        title: nextStep,
                        description: `Tarefa criada automaticamente do negócio: ${watch('title') || 'Novo negócio'}`,
                        task_type: 'follow_up',
                        priority: 'medium',
                        status: 'pending',
                        due_date: nextStepDate,
                        assigned_to: watch('assigned_to') || user.id,
                        contact_id: contactId,
                        deal_id: dealId,
                        created_by: user.id,
                      });

                      if (error) throw error;

                      toast.success('✅ Tarefa criada com sucesso!');
                    } catch (error) {
                      console.error('Erro ao criar tarefa:', error);
                      toast.error('Erro ao criar tarefa. Tente novamente.');
                    }
                  }}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Criar Tarefa Automaticamente
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer com botões */}
          <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="min-w-[100px] h-11"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" className="min-w-[120px] h-11" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {deal ? 'Atualizar' : 'Criar Negócio'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
