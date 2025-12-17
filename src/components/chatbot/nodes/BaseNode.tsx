import { memo, ReactNode } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { cn } from '@/lib/utils';
import { NODE_TYPE_INFO, type ChatbotNodeType } from '@/types/chatbot';
import * as Icons from 'lucide-react';

interface BaseNodeProps {
  type: ChatbotNodeType;
  selected?: boolean;
  children: ReactNode;
  showSourceHandle?: boolean;
  showTargetHandle?: boolean;
  sourceHandles?: { id: string; label?: string }[];
}

export const BaseNode = memo(function BaseNode({
  type,
  selected,
  children,
  showSourceHandle = true,
  showTargetHandle = true,
  sourceHandles,
}: BaseNodeProps) {
  const nodeInfo = NODE_TYPE_INFO[type];
  const IconComponent = Icons[nodeInfo.icon as keyof typeof Icons] as React.ComponentType<{
    className?: string;
  }>;

  return (
    <div
      className={cn(
        'min-w-[200px] max-w-[280px] rounded-lg border-2 bg-background shadow-md transition-all',
        selected ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'border-border'
      )}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 rounded-t-md px-3 py-2"
        style={{ backgroundColor: `${nodeInfo.color}20` }}
      >
        <div
          className="flex h-6 w-6 items-center justify-center rounded-md"
          style={{ backgroundColor: nodeInfo.color }}
        >
          {IconComponent && <IconComponent className="h-4 w-4 text-white" />}
        </div>
        <span className="text-sm font-medium">{nodeInfo.label}</span>
      </div>

      {/* Content */}
      <div className="p-3">{children}</div>

      {/* Target Handle (input) */}
      {showTargetHandle && type !== 'start' && (
        <Handle
          type="target"
          position={Position.Top}
          className="!h-3 !w-3 !border-2 !border-background !bg-muted-foreground"
        />
      )}

      {/* Source Handle(s) (output) */}
      {showSourceHandle && type !== 'end' && !sourceHandles && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!h-3 !w-3 !border-2 !border-background !bg-primary"
        />
      )}

      {/* Multiple Source Handles for menu/condition nodes */}
      {sourceHandles && sourceHandles.length > 0 && (
        <div className="relative">
          {sourceHandles.map((handle, index) => (
            <Handle
              key={handle.id}
              type="source"
              position={Position.Bottom}
              id={handle.id}
              className="!h-3 !w-3 !border-2 !border-background !bg-primary"
              style={{
                left: `${((index + 1) / (sourceHandles.length + 1)) * 100}%`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// Start Node
export const StartNode = memo(function StartNode({ data, selected }: NodeProps) {
  return (
    <BaseNode type="start" selected={selected} showTargetHandle={false}>
      <p className="text-xs text-muted-foreground">{data.label || 'Ponto de início do fluxo'}</p>
    </BaseNode>
  );
});

// End Node
export const EndNode = memo(function EndNode({ data, selected }: NodeProps) {
  return (
    <BaseNode type="end" selected={selected} showSourceHandle={false}>
      <p className="text-xs text-muted-foreground">{data.endMessage || 'Fim do fluxo'}</p>
      {data.closeConversation && (
        <span className="mt-1 inline-block rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700">
          Encerra conversa
        </span>
      )}
    </BaseNode>
  );
});

// Message Node
export const MessageNode = memo(function MessageNode({ data, selected }: NodeProps) {
  return (
    <BaseNode type="message" selected={selected}>
      <p className="line-clamp-3 text-sm">
        {data.content || <span className="italic text-muted-foreground">Mensagem vazia</span>}
      </p>
      {data.mediaUrl && (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Icons.Paperclip className="h-3 w-3" />
          <span>Mídia anexada</span>
        </div>
      )}
      {data.buttons && data.buttons.length > 0 && (
        <div className="mt-2 space-y-1">
          {data.buttons.map((btn: { id: string; label: string }) => (
            <div key={btn.id} className="rounded border bg-muted/50 px-2 py-1 text-xs">
              {btn.label}
            </div>
          ))}
        </div>
      )}
    </BaseNode>
  );
});

// Question Node
export const QuestionNode = memo(function QuestionNode({ data, selected }: NodeProps) {
  return (
    <BaseNode type="question" selected={selected}>
      <p className="text-sm font-medium">
        {data.question || <span className="italic text-muted-foreground">Pergunta vazia</span>}
      </p>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Icons.Variable className="h-3 w-3" />
        <span>{data.variableName || 'variavel'}</span>
        {data.validation && data.validation !== 'text' && (
          <span className="rounded bg-muted px-1.5 py-0.5">{data.validation}</span>
        )}
      </div>
    </BaseNode>
  );
});

// Menu Node
export const MenuNode = memo(function MenuNode({ data, selected }: NodeProps) {
  const options = data.options || [];
  const sourceHandles = options.map((opt: { id: string; value: string }) => ({
    id: opt.value,
    label: opt.value,
  }));

  return (
    <BaseNode type="menu" selected={selected} sourceHandles={sourceHandles}>
      <p className="text-sm font-medium">
        {data.title || <span className="italic text-muted-foreground">Título do menu</span>}
      </p>
      {options.length > 0 && (
        <div className="mt-2 space-y-1">
          {options.map((opt: { id: string; label: string; emoji?: string }) => (
            <div key={opt.id} className="flex items-center gap-1 text-xs">
              <span className="flex h-4 w-4 items-center justify-center rounded bg-primary/10 text-primary">
                {opt.emoji || options.indexOf(opt) + 1}
              </span>
              <span>{opt.label}</span>
            </div>
          ))}
        </div>
      )}
    </BaseNode>
  );
});

// Condition Node
export const ConditionNode = memo(function ConditionNode({ data, selected }: NodeProps) {
  const conditions = data.conditions || [];
  const sourceHandles = [
    ...conditions.map((c: { id: string }) => ({ id: c.id })),
    { id: 'default', label: 'Outro' },
  ];

  return (
    <BaseNode type="condition" selected={selected} sourceHandles={sourceHandles}>
      {conditions.length > 0 ? (
        <div className="space-y-1">
          {conditions.map(
            (cond: { id: string; variable: string; operator: string; value: string }) => (
              <div key={cond.id} className="text-xs">
                <span className="font-medium">{cond.variable}</span>{' '}
                <span className="text-muted-foreground">{cond.operator}</span>{' '}
                <span className="text-primary">{cond.value}</span>
              </div>
            )
          )}
        </div>
      ) : (
        <p className="text-xs italic text-muted-foreground">Nenhuma condição</p>
      )}
    </BaseNode>
  );
});

// Delay Node
export const DelayNode = memo(function DelayNode({ data, selected }: NodeProps) {
  return (
    <BaseNode type="delay" selected={selected}>
      <div className="flex items-center gap-2 text-sm">
        <Icons.Clock className="h-4 w-4 text-muted-foreground" />
        <span>
          {data.delayType === 'typing' ? 'Digitando...' : `${(data.delayMs || 1000) / 1000}s`}
        </span>
      </div>
    </BaseNode>
  );
});

// Handoff Node
export const HandoffNode = memo(function HandoffNode({ data, selected }: NodeProps) {
  return (
    <BaseNode type="handoff" selected={selected} showSourceHandle={false}>
      <p className="text-sm">{data.message || 'Transferindo para atendente...'}</p>
      {(data.teamId || data.agentId) && (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Icons.User className="h-3 w-3" />
          <span>{data.teamId ? 'Equipe' : 'Agente'} específico</span>
        </div>
      )}
    </BaseNode>
  );
});

// AI Response Node
export const AIResponseNode = memo(function AIResponseNode({ data, selected }: NodeProps) {
  return (
    <BaseNode type="ai_response" selected={selected}>
      <div className="space-y-2">
        {data.useKnowledgeBase && (
          <div className="flex items-center gap-1 text-xs">
            <Icons.BookOpen className="h-3 w-3 text-purple-500" />
            <span>Usa base de conhecimento</span>
          </div>
        )}
        {data.prompt && <p className="line-clamp-2 text-xs text-muted-foreground">{data.prompt}</p>}
      </div>
    </BaseNode>
  );
});

// Webhook Node
export const WebhookNode = memo(function WebhookNode({ data, selected }: NodeProps) {
  return (
    <BaseNode type="webhook" selected={selected}>
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
            {data.method || 'POST'}
          </span>
        </div>
        <p className="truncate text-xs text-muted-foreground">{data.url || 'URL não definida'}</p>
        {data.responseVariable && (
          <div className="flex items-center gap-1 text-xs">
            <Icons.Variable className="h-3 w-3" />
            <span>{data.responseVariable}</span>
          </div>
        )}
      </div>
    </BaseNode>
  );
});

// Action Node
export const ActionNode = memo(function ActionNode({ data, selected }: NodeProps) {
  const actionLabels: Record<string, string> = {
    tag_contact: 'Adicionar tag',
    assign_agent: 'Atribuir agente',
    assign_team: 'Atribuir equipe',
    update_contact: 'Atualizar contato',
    send_email: 'Enviar email',
    create_ticket: 'Criar ticket',
  };

  return (
    <BaseNode type="action" selected={selected}>
      <p className="text-sm">{actionLabels[data.actionType] || data.actionType}</p>
    </BaseNode>
  );
});

// Set Variable Node
export const SetVariableNode = memo(function SetVariableNode({ data, selected }: NodeProps) {
  return (
    <BaseNode type="set_variable" selected={selected}>
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium">{data.variableName || 'variavel'}</span>
        <span className="text-muted-foreground">=</span>
        <span className="truncate text-primary">{data.value || '...'}</span>
      </div>
    </BaseNode>
  );
});

// Export all node types for ReactFlow
export const nodeTypes = {
  start: StartNode,
  end: EndNode,
  message: MessageNode,
  question: QuestionNode,
  menu: MenuNode,
  condition: ConditionNode,
  delay: DelayNode,
  handoff: HandoffNode,
  ai_response: AIResponseNode,
  webhook: WebhookNode,
  action: ActionNode,
  set_variable: SetVariableNode,
};
