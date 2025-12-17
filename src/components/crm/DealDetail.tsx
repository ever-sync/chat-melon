import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Phone,
  Mail,
  MessageCircle,
  Edit,
  MoreVertical,
  Calendar,
  User,
  Building,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Copy,
  Trash2,
} from 'lucide-react';
import type { Deal } from '@/hooks/crm/useDeals';
import { useDeals } from '@/hooks/crm/useDeals';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

// Importar novos componentes
import { DealNotesSection } from './DealNotesSection';
import { DealTasksSection } from './DealTasksSection';
import { DealFilesSection } from './DealFilesSection';
import { DealActivityTimeline } from './DealActivityTimeline';
import { DealTemperatureIndicator } from './DealTemperatureIndicator';
import { DealWinLossModal } from './DealWinLossModal';

interface DealDetailProps {
  deal: Deal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (deal: Deal) => void;
}

export const DealDetail = ({ deal, open, onOpenChange, onEdit }: DealDetailProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const { updateDeal, deleteDeal, createDeal } = useDeals(deal?.pipeline_id);

  // Estados para modais
  const [winLossModal, setWinLossModal] = useState<{
    open: boolean;
    type: 'won' | 'lost';
  }>({
    open: false,
    type: 'won',
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (!deal) return null;

  const formatCurrency = (value: number | null) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getPriorityConfig = (priority: string | null) => {
    switch (priority) {
      case 'urgent':
        return { label: 'Urgente', variant: 'destructive' as const };
      case 'high':
        return { label: 'Alta', variant: 'default' as const };
      case 'medium':
        return { label: 'Média', variant: 'secondary' as const };
      default:
        return { label: 'Baixa', variant: 'outline' as const };
    }
  };

  const priorityConfig = getPriorityConfig(deal.priority);

  // Calcular dias desde última atividade
  const daysSinceActivity = deal.last_activity
    ? Math.floor(
        (new Date().getTime() - new Date(deal.last_activity).getTime()) / (1000 * 60 * 60 * 24)
      )
    : undefined;

  // Handlers para ações
  const handleMarkAsWon = () => {
    setWinLossModal({ open: true, type: 'won' });
  };

  const handleMarkAsLost = () => {
    setWinLossModal({ open: true, type: 'lost' });
  };

  const handleWinLoss = (data: { reason: string; detail: string }) => {
    const updateData: any = {
      id: deal.id,
      status: winLossModal.type === 'won' ? 'won' : 'lost',
    };

    if (winLossModal.type === 'won') {
      updateData.win_reason = data.reason;
      updateData.won_at = new Date().toISOString();
    } else {
      updateData.loss_reason = data.reason;
      updateData.loss_reason_detail = data.detail;
      updateData.lost_at = new Date().toISOString();
    }

    updateDeal.mutate(updateData, {
      onSuccess: () => {
        setWinLossModal({ open: false, type: 'won' });
        onOpenChange(false);
        toast.success(
          winLossModal.type === 'won'
            ? 'Negócio marcado como ganho!'
            : 'Negócio marcado como perdido'
        );
      },
    });
  };

  const handleDuplicate = () => {
    if (!deal) return;

    const newDeal = {
      pipeline_id: deal.pipeline_id,
      stage_id: deal.stage_id,
      contact_id: deal.contact_id,
      assigned_to: deal.assigned_to,
      title: `${deal.title} (Cópia)`,
      value: deal.value,
      probability: deal.probability,
      priority: deal.priority,
      temperature: deal.temperature,
      expected_close_date: deal.expected_close_date,
      budget_confirmed: deal.budget_confirmed,
      timeline_confirmed: deal.timeline_confirmed,
      decision_maker: deal.decision_maker,
      need_identified: deal.need_identified,
    };

    createDeal.mutate(newDeal, {
      onSuccess: () => {
        toast.success('Negócio duplicado com sucesso!');
        onOpenChange(false);
      },
    });
  };

  const handleDelete = () => {
    if (!deal) return;

    deleteDeal.mutate(deal.id, {
      onSuccess: () => {
        setShowDeleteDialog(false);
        onOpenChange(false);
        toast.success('Negócio excluído com sucesso!');
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
        {/* Header fixo */}
        <SheetHeader className="px-6 py-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="h-12 w-12">
                <AvatarImage src={deal.contacts?.profile_pic_url || undefined} />
                <AvatarFallback>
                  {deal.contacts?.name?.[0] || deal.contacts?.phone_number[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-lg truncate">{deal.title}</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  {deal.contacts?.name || deal.contacts?.phone_number}
                </p>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2">
              {/* Ações Rápidas (Visíveis se Open) */}
              {deal.status === 'open' && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={handleMarkAsWon}
                    title="Marcar como Ganho"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleMarkAsLost}
                    title="Marcar como Perda"
                  >
                    <XCircle className="h-5 w-5" />
                  </Button>
                  <Separator orientation="vertical" className="h-6 mx-1" />
                </>
              )}

              <Button variant="outline" size="icon" onClick={() => onEdit(deal)}>
                <Edit className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleMarkAsWon}>
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                    Marcar como Ganho
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleMarkAsLost}>
                    <XCircle className="h-4 w-4 mr-2 text-red-600" />
                    Marcar como Perda
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDuplicate}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Métricas rápidas */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="text-center p-2 bg-muted rounded-lg">
              <p className="text-xl font-bold text-green-600">{formatCurrency(deal.value)}</p>
              <p className="text-xs text-muted-foreground">Valor</p>
            </div>
            <div className="text-center p-2 bg-muted rounded-lg">
              <p className="text-xl font-bold">{deal.probability || 50}%</p>
              <p className="text-xs text-muted-foreground">Probabilidade</p>
            </div>
            <div className="text-center p-2 bg-muted rounded-lg">
              <Badge
                style={{
                  backgroundColor: deal.pipeline_stages?.color || undefined,
                }}
                className="w-full justify-center text-white"
              >
                {deal.pipeline_stages?.name}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">Etapa</p>
            </div>
          </div>
        </SheetHeader>

        {/* Conteúdo com abas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="sticky top-[180px] bg-background z-10 border-b px-6">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
              <TabsTrigger value="overview" className="rounded-none border-b-2">
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="notes" className="rounded-none border-b-2">
                Notas
              </TabsTrigger>
              <TabsTrigger value="tasks" className="rounded-none border-b-2">
                Tarefas
              </TabsTrigger>
              <TabsTrigger value="files" className="rounded-none border-b-2">
                Arquivos
              </TabsTrigger>
              <TabsTrigger value="activity" className="rounded-none border-b-2">
                Histórico
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Visão Geral */}
          <TabsContent value="overview" className="px-6 py-4 space-y-6 mt-0">
            {/* Temperatura */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Temperatura do Negócio
              </h3>
              <DealTemperatureIndicator
                temperature={deal.temperature}
                temperatureScore={deal.temperature_score}
                budgetConfirmed={deal.budget_confirmed}
                timelineConfirmed={deal.timeline_confirmed}
                decisionMaker={deal.decision_maker}
                daysSinceActivity={daysSinceActivity}
              />
            </div>

            <Separator />

            {/* BANT - Qualificação */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Qualificação (BANT)</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        deal.budget_confirmed ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                    <span className="text-sm font-medium">Orçamento Confirmado</span>
                  </div>
                  <Badge variant={deal.budget_confirmed ? 'default' : 'outline'}>
                    {deal.budget_confirmed ? 'Sim' : 'Não'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        deal.timeline_confirmed ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                    <span className="text-sm font-medium">Timeline Confirmado</span>
                  </div>
                  <Badge variant={deal.timeline_confirmed ? 'default' : 'outline'}>
                    {deal.timeline_confirmed ? 'Sim' : 'Não'}
                  </Badge>
                </div>

                {deal.decision_maker && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Tomador de Decisão</p>
                    <p className="font-medium">{deal.decision_maker}</p>
                  </div>
                )}

                {deal.need_identified && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Necessidade Identificada</p>
                    <p className="text-sm">{deal.need_identified}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Informações do Contato */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Informações do Contato
              </h3>
              <div className="space-y-2">
                {deal.contacts?.phone_number && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{deal.contacts.phone_number}</span>
                  </div>
                )}
                {deal.contacts?.enrichment_data?.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{deal.contacts.enrichment_data.email}</span>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3"
                onClick={() => {
                  onOpenChange(false);
                  navigate(`/chat?contact=${deal.contact_id}`);
                }}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Abrir Chat com Contato
              </Button>
            </div>

            <Separator />

            {/* Responsável */}
            {deal.profiles && (
              <>
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Responsável
                  </h3>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Avatar>
                      <AvatarImage src={deal.profiles.avatar_url || undefined} />
                      <AvatarFallback>{deal.profiles.full_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{deal.profiles.full_name}</p>
                      <p className="text-sm text-muted-foreground">Responsável pelo negócio</p>
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Outras Informações */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Outras Informações</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Prioridade</p>
                  <Badge variant={priorityConfig.variant}>{priorityConfig.label}</Badge>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <Badge>{deal.status || 'open'}</Badge>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Criado em</p>
                  <p className="text-sm font-medium">
                    {format(new Date(deal.created_at!), 'dd/MM/yyyy', {
                      locale: ptBR,
                    })}
                  </p>
                </div>

                {deal.expected_close_date && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Fechamento Esperado
                    </p>
                    <p className="text-sm font-medium">
                      {format(new Date(deal.expected_close_date), 'dd/MM/yyyy', {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Notas */}
          <TabsContent value="notes" className="px-6 py-4 mt-0">
            <DealNotesSection dealId={deal.id} />
          </TabsContent>

          {/* Tarefas */}
          <TabsContent value="tasks" className="px-6 py-4 mt-0">
            <DealTasksSection dealId={deal.id} />
          </TabsContent>

          {/* Arquivos */}
          <TabsContent value="files" className="px-6 py-4 mt-0">
            <DealFilesSection dealId={deal.id} />
          </TabsContent>

          {/* Histórico */}
          <TabsContent value="activity" className="px-6 py-4 mt-0">
            <DealActivityTimeline dealId={deal.id} />
          </TabsContent>
        </Tabs>
      </SheetContent>

      {/* Modal de Ganho/Perda */}
      <DealWinLossModal
        open={winLossModal.open}
        onOpenChange={(open) => setWinLossModal({ ...winLossModal, open })}
        type={winLossModal.type}
        onSubmit={handleWinLoss}
      />

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir negócio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O negócio "{deal.title}" será permanentemente
              excluído, incluindo todas as notas, tarefas e arquivos vinculados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Negócio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
};
