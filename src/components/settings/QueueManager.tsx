import { useState } from 'react';
import { useQueues, useQueueMembers } from '@/hooks/useQueues';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings, Users, Clock } from 'lucide-react';
import { QueueModal } from './QueueModal';
import { QueueMembersModal } from './QueueMembersModal';

export const QueueManager = () => {
  const { queues, isLoading } = useQueues();
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [editingQueue, setEditingQueue] = useState<any>(null);

  const handleEditQueue = (queue: any) => {
    setEditingQueue(queue);
    setShowQueueModal(true);
  };

  const handleManageMembers = (queueId: string) => {
    setSelectedQueue(queueId);
    setShowMembersModal(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-24 bg-muted" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Filas de Atendimento</h2>
          <p className="text-muted-foreground">
            Organize sua equipe em filas para melhor distribuição de conversas
          </p>
        </div>
        <Button onClick={() => setShowQueueModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Fila
        </Button>
      </div>

      {!queues || queues.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma fila criada</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie sua primeira fila para começar a organizar o atendimento
            </p>
            <Button onClick={() => setShowQueueModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Fila
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {queues.map((queue) => (
            <QueueCard
              key={queue.id}
              queue={queue}
              onEdit={handleEditQueue}
              onManageMembers={handleManageMembers}
            />
          ))}
        </div>
      )}

      <QueueModal
        open={showQueueModal}
        onClose={() => {
          setShowQueueModal(false);
          setEditingQueue(null);
        }}
        queue={editingQueue}
      />

      {selectedQueue && (
        <QueueMembersModal
          open={showMembersModal}
          onClose={() => {
            setShowMembersModal(false);
            setSelectedQueue(null);
          }}
          queueId={selectedQueue}
        />
      )}
    </div>
  );
};

interface QueueCardProps {
  queue: any;
  onEdit: (queue: any) => void;
  onManageMembers: (queueId: string) => void;
}

const QueueCard = ({ queue, onEdit, onManageMembers }: QueueCardProps) => {
  const { members } = useQueueMembers(queue.id);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: queue.color }} />
            <CardTitle className="text-lg">{queue.name}</CardTitle>
          </div>
          <Badge variant={queue.is_active ? 'default' : 'secondary'}>
            {queue.is_active ? 'Ativa' : 'Inativa'}
          </Badge>
        </div>
        {queue.description && <CardDescription>{queue.description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{members?.length || 0} membros</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Máx. {queue.max_conversations_per_agent} conv.
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium">Distribuição:</span>{' '}
            <span className="text-muted-foreground">
              {queue.assignment_method === 'round_robin'
                ? 'Rodízio'
                : queue.assignment_method === 'least_busy'
                  ? 'Menos ocupado'
                  : 'Aleatório'}
            </span>
          </div>
          <div className="text-sm">
            <span className="font-medium">Auto-atribuir:</span>{' '}
            <span className="text-muted-foreground">{queue.auto_assign ? 'Sim' : 'Não'}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onManageMembers(queue.id)}
          >
            <Users className="mr-2 h-4 w-4" />
            Membros
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(queue)}>
            <Settings className="mr-2 h-4 w-4" />
            Configurar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
