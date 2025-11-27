import { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import { usePlaybooks } from "@/hooks/usePlaybooks";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TriggerNode } from "./nodes/TriggerNode";
import { ActionNode } from "./nodes/ActionNode";
import { ConditionNode } from "./nodes/ConditionNode";
import { NodePanel } from "./NodePanel";
import { NodeConfigPanel } from "./NodeConfigPanel";
import { PlaybookTester } from "./PlaybookTester";
import { Play, Save } from "lucide-react";
import { toast } from "sonner";

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
};

const initialNodes: Node[] = [
  {
    id: "start",
    type: "trigger",
    position: { x: 250, y: 50 },
    data: { label: "START", triggerType: "manual" },
  },
];

export const PlaybookFlowBuilder = ({
  open,
  onOpenChange,
  playbook,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playbook?: any;
}) => {
  const { createPlaybook, updatePlaybook } = usePlaybooks();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showTester, setShowTester] = useState(false);

  useEffect(() => {
    if (playbook && open) {
      setName(playbook.name);
      setDescription(playbook.description || "");
      
      // Load existing flow if available
      if (playbook.flow_data) {
        setNodes(playbook.flow_data.nodes || initialNodes);
        setEdges(playbook.flow_data.edges || []);
      }
    } else if (!open) {
      // Reset when closing
      setName("");
      setDescription("");
      setNodes(initialNodes);
      setEdges([]);
      setSelectedNode(null);
    }
  }, [playbook, open]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_event: any, node: Node) => {
    setSelectedNode(node);
  }, []);

  const addNode = useCallback(
    (type: string, nodeType: "trigger" | "action" | "condition", label: string) => {
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type: nodeType,
        position: { 
          x: Math.random() * 400 + 100, 
          y: Math.random() * 400 + 200 
        },
        data: { 
          label, 
          nodeType: type,
          config: {} 
        },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const updateNodeData = useCallback(
    (nodeId: string, newData: any) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
        )
      );
    },
    [setNodes]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      if (nodeId === "start") {
        toast.error("Não é possível excluir o node inicial");
        return;
      }
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
      }
    },
    [setNodes, setEdges, selectedNode]
  );

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Digite um nome para o playbook");
      return;
    }

    if (nodes.length <= 1) {
      toast.error("Adicione pelo menos uma ação ao playbook");
      return;
    }

    const flowData = {
      nodes,
      edges,
    };

    const data = {
      name,
      description,
      trigger_type: nodes[0]?.data?.triggerType || "manual",
      trigger_config: nodes[0]?.data?.config || {},
      steps: [], // Keep for backward compatibility
      flow_data: flowData as any,
      is_active: true,
    };

    if (playbook) {
      updatePlaybook.mutate(
        { id: playbook.id, updates: data },
        {
          onSuccess: () => {
            toast.success("Playbook atualizado!");
            onOpenChange(false);
          },
        }
      );
    } else {
      createPlaybook.mutate(data as any, {
        onSuccess: () => {
          toast.success("Playbook criado!");
          onOpenChange(false);
        },
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <DialogTitle>
                  {playbook ? "Editar Playbook" : "Novo Playbook"}
                </DialogTitle>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Nome do playbook..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="max-w-md"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTester(true)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Testar
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex h-[calc(95vh-120px)]">
            {/* Nodes Panel */}
            <NodePanel onAddNode={addNode} />

            {/* Flow Canvas */}
            <div className="flex-1 relative">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
              >
                <Controls />
                <MiniMap />
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
              </ReactFlow>
            </div>

            {/* Config Panel */}
            {selectedNode && (
              <NodeConfigPanel
                node={selectedNode}
                onUpdate={updateNodeData}
                onDelete={deleteNode}
                onClose={() => setSelectedNode(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <PlaybookTester
        open={showTester}
        onOpenChange={setShowTester}
        nodes={nodes}
        edges={edges}
        playbookName={name}
      />
    </>
  );
};
