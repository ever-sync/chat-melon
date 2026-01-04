import { useState } from 'react';
import { useAIAgentSkills, useCreateAgentSkill, useUpdateAgentSkill, useDeleteAgentSkill } from '@/hooks/ai-agents';
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
  Zap,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  GripVertical,
  Lightbulb,
  MessageCircle,
  Calendar,
  HelpCircle,
  Star,
  Package,
  DollarSign,
  HeartHandshake,
  AlertCircle,
} from 'lucide-react';
import { AIAgent, AIAgentSkill, SkillType, SkillResponse } from '@/types/ai-agents';
import { cn } from '@/lib/utils';

interface AgentSkillsConfigProps {
  agent: AIAgent;
}

const SKILL_TYPE_LABELS: Record<SkillType, string> = {
  greeting: 'Saudação',
  farewell: 'Despedida',
  faq: 'FAQ',
  product_info: 'Informações de Produto',
  pricing: 'Preços',
  scheduling: 'Agendamento',
  qualification: 'Qualificação',
  complaint: 'Reclamação',
  support: 'Suporte',
  feedback: 'Feedback',
  custom: 'Personalizado',
};

const SKILL_TYPE_ICONS: Record<SkillType, typeof Zap> = {
  greeting: MessageCircle,
  farewell: MessageCircle,
  faq: HelpCircle,
  product_info: Package,
  pricing: DollarSign,
  scheduling: Calendar,
  qualification: Star,
  complaint: AlertCircle,
  support: HeartHandshake,
  feedback: Star,
  custom: Lightbulb,
};

const SKILL_TEMPLATES: Record<SkillType, Partial<AIAgentSkill>> = {
  greeting: {
    skill_name: 'Saudação Inicial',
    description: 'Responde às primeiras mensagens do cliente',
    trigger_keywords: ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'ei', 'hey', 'hello'],
    trigger_intents: ['greeting'],
    responses: [
      { template: 'Olá, {{nome}}! Seja bem-vindo(a)! Como posso ajudar você hoje?' },
      { template: 'Oi, {{nome}}! Tudo bem? Estou aqui para ajudar. O que você precisa?' },
    ],
  },
  farewell: {
    skill_name: 'Despedida',
    description: 'Encerra conversas de forma amigável',
    trigger_keywords: ['tchau', 'obrigado', 'obrigada', 'valeu', 'até mais', 'até logo', 'bye', 'adeus'],
    trigger_intents: ['farewell'],
    responses: [
      { template: 'Foi um prazer ajudar, {{nome}}! Se precisar de algo mais, é só chamar. Até logo!' },
      { template: 'Obrigado pelo contato! Estamos sempre à disposição. Tenha um ótimo dia!' },
    ],
  },
  faq: {
    skill_name: 'Perguntas Frequentes',
    description: 'Responde dúvidas comuns automaticamente',
    trigger_keywords: ['dúvida', 'pergunta', 'como funciona', 'o que é', 'qual'],
    trigger_intents: ['question', 'inquiry'],
    responses: [],
  },
  product_info: {
    skill_name: 'Informações de Produtos',
    description: 'Fornece detalhes sobre produtos e serviços',
    trigger_keywords: ['produto', 'serviço', 'detalhes', 'especificações', 'características'],
    trigger_intents: ['product_inquiry'],
    responses: [],
  },
  pricing: {
    skill_name: 'Preços e Valores',
    description: 'Informa preços e condições de pagamento',
    trigger_keywords: ['preço', 'valor', 'quanto custa', 'orçamento', 'parcela', 'pagamento'],
    trigger_intents: ['pricing'],
    responses: [],
  },
  scheduling: {
    skill_name: 'Agendamento',
    description: 'Ajuda a agendar reuniões ou consultas',
    trigger_keywords: ['agendar', 'marcar', 'horário', 'disponível', 'reunião', 'consulta'],
    trigger_intents: ['scheduling'],
    responses: [
      { template: 'Claro! Vou verificar os horários disponíveis. Você prefere algum dia específico?' },
    ],
  },
  qualification: {
    skill_name: 'Qualificação de Lead',
    description: 'Coleta informações para qualificar o interesse',
    trigger_keywords: ['interessado', 'quero saber', 'quero conhecer', 'preciso'],
    trigger_intents: ['interest', 'lead'],
    responses: [
      { template: 'Ótimo! Para entender melhor sua necessidade, posso fazer algumas perguntas?' },
    ],
  },
  complaint: {
    skill_name: 'Reclamação',
    description: 'Trata reclamações com empatia',
    trigger_keywords: ['reclamação', 'problema', 'insatisfeito', 'não funcionou', 'erro', 'defeito'],
    trigger_intents: ['complaint'],
    responses: [
      { template: 'Sinto muito pelo inconveniente, {{nome}}. Vou fazer o possível para resolver isso. Pode me contar mais detalhes?' },
    ],
  },
  support: {
    skill_name: 'Suporte Técnico',
    description: 'Ajuda com problemas técnicos',
    trigger_keywords: ['ajuda', 'suporte', 'não consigo', 'não funciona', 'travou', 'bug'],
    trigger_intents: ['support', 'help'],
    responses: [],
  },
  feedback: {
    skill_name: 'Feedback',
    description: 'Coleta avaliações e sugestões',
    trigger_keywords: ['avaliação', 'feedback', 'sugestão', 'opinião'],
    trigger_intents: ['feedback'],
    responses: [
      { template: 'Adoramos ouvir feedback! O que você gostaria de compartilhar conosco?' },
    ],
  },
  custom: {
    skill_name: 'Nova Skill',
    description: '',
    trigger_keywords: [],
    trigger_intents: [],
    responses: [],
  },
};

export function AgentSkillsConfig({ agent }: AgentSkillsConfigProps) {
  const { data: skills, isLoading } = useAIAgentSkills(agent.id);
  const createSkill = useCreateAgentSkill();
  const updateSkill = useUpdateAgentSkill();
  const deleteSkill = useDeleteAgentSkill();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<AIAgentSkill | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<AIAgentSkill>>({
    skill_type: 'custom',
    skill_name: '',
    description: '',
    trigger_keywords: [],
    trigger_intents: [],
    trigger_patterns: [],
    responses: [],
    is_enabled: true,
    priority: 1,
  });

  const [keywordsInput, setKeywordsInput] = useState('');
  const [responsesInput, setResponsesInput] = useState('');

  const handleSelectTemplate = (type: SkillType) => {
    const template = SKILL_TEMPLATES[type];
    setFormData({
      ...formData,
      skill_type: type,
      skill_name: template.skill_name || '',
      description: template.description || '',
      trigger_keywords: template.trigger_keywords || [],
      trigger_intents: template.trigger_intents || [],
      responses: template.responses || [],
    });
    setKeywordsInput((template.trigger_keywords || []).join(', '));
    setResponsesInput((template.responses || []).map(r => r.template).join('\n'));
  };

  const handleCreate = async () => {
    const keywords = keywordsInput.split(',').map(k => k.trim()).filter(Boolean);
    const responses: SkillResponse[] = responsesInput.split('\n').filter(Boolean).map(template => ({ template }));

    await createSkill.mutateAsync({
      agent_id: agent.id,
      skill_type: formData.skill_type || 'custom',
      skill_name: formData.skill_name || 'Nova Skill',
      description: formData.description,
      is_enabled: formData.is_enabled ?? true,
      priority: formData.priority || 1,
      trigger_keywords: keywords,
      trigger_intents: formData.trigger_intents || [],
      trigger_patterns: formData.trigger_patterns || [],
      actions: [],
      conditions: [],
      responses,
    });

    setShowAddDialog(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!selectedSkill) return;

    const keywords = keywordsInput.split(',').map(k => k.trim()).filter(Boolean);
    const responses: SkillResponse[] = responsesInput.split('\n').filter(Boolean).map(template => ({ template }));

    await updateSkill.mutateAsync({
      id: selectedSkill.id,
      agent_id: agent.id,
      skill_name: formData.skill_name,
      description: formData.description,
      is_enabled: formData.is_enabled,
      priority: formData.priority,
      trigger_keywords: keywords,
      responses,
    });

    setShowEditDialog(false);
    setSelectedSkill(null);
    resetForm();
  };

  const handleDelete = async (skill: AIAgentSkill) => {
    await deleteSkill.mutateAsync({
      id: skill.id,
      agent_id: agent.id,
    });
  };

  const handleToggleEnabled = async (skill: AIAgentSkill) => {
    await updateSkill.mutateAsync({
      id: skill.id,
      agent_id: agent.id,
      is_enabled: !skill.is_enabled,
    });
  };

  const openEditDialog = (skill: AIAgentSkill) => {
    setSelectedSkill(skill);
    setFormData({
      skill_type: skill.skill_type,
      skill_name: skill.skill_name,
      description: skill.description,
      is_enabled: skill.is_enabled,
      priority: skill.priority,
      trigger_keywords: skill.trigger_keywords,
      trigger_intents: skill.trigger_intents,
      responses: skill.responses,
    });
    setKeywordsInput(skill.trigger_keywords.join(', '));
    setResponsesInput(skill.responses.map(r => r.template).join('\n'));
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      skill_type: 'custom',
      skill_name: '',
      description: '',
      trigger_keywords: [],
      trigger_intents: [],
      trigger_patterns: [],
      responses: [],
      is_enabled: true,
      priority: 1,
    });
    setKeywordsInput('');
    setResponsesInput('');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Carregando skills...</div>
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
                <Zap className="h-5 w-5 text-purple-600" />
                Skills do Agente
              </CardTitle>
              <CardDescription>
                Habilidades específicas que o agente pode executar
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Skill
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!skills?.length ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma skill configurada</h3>
              <p className="text-muted-foreground mb-4">
                Skills permitem respostas automáticas para situações específicas
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeira Skill
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {skills.map((skill) => {
                const Icon = SKILL_TYPE_ICONS[skill.skill_type] || Lightbulb;
                return (
                  <div
                    key={skill.id}
                    className={cn(
                      'flex items-center justify-between p-4 border rounded-lg',
                      skill.is_enabled ? 'bg-white' : 'bg-gray-50 opacity-60'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-muted-foreground cursor-move">
                        <GripVertical className="h-5 w-5" />
                      </div>
                      <div className="p-2 rounded-lg bg-purple-100">
                        <Icon className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{skill.skill_name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {SKILL_TYPE_LABELS[skill.skill_type]}
                          </Badge>
                        </div>
                        {skill.description && (
                          <p className="text-sm text-muted-foreground">{skill.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {skill.trigger_keywords.slice(0, 5).map((kw, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {kw}
                            </Badge>
                          ))}
                          {skill.trigger_keywords.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{skill.trigger_keywords.length - 5}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm text-muted-foreground">
                        <div>{skill.times_triggered} usos</div>
                        <div>{Math.round((skill.success_rate || 0) * 100)}% sucesso</div>
                      </div>
                      <Switch
                        checked={skill.is_enabled}
                        onCheckedChange={() => handleToggleEnabled(skill)}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(skill)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(skill)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Adicionar Skill */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Skill</DialogTitle>
            <DialogDescription>
              Configure uma nova habilidade para o agente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Templates */}
            <div className="space-y-2">
              <Label>Tipo de Skill</Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(SKILL_TYPE_LABELS) as SkillType[]).map((type) => {
                  const Icon = SKILL_TYPE_ICONS[type];
                  return (
                    <div
                      key={type}
                      className={cn(
                        'p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-2',
                        formData.skill_type === type
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-200'
                      )}
                      onClick={() => handleSelectTemplate(type)}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm">{SKILL_TYPE_LABELS[type]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome da Skill</Label>
                <Input
                  value={formData.skill_name}
                  onChange={(e) => setFormData({ ...formData, skill_name: e.target.value })}
                  placeholder="Ex: Responder sobre preços"
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
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o que esta skill faz..."
              />
            </div>

            <div className="space-y-2">
              <Label>Palavras-chave (separadas por vírgula)</Label>
              <Textarea
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
                placeholder="preço, valor, quanto custa, orçamento"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Palavras que ativam esta skill quando detectadas na mensagem
              </p>
            </div>

            <div className="space-y-2">
              <Label>Respostas (uma por linha)</Label>
              <Textarea
                value={responsesInput}
                onChange={(e) => setResponsesInput(e.target.value)}
                placeholder="Olá, {{nome}}! Posso ajudar com informações sobre preços..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Se múltiplas respostas, uma será escolhida aleatoriamente para variar
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_enabled ?? true}
                onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
              />
              <Label>Skill ativa</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!formData.skill_name || createSkill.isPending}>
              {createSkill.isPending ? 'Criando...' : 'Criar Skill'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Skill */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Skill</DialogTitle>
            <DialogDescription>
              Modifique as configurações da skill
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome da Skill</Label>
                <Input
                  value={formData.skill_name}
                  onChange={(e) => setFormData({ ...formData, skill_name: e.target.value })}
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
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Palavras-chave (separadas por vírgula)</Label>
              <Textarea
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Respostas (uma por linha)</Label>
              <Textarea
                value={responsesInput}
                onChange={(e) => setResponsesInput(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_enabled ?? true}
                onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
              />
              <Label>Skill ativa</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditDialog(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={!formData.skill_name || updateSkill.isPending}>
              {updateSkill.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
