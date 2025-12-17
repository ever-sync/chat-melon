import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Rocket,
  MessageSquare,
  Target,
  ArrowRight,
  Clock,
  TrendingUp,
  Calendar,
  Webhook,
  HelpCircle,
  GitBranch,
  Users,
  Tag,
  Mail,
  CheckSquare,
  Bell,
  Pause,
  BarChart,
  FileText,
  Cake,
  AlertTriangle,
  FileCheck,
  Repeat,
  XCircle,
  Shuffle,
  Edit3,
  Network,
} from 'lucide-react';

const triggers = [
  { type: 'manual', label: 'Manual', icon: Rocket },
  { type: 'new_message', label: 'Nova mensagem', icon: MessageSquare },
  { type: 'deal_created', label: 'Deal criado', icon: Target },
  { type: 'stage_changed', label: 'Stage mudou', icon: ArrowRight },
  { type: 'time_inactive', label: 'Tempo inativo', icon: Clock },
  { type: 'score_reached', label: 'Score atingido', icon: TrendingUp },
  { type: 'score_changed', label: 'Lead Score mudou', icon: TrendingUp },
  { type: 'specific_date', label: 'Data específica', icon: Calendar },
  { type: 'contact_birthday', label: 'Aniversário do contato', icon: Cake },
  { type: 'label_added', label: 'Label adicionada', icon: Tag },
  { type: 'cron_schedule', label: 'Agendamento (Cron)', icon: Clock },
  { type: 'proposal_viewed', label: 'Proposta visualizada', icon: FileCheck },
  { type: 'proposal_accepted', label: 'Proposta aceita', icon: FileCheck },
  { type: 'proposal_rejected', label: 'Proposta rejeitada', icon: FileCheck },
  { type: 'sla_exceeded', label: 'SLA estourado', icon: AlertTriangle },
  { type: 'webhook_received', label: 'Webhook recebido', icon: Webhook },
];

const conditions = [
  { type: 'if_then', label: 'Se/Então', icon: HelpCircle },
  { type: 'advanced_condition', label: 'Condição avançada', icon: GitBranch },
  { type: 'split', label: 'Dividir', icon: GitBranch },
  { type: 'randomize', label: 'Randomizar (A/B)', icon: Shuffle },
  { type: 'check_hours', label: 'Horário comercial', icon: Clock },
  { type: 'check_assignment', label: 'Verificar atribuição', icon: Users },
  { type: 'check_label', label: 'Verificar label', icon: Tag },
  { type: 'stop_if', label: 'Parar fluxo se', icon: XCircle },
];

const actions = [
  { type: 'send_whatsapp', label: 'Enviar WhatsApp', icon: MessageSquare },
  { type: 'send_email', label: 'Enviar email', icon: Mail },
  { type: 'create_task', label: 'Criar tarefa', icon: CheckSquare },
  { type: 'move_stage', label: 'Mover stage', icon: ArrowRight },
  { type: 'add_label', label: 'Adicionar label', icon: Tag },
  { type: 'assign_to', label: 'Atribuir a', icon: Users },
  { type: 'notify_user', label: 'Notificar', icon: Bell },
  { type: 'wait', label: 'Aguardar', icon: Pause },
  { type: 'call_webhook', label: 'Chamar webhook', icon: Webhook },
  { type: 'send_to_n8n', label: 'Enviar para N8N', icon: Network },
  { type: 'update_score', label: 'Atualizar score', icon: BarChart },
  { type: 'update_field', label: 'Atualizar campo', icon: Edit3 },
  { type: 'add_note', label: 'Adicionar nota', icon: FileText },
  { type: 'loop_until', label: 'Loop com limite', icon: Repeat },
];

export const NodePanel = ({
  onAddNode,
}: {
  onAddNode: (type: string, nodeType: 'trigger' | 'action' | 'condition', label: string) => void;
}) => {
  return (
    <Card className="w-64 border-r rounded-none">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-6">
          {/* Triggers */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-green-600">🚀 GATILHOS</h3>
            <div className="space-y-1">
              {triggers.map((trigger) => (
                <button
                  key={trigger.type}
                  onClick={() => onAddNode(trigger.type, 'trigger', trigger.label)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-left"
                >
                  <trigger.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{trigger.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Conditions */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-yellow-600">❓ CONDIÇÕES</h3>
            <div className="space-y-1">
              {conditions.map((condition) => (
                <button
                  key={condition.type}
                  onClick={() => onAddNode(condition.type, 'condition', condition.label)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-left"
                >
                  <condition.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{condition.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-blue-600">📋 AÇÕES</h3>
            <div className="space-y-1">
              {actions.map((action) => (
                <button
                  key={action.type}
                  onClick={() => onAddNode(action.type, 'action', action.label)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-left"
                >
                  <action.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
};
