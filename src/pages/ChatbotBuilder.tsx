import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  ReactFlowProvider,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Save,
  Play,
  Pause,
  Settings,
  History,
  ArrowLeft,
  Loader2,
  MoreVertical,
  Trash2,
  Copy,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/ui/use-toast';
import { useChatbot, useChatbotVersions } from '@/hooks/chat/useChatbots';
import { nodeTypes } from '@/components/chatbot/nodes/BaseNode';
import { NodePalette } from '@/components/chatbot/NodePalette';
import { NodeEditor } from '@/components/chatbot/NodeEditor';
import { NODE_TYPE_INFO, type ChatbotNodeType, type ChatbotNode } from '@/types/chatbot';

function ChatbotBuilderContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const { chatbot, isLoading, saveFlow, publish, pause, activate } = useChatbot(id);
  const { versions } = useChatbotVersions(id);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<ChatbotNode | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');

  // Dialogs
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState('');
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  // Load chatbot data
  useEffect(() => {
    if (chatbot) {
      setNodes(chatbot.nodes || []);
      setEdges(chatbot.edges || []);
      setName(chatbot.name);
    }
  }, [chatbot, setNodes, setEdges]);

  // Track changes
  useEffect(() => {
    if (chatbot && nodes.length > 0) {
      const nodesChanged = JSON.stringify(nodes) !== JSON.stringify(chatbot.nodes);
      const edgesChanged = JSON.stringify(edges) !== JSON.stringify(chatbot.edges);
      setHasChanges(nodesChanged || edgesChanged);
    }
  }, [nodes, edges, chatbot]);

  // Auto-save periodically
  useEffect(() => {
    if (!hasChanges || isSaving) return;

    const timer = setTimeout(() => {
      handleSave();
    }, 30000); // Auto-save after 30 seconds of changes

    return () => clearTimeout(timer);
  }, [hasChanges, nodes, edges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as ChatbotNodeType;
      if (!type || !reactFlowInstance || !reactFlowWrapper.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const nodeInfo = NODE_TYPE_INFO[type];
      const newNode: ChatbotNode = {
        id: `${type}_${Date.now()}`,
        type,
        position,
        data: { ...nodeInfo.defaultData },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [reactFlowInstance, setNodes]
  );

  const onDragStart = useCallback((event: React.DragEvent, nodeType: ChatbotNodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  const onNodeClick = useCallback((_: React.MouseEvent, node: ChatbotNode) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const updateNodeData = useCallback(
    (nodeId: string, data: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
        )
      );
    },
    [setNodes]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
      setSelectedNode(null);
    },
    [setNodes, setEdges]
  );

  const handleSave = async () => {
    if (!hasChanges || isSaving) return;

    setIsSaving(true);
    try {
      await saveFlow.mutateAsync({ nodes, edges });
      setHasChanges(false);
      toast({
        title: 'Salvo',
        description: 'Alterações salvas com sucesso.',
      });
    } catch {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as alterações.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      // Save first
      if (hasChanges) {
        await saveFlow.mutateAsync({ nodes, edges });
      }
      await publish.mutateAsync({ release_notes: releaseNotes });
      setPublishDialogOpen(false);
      setReleaseNotes('');
      toast({
        title: 'Publicado',
        description: 'Chatbot publicado com sucesso!',
      });
    } catch {
      toast({
        title: 'Erro ao publicar',
        description: 'Não foi possível publicar o chatbot.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async () => {
    try {
      if (chatbot?.status === 'active') {
        await pause.mutateAsync();
        toast({ title: 'Pausado', description: 'Chatbot pausado.' });
      } else {
        await activate.mutateAsync();
        toast({ title: 'Ativado', description: 'Chatbot ativado.' });
      }
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status.',
        variant: 'destructive',
      });
    }
  };

  const exportFlow = () => {
    const data = {
      name: chatbot?.name,
      nodes,
      edges,
      variables: chatbot?.variables,
      settings: chatbot?.settings,
      triggers: chatbot?.triggers,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chatbot?.name || 'chatbot'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!chatbot) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Chatbot não encontrado</p>
        <Button onClick={() => navigate('/chatbots')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    archived: 'bg-red-100 text-red-700',
  };

  const statusLabels = {
    draft: 'Rascunho',
    active: 'Ativo',
    paused: 'Pausado',
    archived: 'Arquivado',
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/chatbots')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 border-none bg-transparent text-lg font-semibold shadow-none focus-visible:ring-0"
            />
          </div>
          <Badge className={statusColors[chatbot.status]}>{statusLabels[chatbot.status]}</Badge>
          {hasChanges && (
            <span className="text-xs text-muted-foreground">Alterações não salvas</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setHistoryDialogOpen(true)}>
            <History className="mr-2 h-4 w-4" />
            Versões
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar
          </Button>

          {chatbot.status === 'active' ? (
            <Button variant="outline" size="sm" onClick={handleToggleStatus}>
              <Pause className="mr-2 h-4 w-4" />
              Pausar
            </Button>
          ) : (
            <Button size="sm" onClick={() => setPublishDialogOpen(true)}>
              <Play className="mr-2 h-4 w-4" />
              Publicar
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportFlow}>
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Node Palette */}
        <NodePalette onDragStart={onDragStart} />

        {/* Canvas */}
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            defaultEdgeOptions={{
              animated: true,
              style: { strokeWidth: 2 },
            }}
          >
            <Background gap={15} size={1} />
            <Controls />
            <MiniMap nodeStrokeWidth={3} zoomable pannable className="!bg-muted/50" />
          </ReactFlow>
        </div>

        {/* Node Editor */}
        {selectedNode && (
          <NodeEditor
            node={selectedNode}
            onUpdate={updateNodeData}
            onClose={() => setSelectedNode(null)}
            onDelete={deleteNode}
          />
        )}
      </div>

      {/* Publish Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publicar Chatbot</DialogTitle>
            <DialogDescription>
              Isso criará a versão {chatbot.version + 1} e ativará o chatbot.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Notas da versão (opcional)</Label>
              <Textarea
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                placeholder="Descreva as alterações desta versão..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePublish} disabled={publish.isPending}>
              {publish.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Histórico de Versões</DialogTitle>
            <DialogDescription>Veja o histórico de publicações do chatbot.</DialogDescription>
          </DialogHeader>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {versions.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                Nenhuma versão publicada ainda.
              </p>
            ) : (
              versions.map((version) => (
                <div
                  key={version.id}
                  className="flex items-start justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">v{version.version}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(version.published_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {version.release_notes && (
                      <p className="mt-1 text-sm">{version.release_notes}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ChatbotBuilder() {
  return (
    <ReactFlowProvider>
      <ChatbotBuilderContent />
    </ReactFlowProvider>
  );
}
