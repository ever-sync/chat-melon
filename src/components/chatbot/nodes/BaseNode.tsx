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

// Goto Node
export const GotoNode = memo(function GotoNode({ data, selected }: NodeProps) {
  return (
    <BaseNode type="goto" selected={selected}>
      <p className="text-xs text-muted-foreground">
        Ir para: {data.targetNodeId || 'Nenhum destino'}
      </p>
    </BaseNode>
  );
});

// Random Node
export const RandomNode = memo(function RandomNode({ data, selected }: NodeProps) {
  return (
    <BaseNode type="random" selected={selected}>
      <p className="text-xs text-muted-foreground">Escolha aleatória entre caminhos</p>
    </BaseNode>
  );
});

// Split Node
export const SplitNode = memo(function SplitNode({ data, selected }: NodeProps) {
  const paths = data.paths || [];
  return (
    <BaseNode type="split" selected={selected}>
      <div className="space-y-1">
        {paths.map((path: { id: string; label: string; percentage: number }) => (
          <div key={path.id} className="flex items-center justify-between text-xs">
            <span>{path.label}</span>
            <span className="text-muted-foreground">{path.percentage}%</span>
          </div>
        ))}
      </div>
    </BaseNode>
  );
});

// Image Node
export const ImageNode = memo(function ImageNode({ data, selected }: NodeProps) {
  return (
    <BaseNode type="image" selected={selected}>
      <div className="space-y-1">
        <Icons.Image className="h-8 w-8 text-muted-foreground" />
        {data.caption && <p className="text-xs line-clamp-2">{data.caption}</p>}
      </div>
    </BaseNode>
  );
});

// Video Node
export const VideoNode = memo(function VideoNode({ data, selected }: NodeProps) {
  return (
    <BaseNode type="video" selected={selected}>
      <div className="space-y-1">
        <Icons.Video className="h-8 w-8 text-muted-foreground" />
        {data.caption && <p className="text-xs line-clamp-2">{data.caption}</p>}
      </div>
    </BaseNode>
  );
});

// Audio Node
export const AudioNode = memo(function AudioNode({ data, selected }: NodeProps) {
  return (
    <BaseNode type="audio" selected={selected}>
      <div className="space-y-1">
        <Icons.Music className="h-8 w-8 text-muted-foreground" />
        {data.duration && <p className="text-xs text-muted-foreground">{data.duration}s</p>}
      </div>
    </BaseNode>
  );
});

// Document Node
export const DocumentNode = memo(function DocumentNode({ data, selected }: NodeProps) {
  return (
    <BaseNode type="document" selected={selected}>
      <div className="space-y-1">
        <Icons.FileText className="h-8 w-8 text-muted-foreground" />
        {data.fileName && <p className="text-xs truncate">{data.fileName}</p>}
      </div>
    </BaseNode>
  );
});

// Sticker Node
export const StickerNode = memo(function StickerNode({ data, selected }: NodeProps) {
  return (
    <BaseNode type="sticker" selected={selected}>
      <div className="flex items-center justify-center">
        <Icons.Smile className="h-8 w-8 text-muted-foreground" />
      </div>
    </BaseNode>
  );
});

// Quick Reply Node
export const QuickReplyNode = memo(function QuickReplyNode({ data, selected }: NodeProps) {
  const replies = data.replies || [];
  return (
    <BaseNode type="quick_reply" selected={selected}>
      <p className="text-sm mb-2">{data.message || 'Escolha uma opção:'}</p>
      <div className="space-y-1">
        {replies.slice(0, 3).map((reply: { id: string; label: string; emoji?: string }) => (
          <div key={reply.id} className="rounded bg-muted px-2 py-1 text-xs">
            {reply.emoji} {reply.label}
          </div>
        ))}
      </div>
    </BaseNode>
  );
});

// List Node
export const ListNode = memo(function ListNode({ data, selected }: NodeProps) {
  return (
    <BaseNode type="list" selected={selected}>
      <div className="space-y-1">
        <p className="text-sm font-medium">{data.title || 'Lista'}</p>
        <p className="text-xs text-muted-foreground">
          {(data.sections || []).length} seções
        </p>
      </div>
    </BaseNode>
  );
});

// Carousel Node
export const CarouselNode = memo(function CarouselNode({ data, selected }: NodeProps) {
  return (
    <BaseNode type="carousel" selected={selected}>
      <div className="flex items-center gap-2">
        <Icons.LayoutGrid className="h-4 w-4" />
        <span className="text-sm">{(data.cards || []).length} cards</span>
      </div>
    </BaseNode>
  );
});

// File Upload Node
export const FileUploadNode = memo(function FileUploadNode({ data, selected }: NodeProps) {
  return (
    <BaseNode type="file_upload" selected={selected}>
      <div className="space-y-1">
        <Icons.Upload className="h-6 w-6 text-muted-foreground" />
        <p className="text-xs">{data.prompt || 'Envie um arquivo'}</p>
      </div>
    </BaseNode>
  );
});

// Location Node
export const LocationNode = memo(function LocationNode({ data, selected }: NodeProps) {
  return (
    <BaseNode type="location" selected={selected}>
      <div className="space-y-1">
        <Icons.MapPin className="h-6 w-6 text-muted-foreground" />
        {data.address && <p className="text-xs line-clamp-2">{data.address}</p>}
      </div>
    </BaseNode>
  );
});

// Contact Card Node
export const ContactCardNode = memo(function ContactCardNode({ data, selected }: NodeProps) {
  return (
    <BaseNode type="contact_card" selected={selected}>
      <div className="space-y-1">
        <Icons.Contact className="h-6 w-6 text-muted-foreground" />
        {data.name && <p className="text-sm font-medium">{data.name}</p>}
        {data.phone && <p className="text-xs text-muted-foreground">{data.phone}</p>}
      </div>
    </BaseNode>
  );
});

// Rating Node
export const RatingNode = memo(function RatingNode({ data, selected }: NodeProps) {
  return (
    <BaseNode type="rating" selected={selected}>
      <div className="space-y-1">
        <p className="text-sm">{data.question || 'Avalie nosso atendimento'}</p>
        <div className="flex items-center gap-1">
          {Array.from({ length: data.maxRating || 5 }).map((_, i) => (
            <Icons.Star key={i} className="h-3 w-3 text-yellow-500" />
          ))}
        </div>
      </div>
    </BaseNode>
  );
});

// NPS Node
export const NPSNode = memo(function NPSNode({ data, selected }: NodeProps) {
  return (
    <BaseNode type="nps" selected={selected}>
      <div className="space-y-1">
        <p className="text-sm">{data.question || 'Qual a probabilidade de nos recomendar?'}</p>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span>10</span>
        </div>
      </div>
    </BaseNode>
  );
});

// Calendar Node
export const CalendarNode = memo(function CalendarNode({ data, selected }: NodeProps) {
  return (
    <BaseNode type="calendar" selected={selected}>
      <div className="space-y-1">
        <Icons.Calendar className="h-6 w-6 text-muted-foreground" />
        <p className="text-xs">{data.prompt || 'Agendar horário'}</p>
      </div>
    </BaseNode>
  );
});

// Switch Node
export const SwitchNode = memo(function SwitchNode({ data, selected }: NodeProps) {
  const cases = data.cases || [];
  return (
    <BaseNode type="switch" selected={selected}>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Variável: {data.variable}</p>
        <p className="text-xs">{cases.length} casos</p>
      </div>
    </BaseNode>
  );
});

// A/B Test Node
export const ABTestNode = memo(function ABTestNode({ data, selected }: NodeProps) {
  const variants = data.variants || [];
  return (
    <BaseNode type="ab_test" selected={selected}>
      <div className="space-y-1">
        <p className="text-sm font-medium">{data.testName || 'Teste A/B'}</p>
        <p className="text-xs text-muted-foreground">{variants.length} variantes</p>
      </div>
    </BaseNode>
  );
});

// AI Classifier Node
export const AIClassifierNode = memo(function AIClassifierNode({ data, selected }: NodeProps) {
  return (
    <BaseNode type="ai_classifier" selected={selected}>
      <div className="space-y-1">
        <Icons.Sparkles className="h-6 w-6 text-purple-500" />
        <p className="text-xs">{(data.categories || []).length} categorias</p>
      </div>
    </BaseNode>
  );
});

// AI Sentiment Node
export const AISentimentNode = memo(function AISentimentNode({ data, selected }: NodeProps) {
  return (
    <BaseNode type="ai_sentiment" selected={selected}>
      <div className="space-y-1">
        <Icons.Heart className="h-6 w-6 text-purple-500" />
        <p className="text-xs text-muted-foreground">Análise de sentimento</p>
      </div>
    </BaseNode>
  );
});

// AI Extract Node
export const AIExtractNode = memo(function AIExtractNode({ data, selected }: NodeProps) {
  return (
    <BaseNode type="ai_extract" selected={selected}>
      <div className="space-y-1">
        <Icons.ScanText className="h-6 w-6 text-purple-500" />
        <p className="text-xs">{(data.extractions || []).length} campos</p>
      </div>
    </BaseNode>
  );
});

// AI Summarize Node
export const AISummarizeNode = memo(function AISummarizeNode({ data, selected }: NodeProps) {
  return (
    <BaseNode type="ai_summarize" selected={selected}>
      <div className="space-y-1">
        <Icons.FileText className="h-6 w-6 text-purple-500" />
        <p className="text-xs text-muted-foreground">Resumir texto</p>
      </div>
    </BaseNode>
  );
});

// AI Translate Node
export const AITranslateNode = memo(function AITranslateNode({ data, selected }: NodeProps) {
  return (
    <BaseNode type="ai_translate" selected={selected}>
      <div className="space-y-1">
        <Icons.Languages className="h-6 w-6 text-purple-500" />
        <p className="text-xs">Para: {data.targetLanguage || 'en'}</p>
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
  // Control Flow
  goto: GotoNode,
  random: RandomNode,
  split: SplitNode,
  // Multimedia
  image: ImageNode,
  video: VideoNode,
  audio: AudioNode,
  document: DocumentNode,
  sticker: StickerNode,
  // Advanced Interaction
  quick_reply: QuickReplyNode,
  list: ListNode,
  carousel: CarouselNode,
  file_upload: FileUploadNode,
  location: LocationNode,
  contact_card: ContactCardNode,
  rating: RatingNode,
  nps: NPSNode,
  calendar: CalendarNode,
  // Logic
  switch: SwitchNode,
  ab_test: ABTestNode,
  // AI
  ai_classifier: AIClassifierNode,
  ai_sentiment: AISentimentNode,
  ai_extract: AIExtractNode,
  ai_summarize: AISummarizeNode,
  ai_translate: AITranslateNode,
};
