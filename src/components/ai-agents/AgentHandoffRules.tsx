import { useState } from 'react';
import { useAIAgentHandoffRules, useCreateHandoffRule } from '@/hooks/ai-agents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  AlertTriangle,
  MessageSquare,
  Frown,
  HelpCircle,
  Clock,
  Target,
} from 'lucide-react';
import { AIAgent, AIAgentHandoffRule, HandoffCondition } from '@/types/ai-agents';
import { cn } from '@/lib/utils';

interface AgentHandoffRulesProps {
  agent: AIAgent;
}

const CONDITION_TYPES = {
  keyword: { label: 'Palavra-chave', icon: MessageSquare, description: 'Cliente menciona uma palavra específica' },
  sentiment: { label: 'Sentimento', icon: Frown, description: 'Detecta frustração ou insatisfação' },
  confidence: { label: 'Confiança Baixa', icon: HelpCircle, description: 'Agente não tem certeza da resposta' },
  messages_count: { label: 'Muitas Mensagens', icon: Clock, description: 'Conversa está longa demais' },
  intent: { label: 'Intenção', icon: Target, description: 'Cliente quer algo específico' },
};

const HANDOFF_TEMPLATES = [
  {
    name: 'Falar com Humano',
    conditions: [{ type: 'keyword', value: 'falar com humano,atendente,pessoa,humano' }],
    pre_handoff_message: 'Claro! Vou transferir você para um de nossos atendentes. Um momento...',
  },
  {
    name: 'Cliente Frustrado',
    conditions: [{ type: 'sentiment', operator: 'equals', value: 'negative', consecutive: 2 }],
    pre_handoff_message: 'Percebo que esta situação está sendo frustrante. Vou conectar você com um especialista para resolver isso rapidamente.',
  },
  {
    name: 'Baixa Confiança',
    conditions: [{ type: 'confidence', operator: 'less_than', value: 0.6 }],
    pre_handoff_message: 'Esta é uma questão que merece atenção especial. Vou transferir para um especialista que poderá ajudar melhor.',
  },
  {
    name: 'Conversa Longa',
    conditions: [{ type: 'messages_count', operator: 'greater_than', value: 15 }],
    pre_handoff_message: 'Vejo que temos bastante a discutir. Deixe-me conectar você com um atendente que poderá dar continuidade de forma mais completa.',
  },
  {
    name: 'Reclamação',
    conditions: [{ type: 'intent', value: 'complaint' }],
    pre_handoff_message: 'Entendo sua preocupação. Vou encaminhar para nossa equipe responsável para resolver isso da melhor forma.',
  },
];

export function AgentHandoffRules({ agent }: AgentHandoffRulesProps) {
  const { data: rules, isLoading } = useAIAgentHandoffRules(agent.id);
  const createRule = useCreateHandoffRule();

  const [showAddDialog, setShowAddDialog] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 1,
    conditions: [] as HandoffCondition[],
    target_type: 'queue' as 'queue' | 'specific_agent' | 'team' | 'round_robin',
    target_queue: '',
    pre_handoff_message: '',
    handoff_message: '',
    include_conversation_summary: true,
    include_collected_data: true,
    include_sentiment_history: true,
  });

  const [conditionType, setConditionType] = useState<keyof typeof CONDITION_TYPES>('keyword');
  const [conditionValue, setConditionValue] = useState('');

  const handleCreate = async () => {
    await createRule.mutateAsync({
      agent_id: agent.id,
      name: formData.name,
      description: formData.description || undefined,
      priority: formData.priority,
      is_enabled: true,
      conditions: formData.conditions,
      target_type: formData.target_type,
      target_queue: formData.target_queue || undefined,
      pre_handoff_message: formData.pre_handoff_message || undefined,
      handoff_message: formData.handoff_message || undefined,
      collect_data_before: false,
      data_to_collect: [],
      include_conversation_summary: formData.include_conversation_summary,
      include_collected_data: formData.include_collected_data,
      include_sentiment_history: formData.include_sentiment_history,
    });

    setShowAddDialog(false);
    resetForm();
  };

  const handleAddCondition = () => {
    if (!conditionValue) return;

    const newCondition: HandoffCondition = {
      type: conditionType,
      value: conditionValue,
    };

    if (conditionType === 'confidence' || conditionType === 'messages_count') {
      newCondition.operator = 'less_than';
      newCondition.value = parseFloat(conditionValue);
    }

    setFormData({
      ...formData,
      conditions: [...formData.conditions, newCondition],
    });
    setConditionValue('');
  };

  const handleRemoveCondition = (index: number) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index),
    });
  };

  const handleUseTemplate = (template: typeof HANDOFF_TEMPLATES[0]) => {
    setFormData({
      ...formData,
      name: template.name,
      conditions: template.conditions as HandoffCondition[],
      pre_handoff_message: template.pre_handoff_message,
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      priority: 1,
      conditions: [],
      target_type: 'queue',
      target_queue: '',
      pre_handoff_message: '',
      handoff_message: '',
      include_conversation_summary: true,
      include_collected_data: true,
      include_sentiment_history: true,
    });
    setConditionValue('');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Carregando regras de handoff...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Regras de Handoff
              </CardTitle>
              <CardDescription>
                Configure quando e como transferir para atendentes humanos
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Regra
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!rules?.length ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma regra de handoff</h3>
              <p className="text-muted-foreground mb-4">
                Configure quando o agente deve transferir para um humano
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeira Regra
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={cn(
                    'flex items-center justify-between p-4 border rounded-lg',
                    rule.is_enabled ? 'bg-white' : 'bg-gray-50 opacity-60'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{rule.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          Prioridade {rule.priority}
                        </Badge>
                      </div>
                      {rule.description && (
                        <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {rule.conditions.map((cond, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {CONDITION_TYPES[cond.type as keyof typeof CONDITION_TYPES]?.label || cond.type}
                            {': '}
                            {typeof cond.value === 'string'
                              ? cond.value.split(',').slice(0, 2).join(', ')
                              : cond.value}
                            {typeof cond.value === 'string' && cond.value.split(',').length > 2 && '...'}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {rule.times_triggered} transferências realizadas
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch checked={rule.is_enabled} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Adicionar Regra */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Regra de Handoff</DialogTitle>
            <DialogDescription>
              Configure quando transferir para um atendente humano
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Templates */}
            <div className="space-y-2">
              <Label>Templates Rápidos</Label>
              <div className="grid grid-cols-2 gap-2">
                {HANDOFF_TEMPLATES.map((template) => (
                  <Button
                    key={template.name}
                    variant="outline"
                    className="justify-start h-auto py-2"
                    onClick={() => handleUseTemplate(template)}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome da Regra *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Transferir quando frustrado"
                />
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva quando esta regra deve ser ativada..."
              />
            </div>

            {/* Condições */}
            <div className="space-y-4">
              <Label>Condições de Ativação</Label>

              {formData.conditions.length > 0 && (
                <div className="space-y-2">
                  {formData.conditions.map((cond, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <Badge>
                        {CONDITION_TYPES[cond.type as keyof typeof CONDITION_TYPES]?.label || cond.type}
                      </Badge>
                      <span className="text-sm flex-1">
                        {typeof cond.value === 'string' ? cond.value : String(cond.value)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveCondition(i)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Select
                  value={conditionType}
                  onValueChange={(v) => setConditionType(v as keyof typeof CONDITION_TYPES)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONDITION_TYPES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  value={conditionValue}
                  onChange={(e) => setConditionValue(e.target.value)}
                  placeholder={
                    conditionType === 'keyword'
                      ? 'palavras separadas por vírgula'
                      : conditionType === 'confidence'
                      ? '0.6'
                      : conditionType === 'messages_count'
                      ? '15'
                      : 'valor'
                  }
                  className="flex-1"
                />

                <Button variant="outline" onClick={handleAddCondition}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                {CONDITION_TYPES[conditionType].description}
              </p>
            </div>

            {/* Destino */}
            <div className="space-y-4">
              <Label>Destino da Transferência</Label>

              <Select
                value={formData.target_type}
                onValueChange={(v) => setFormData({ ...formData, target_type: v as typeof formData.target_type })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="queue">Fila de Atendimento</SelectItem>
                  <SelectItem value="round_robin">Distribuição Automática</SelectItem>
                  <SelectItem value="specific_agent">Agente Específico</SelectItem>
                  <SelectItem value="team">Equipe</SelectItem>
                </SelectContent>
              </Select>

              {formData.target_type === 'queue' && (
                <Input
                  value={formData.target_queue}
                  onChange={(e) => setFormData({ ...formData, target_queue: e.target.value })}
                  placeholder="Nome da fila (opcional)"
                />
              )}
            </div>

            {/* Mensagens */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Mensagem Antes da Transferência</Label>
                <Textarea
                  value={formData.pre_handoff_message}
                  onChange={(e) => setFormData({ ...formData, pre_handoff_message: e.target.value })}
                  placeholder="Vou transferir você para um de nossos atendentes..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Mensagem Durante a Transferência</Label>
                <Textarea
                  value={formData.handoff_message}
                  onChange={(e) => setFormData({ ...formData, handoff_message: e.target.value })}
                  placeholder="Aguarde um momento enquanto conectamos você..."
                  rows={2}
                />
              </div>
            </div>

            {/* Contexto */}
            <div className="space-y-4">
              <Label>Contexto para o Atendente</Label>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Incluir resumo da conversa</p>
                    <p className="text-xs text-muted-foreground">IA gera um resumo do atendimento</p>
                  </div>
                  <Switch
                    checked={formData.include_conversation_summary}
                    onCheckedChange={(checked) => setFormData({ ...formData, include_conversation_summary: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Incluir dados coletados</p>
                    <p className="text-xs text-muted-foreground">Dados do formulário/qualificação</p>
                  </div>
                  <Switch
                    checked={formData.include_collected_data}
                    onCheckedChange={(checked) => setFormData({ ...formData, include_collected_data: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Incluir histórico de sentimento</p>
                    <p className="text-xs text-muted-foreground">Mostra evolução do humor do cliente</p>
                  </div>
                  <Switch
                    checked={formData.include_sentiment_history}
                    onCheckedChange={(checked) => setFormData({ ...formData, include_sentiment_history: checked })}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.name || formData.conditions.length === 0 || createRule.isPending}
            >
              {createRule.isPending ? 'Criando...' : 'Criar Regra'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
