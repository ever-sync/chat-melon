import { Card } from '@/components/ui/card';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Trash2, Variable } from 'lucide-react';
import { VariablePicker } from '@/components/chat/VariablePicker';
import { Node } from 'reactflow';
import { usePipelines } from '@/hooks/crm/usePipelines';
import { Badge } from '@/components/ui/badge';

export const NodeConfigPanel = ({
  node,
  onUpdate,
  onDelete,
  onClose,
}: {
  node: Node;
  onUpdate: (nodeId: string, newData: any) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
}) => {
  const { stages } = usePipelines();
  const config = node.data.config || {};
  const nodeType = node.data.nodeType;

  const updateConfig = (field: string, value: any) => {
    onUpdate(node.id, {
      config: { ...config, [field]: value },
    });
  };

  const renderConfigFields = () => {
    // Trigger configurations
    if (node.type === 'trigger') {
      switch (nodeType) {
        case 'time_inactive':
          return (
            <div className="space-y-2">
              <Label>Dias de inatividade</Label>
              <Input
                type="number"
                value={config.days || ''}
                onChange={(e) => updateConfig('days', parseInt(e.target.value))}
                placeholder="Ex: 3"
              />
            </div>
          );
        case 'score_reached':
          return (
            <div className="space-y-2">
              <Label>Score mínimo</Label>
              <Input
                type="number"
                value={config.min_score || ''}
                onChange={(e) => updateConfig('min_score', parseInt(e.target.value))}
                placeholder="Ex: 80"
              />
            </div>
          );
        case 'score_changed':
          return (
            <div className="space-y-2">
              <Label>Tipo de mudança</Label>
              <Select
                value={config.change_type || ''}
                onValueChange={(v) => updateConfig('change_type', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="greater_than">Score &gt;=</SelectItem>
                  <SelectItem value="less_than">Score &lt;=</SelectItem>
                  <SelectItem value="equals">Score =</SelectItem>
                </SelectContent>
              </Select>
              <Label>Valor do score</Label>
              <Input
                type="number"
                value={config.threshold || ''}
                onChange={(e) => updateConfig('threshold', parseInt(e.target.value))}
                placeholder="Ex: 80"
              />
            </div>
          );
        case 'contact_birthday':
          return (
            <div className="space-y-2">
              <Label>Quando disparar</Label>
              <Select value={config.timing || ''} onValueChange={(v) => updateConfig('timing', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="before">Antes</SelectItem>
                  <SelectItem value="on_day">No dia</SelectItem>
                  <SelectItem value="after">Depois</SelectItem>
                </SelectContent>
              </Select>
              {config.timing !== 'on_day' && (
                <>
                  <Label>Dias de antecedência/atraso</Label>
                  <Input
                    type="number"
                    value={config.days_offset || ''}
                    onChange={(e) => updateConfig('days_offset', parseInt(e.target.value))}
                    placeholder="Ex: 3"
                  />
                </>
              )}
            </div>
          );
        case 'label_added':
          return (
            <div className="space-y-2">
              <Label>Label específica</Label>
              <Input
                value={config.label_name || ''}
                onChange={(e) => updateConfig('label_name', e.target.value)}
                placeholder="Nome da label"
              />
            </div>
          );
        case 'cron_schedule':
          return (
            <div className="space-y-2">
              <Label>Horário</Label>
              <Input
                type="time"
                value={config.time || ''}
                onChange={(e) => updateConfig('time', e.target.value)}
              />
              <Label>Dias da semana</Label>
              <div className="flex flex-wrap gap-1">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, idx) => (
                  <Badge
                    key={day}
                    variant={(config.weekdays || []).includes(idx) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      const weekdays = config.weekdays || [];
                      const newWeekdays = weekdays.includes(idx)
                        ? weekdays.filter((d: number) => d !== idx)
                        : [...weekdays, idx];
                      updateConfig('weekdays', newWeekdays);
                    }}
                  >
                    {day}
                  </Badge>
                ))}
              </div>
              <Label>Repetir</Label>
              <Select value={config.repeat || ''} onValueChange={(v) => updateConfig('repeat', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diariamente</SelectItem>
                  <SelectItem value="weekly">Semanalmente</SelectItem>
                  <SelectItem value="monthly">Mensalmente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          );
        case 'proposal_viewed':
        case 'proposal_accepted':
        case 'proposal_rejected':
          return (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Dispara quando uma proposta é{' '}
                {nodeType === 'proposal_viewed'
                  ? 'visualizada'
                  : nodeType === 'proposal_accepted'
                    ? 'aceita'
                    : 'rejeitada'}{' '}
                pelo cliente.
              </p>
            </div>
          );
        case 'sla_exceeded':
          return (
            <div className="space-y-2">
              <Label>Tempo máximo sem resposta (minutos)</Label>
              <Input
                type="number"
                value={config.max_minutes || ''}
                onChange={(e) => updateConfig('max_minutes', parseInt(e.target.value))}
                placeholder="Ex: 60"
              />
            </div>
          );
        case 'specific_date':
          return (
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={config.date || ''}
                onChange={(e) => updateConfig('date', e.target.value)}
              />
              <Label>Hora</Label>
              <Input
                type="time"
                value={config.time || ''}
                onChange={(e) => updateConfig('time', e.target.value)}
              />
            </div>
          );
      }
    }

    // Condition configurations
    if (node.type === 'condition') {
      switch (nodeType) {
        case 'if_then':
          return (
            <div className="space-y-2">
              <Label>Campo</Label>
              <Select value={config.field || ''} onValueChange={(v) => updateConfig('field', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead_score">Lead Score</SelectItem>
                  <SelectItem value="has_deal">Tem Deal</SelectItem>
                  <SelectItem value="responded">Respondeu</SelectItem>
                  <SelectItem value="message_count">Qtd Mensagens</SelectItem>
                </SelectContent>
              </Select>

              <Label>Operador</Label>
              <Select
                value={config.operator || ''}
                onValueChange={(v) => updateConfig('operator', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Igual a</SelectItem>
                  <SelectItem value="greater">Maior que</SelectItem>
                  <SelectItem value="less">Menor que</SelectItem>
                  <SelectItem value="contains">Contém</SelectItem>
                </SelectContent>
              </Select>

              <Label>Valor</Label>
              <Input
                value={config.value || ''}
                onChange={(e) => updateConfig('value', e.target.value)}
                placeholder="Digite o valor..."
              />
            </div>
          );
        case 'advanced_condition':
          return (
            <div className="space-y-2">
              <Label>Lógica</Label>
              <Select value={config.logic || 'AND'} onValueChange={(v) => updateConfig('logic', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">E (AND)</SelectItem>
                  <SelectItem value="OR">OU (OR)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Configure múltiplas condições. Todas (AND) ou qualquer (OR) devem ser verdadeiras.
              </p>
              <Label>Campo 1</Label>
              <Input
                value={config.field1 || ''}
                onChange={(e) => updateConfig('field1', e.target.value)}
                placeholder="Ex: lead_score"
              />
              <Label>Operador 1</Label>
              <Select
                value={config.operator1 || ''}
                onValueChange={(v) => updateConfig('operator1', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Igual</SelectItem>
                  <SelectItem value="not_equals">Diferente</SelectItem>
                  <SelectItem value="greater">Maior</SelectItem>
                  <SelectItem value="less">Menor</SelectItem>
                  <SelectItem value="contains">Contém</SelectItem>
                </SelectContent>
              </Select>
              <Label>Valor 1</Label>
              <Input
                value={config.value1 || ''}
                onChange={(e) => updateConfig('value1', e.target.value)}
                placeholder="Valor..."
              />
            </div>
          );
        case 'randomize':
          return (
            <div className="space-y-2">
              <Label>Caminho A (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={config.path_a_percent || '50'}
                onChange={(e) => updateConfig('path_a_percent', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Caminho B será {100 - (config.path_a_percent || 50)}%
              </p>
            </div>
          );
        case 'stop_if':
          return (
            <div className="space-y-2">
              <Label>Condição para parar</Label>
              <Select
                value={config.stop_condition || ''}
                onValueChange={(v) => updateConfig('stop_condition', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deal_lost">Deal foi perdido</SelectItem>
                  <SelectItem value="deal_won">Deal foi ganho</SelectItem>
                  <SelectItem value="contact_blocked">Contato bloqueado</SelectItem>
                  <SelectItem value="unsubscribed">Cliente descadastrou</SelectItem>
                </SelectContent>
              </Select>
            </div>
          );
      }
    }

    // Action configurations
    if (node.type === 'action') {
      switch (nodeType) {
        case 'send_whatsapp':
        case 'send_email':
          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <Label>Mensagem</Label>
                <VariablePicker
                  hideStandard={true}
                  onSelect={(v) => updateConfig('message', (config.message || '') + v)}
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                    >
                      <Variable className="h-3 w-3" />
                      Variáveis
                    </Button>
                  }
                />
              </div>
              <Textarea
                value={config.message || ''}
                onChange={(e) => updateConfig('message', e.target.value)}
                placeholder="Use {{variáveis}} como {{nome}}, {{empresa}}"
                rows={6}
              />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Variáveis disponíveis:</p>
                <div className="flex flex-wrap gap-1">
                  {['{{nome}}', '{{empresa}}', '{{telefone}}', '{{email}}'].map((v) => (
                    <Badge key={v} variant="secondary" className="text-xs">
                      {v}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          );

        case 'create_task':
          return (
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={config.title || ''}
                onChange={(e) => updateConfig('title', e.target.value)}
                placeholder="Título da tarefa"
              />
              <Label>Vencimento (dias)</Label>
              <Input
                type="number"
                value={config.due_in_days || ''}
                onChange={(e) => updateConfig('due_in_days', parseInt(e.target.value))}
                placeholder="Ex: 3"
              />
              <Label>Prioridade</Label>
              <Select
                value={config.priority || ''}
                onValueChange={(v) => updateConfig('priority', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          );

        case 'move_stage':
          return (
            <div className="space-y-2">
              <Label>Stage de destino</Label>
              <Select
                value={config.target_stage || ''}
                onValueChange={(v) => updateConfig('target_stage', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o stage" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );

        case 'wait':
          return (
            <div className="space-y-2">
              <Label>Aguardar</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={config.wait_value || ''}
                  onChange={(e) => updateConfig('wait_value', parseInt(e.target.value))}
                  placeholder="Ex: 3"
                />
                <Select
                  value={config.wait_unit || 'days'}
                  onValueChange={(v) => updateConfig('wait_unit', v)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutos</SelectItem>
                    <SelectItem value="hours">Horas</SelectItem>
                    <SelectItem value="days">Dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          );

        case 'call_webhook':
          return (
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={config.url || ''}
                onChange={(e) => updateConfig('url', e.target.value)}
                placeholder="https://..."
              />
              <Label>Método</Label>
              <Select
                value={config.method || 'POST'}
                onValueChange={(v) => updateConfig('method', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          );

        case 'add_note':
          return (
            <div className="space-y-2">
              <Label>Nota interna</Label>
              <Textarea
                value={config.note || ''}
                onChange={(e) => updateConfig('note', e.target.value)}
                placeholder="Texto da nota..."
                rows={4}
              />
            </div>
          );

        case 'notify_user':
          return (
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={config.title || ''}
                onChange={(e) => updateConfig('title', e.target.value)}
                placeholder="Título da notificação"
              />
              <Label>Mensagem</Label>
              <Textarea
                value={config.message || ''}
                onChange={(e) => updateConfig('message', e.target.value)}
                placeholder="Mensagem..."
                rows={3}
              />
            </div>
          );

        case 'update_field':
          return (
            <div className="space-y-2">
              <Label>Entidade</Label>
              <Select value={config.entity || ''} onValueChange={(v) => updateConfig('entity', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contact">Contato</SelectItem>
                  <SelectItem value="deal">Deal</SelectItem>
                </SelectContent>
              </Select>
              <Label>Campo</Label>
              <Input
                value={config.field_name || ''}
                onChange={(e) => updateConfig('field_name', e.target.value)}
                placeholder="Ex: lead_score"
              />
              <Label>Novo valor</Label>
              <Input
                value={config.new_value || ''}
                onChange={(e) => updateConfig('new_value', e.target.value)}
                placeholder="Valor..."
              />
            </div>
          );

        case 'send_to_n8n':
          return (
            <div className="space-y-2">
              <Label>URL do Webhook N8N</Label>
              <Input
                value={config.n8n_url || ''}
                onChange={(e) => updateConfig('n8n_url', e.target.value)}
                placeholder="https://n8n.io/webhook/..."
              />
              <Label>Aguardar resposta?</Label>
              <Select
                value={config.wait_response || 'no'}
                onValueChange={(v) => updateConfig('wait_response', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Sim</SelectItem>
                  <SelectItem value="no">Não</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Dados enviados: deal, contact, execution
              </p>
            </div>
          );

        case 'loop_until':
          return (
            <div className="space-y-2">
              <Label>Condição de parada</Label>
              <Input
                value={config.stop_condition || ''}
                onChange={(e) => updateConfig('stop_condition', e.target.value)}
                placeholder="Ex: message_count > 5"
              />
              <Label>Máximo de iterações</Label>
              <Input
                type="number"
                value={config.max_iterations || ''}
                onChange={(e) => updateConfig('max_iterations', parseInt(e.target.value))}
                placeholder="Ex: 10"
              />
              <p className="text-xs text-muted-foreground text-yellow-600">
                ⚠️ Use com cuidado para evitar loops infinitos
              </p>
            </div>
          );
      }
    }

    return <p className="text-sm text-muted-foreground">Nenhuma configuração disponível</p>;
  };

  return (
    <Card className="w-80 border-l rounded-none h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Configuração</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div>
            <Label>Nome do Node</Label>
            <Input
              value={node.data.label}
              onChange={(e) => onUpdate(node.id, { label: e.target.value })}
              placeholder="Nome..."
            />
          </div>

          {renderConfigFields()}
        </div>
      </ScrollArea>

      {node.id !== 'start' && (
        <div className="p-4 border-t">
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => onDelete(node.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir Node
          </Button>
        </div>
      )}
    </Card>
  );
};
