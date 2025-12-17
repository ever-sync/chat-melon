import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useContacts } from '@/hooks/crm/useContacts';
import { Node, Edge } from 'reactflow';
import { Play, CheckCircle, XCircle, Clock } from 'lucide-react';

type ExecutionLog = {
  nodeId: string;
  label: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  timestamp: Date;
};

export const PlaybookTester = ({
  open,
  onOpenChange,
  nodes,
  edges,
  playbookName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodes: Node[];
  edges: Edge[];
  playbookName: string;
}) => {
  const { contacts } = useContacts();
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);

  const runSimulation = async () => {
    if (!selectedContactId) return;

    setIsRunning(true);
    setExecutionLogs([]);

    // Simulate execution flow
    const sortedNodes = [...nodes].sort((a, b) => a.position.y - b.position.y);

    for (const node of sortedNodes) {
      // Add pending log
      setExecutionLogs((prev) => [
        ...prev,
        {
          nodeId: node.id,
          label: node.data.label,
          status: 'pending',
          timestamp: new Date(),
        },
      ]);

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update to running
      setExecutionLogs((prev) =>
        prev.map((log) => (log.nodeId === node.id ? { ...log, status: 'running' } : log))
      );

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Simulate result
      const success = Math.random() > 0.1; // 90% success rate

      setExecutionLogs((prev) =>
        prev.map((log) =>
          log.nodeId === node.id
            ? {
                ...log,
                status: success ? 'success' : 'error',
                message: success ? getSuccessMessage(node) : 'Erro ao executar ação',
              }
            : log
        )
      );

      if (!success) break; // Stop on error
    }

    setIsRunning(false);
  };

  const getSuccessMessage = (node: Node): string => {
    switch (node.data.nodeType) {
      case 'send_whatsapp':
        return 'Mensagem enviada com sucesso';
      case 'create_task':
        return 'Tarefa criada';
      case 'move_stage':
        return 'Deal movido para novo stage';
      case 'wait':
        return `Aguardando ${node.data.config?.wait_value || 1} ${node.data.config?.wait_unit || 'dias'}`;
      case 'call_webhook':
        return 'Webhook chamado com sucesso';
      default:
        return 'Ação executada';
    }
  };

  const getStatusIcon = (status: ExecutionLog['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: ExecutionLog['status']) => {
    const variants: Record<ExecutionLog['status'], string> = {
      pending: 'secondary',
      running: 'default',
      success: 'default',
      error: 'destructive',
    };
    return variants[status] || 'secondary';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Testar Automação: {playbookName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Selecione um contato para teste
            </label>
            <Select value={selectedContactId} onValueChange={setSelectedContactId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um contato..." />
              </SelectTrigger>
              <SelectContent>
                {contacts.slice(0, 20).map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name || contact.phone_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={runSimulation}
            disabled={!selectedContactId || isRunning}
            className="w-full"
          >
            <Play className="h-4 w-4 mr-2" />
            {isRunning ? 'Executando...' : 'Iniciar Simulação'}
          </Button>

          {executionLogs.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Log de Execução</h3>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {executionLogs.map((log, index) => (
                    <div
                      key={`${log.nodeId}-${index}`}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                    >
                      {getStatusIcon(log.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{log.label}</span>
                          <Badge variant={getStatusBadge(log.status) as any}>
                            {log.status === 'pending' && 'Pendente'}
                            {log.status === 'running' && 'Executando'}
                            {log.status === 'success' && 'Sucesso'}
                            {log.status === 'error' && 'Erro'}
                          </Badge>
                        </div>
                        {log.message && (
                          <p className="text-xs text-muted-foreground">{log.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {log.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
