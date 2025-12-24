import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreVertical,
  FileText,
  Mail,
  MessageCircle,
  CheckSquare,
  StickyNote,
  Paperclip,
  Calendar,
} from 'lucide-react';
import type { Deal } from '@/hooks/crm/useDeals';
import { ProposalBuilder } from '@/components/proposals/ProposalBuilder';
import { EmailComposer } from './EmailComposer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DealTemperatureIcon } from './DealTemperatureIndicator';
import { useDealNotes } from '@/hooks/crm/useDealNotes';
import { useDealTasks } from '@/hooks/crm/useDealTasks';
import { useDealFiles } from '@/hooks/crm/useDealFiles';

interface DealCardProps {
  deal: Deal;
  onEdit: (deal: Deal) => void;
  onDelete: () => void;
  onView: (deal: Deal) => void;
  isSelected?: boolean;
  onSelect?: (dealId: string, selected: boolean) => void;
}

export const DealCard = ({
  deal,
  onEdit,
  onDelete,
  onView,
  isSelected,
  onSelect,
}: DealCardProps) => {
  const [showProposal, setShowProposal] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
  });

  // Fetch counters
  const { notes } = useDealNotes(deal.id);
  const { pendingTasks } = useDealTasks(deal.id);
  const { files } = useDealFiles(deal.id);

  const handleCheckboxChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(deal.id, !isSelected);
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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
        return {
          variant: 'destructive' as const,
          label: 'Urgente',
          className: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400',
        };
      case 'high':
        return {
          variant: 'default' as const,
          label: 'Alta',
          className:
            'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400',
        };
      case 'medium':
        return {
          variant: 'secondary' as const,
          label: 'Média',
          className:
            'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400',
        };
      default:
        return {
          variant: 'outline' as const,
          label: 'Baixa',
          className:
            'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800/30 dark:text-gray-400',
        };
    }
  };

  const getBantProgress = () => {
    const bant = [
      deal.budget_confirmed,
      !!deal.decision_maker,
      !!deal.need_identified,
      deal.timeline_confirmed,
    ];
    return bant.filter(Boolean).length * 25;
  };

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(
      new Date(date)
    );
  };

  const handleOpenWhatsApp = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!deal.contacts?.phone_number) {
      toast.error('Contato não possui número de telefone');
      return;
    }

    try {
      // Buscar conversa existente com este contato
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('contact_id', deal.contact_id)
        .eq('company_id', deal.company_id)
        .maybeSingle();

      if (conversation) {
        // Se já existe conversa, navegar para ela
        navigate(`/chat?conversation=${conversation.id}`);
      } else {
        // Se não existe, abrir chat e o sistema criará a conversa
        navigate(`/chat?contact=${deal.contact_id}`);
      }
    } catch (error) {
      console.error('Erro ao abrir WhatsApp:', error);
      toast.error('Não foi possível abrir a conversa');
    }
  };

  const handleOpenEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEmail(true);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-move hover:shadow-md transition-all ${isSelected ? 'ring-2 ring-indigo-500 shadow-lg' : ''}`}
      onClick={() => onView(deal)}
    >
      <CardContent className="p-4 space-y-3 cursor-pointer">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Checkbox para seleção múltipla */}
            {onSelect && (
              <div onClick={handleCheckboxChange}>
                <Checkbox checked={isSelected} className="mt-1" />
              </div>
            )}
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={deal.contacts?.profile_pic_url || undefined} />
              <AvatarFallback>
                {deal.contacts?.name?.[0] || deal.contacts?.phone_number[0]}
              </AvatarFallback>
            </Avatar>
            <div
              className="flex-1 min-w-0 cursor-pointer group/name"
              onClick={(e) => {
                e.stopPropagation();
                onView(deal);
              }}
            >
              <p className="font-medium text-sm truncate group-hover/name:text-indigo-600 transition-colors">
                {deal.contacts?.name || deal.contacts?.phone_number}
              </p>
              <p className="text-xs text-muted-foreground truncate">{deal.title}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(deal);
                }}
              >
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProposal(true);
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Criar Proposta
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEmail(true);
                }}
              >
                <Mail className="h-4 w-4 mr-2" />
                Enviar Email
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-destructive"
              >
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold">{formatCurrency(deal.value)}</p>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleOpenWhatsApp}
                title="Abrir WhatsApp"
              >
                <MessageCircle className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleOpenEmail}
                title="Enviar Email"
              >
                <Mail className="h-4 w-4 text-blue-600" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {(() => {
              const priorityConfig = getPriorityConfig(deal.priority);
              return (
                <Badge
                  variant={priorityConfig.variant}
                  className={`text-xs ${priorityConfig.className}`}
                >
                  {priorityConfig.label}
                </Badge>
              );
            })()}
            {deal.probability !== null && (
              <Badge variant="outline" className="text-xs">
                {deal.probability}%
              </Badge>
            )}
            <DealTemperatureIcon temperature={deal.temperature as any} />
            {getBantProgress() > 0 && (
              <Badge variant="outline" className="text-xs">
                BANT {getBantProgress()}%
              </Badge>
            )}
          </div>

          {/* Counters */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {(pendingTasks?.length ?? 0) > 0 && (
              <div
                className="flex items-center gap-1"
                title={`${pendingTasks?.length} tarefas pendentes`}
              >
                <CheckSquare className="h-3.5 w-3.5" />
                <span>{pendingTasks?.length}</span>
              </div>
            )}
            {(notes?.length ?? 0) > 0 && (
              <div className="flex items-center gap-1" title={`${notes?.length} notas`}>
                <StickyNote className="h-3.5 w-3.5" />
                <span>{notes?.length}</span>
              </div>
            )}
            {(files?.length ?? 0) > 0 && (
              <div className="flex items-center gap-1" title={`${files?.length} arquivos`}>
                <Paperclip className="h-3.5 w-3.5" />
                <span>{files?.length}</span>
              </div>
            )}
          </div>

          {deal.expected_close_date && (
            <div
              className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/30 p-1.5 rounded"
              title="Previsão de fechamento"
            >
              <Calendar className="w-3 h-3" />
              <span className="font-medium">Fechamento:</span>
              <span>{formatDate(deal.expected_close_date)}</span>
            </div>
          )}

          {deal.next_step && (
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              <span className="font-medium">Próximo: </span>
              <span className="truncate">{deal.next_step}</span>
              {deal.next_step_date && (
                <span className="ml-1">({formatDate(deal.next_step_date)})</span>
              )}
            </div>
          )}

          {deal.profiles && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Avatar className="h-5 w-5">
                <AvatarImage src={deal.profiles.avatar_url || undefined} />
                <AvatarFallback className="text-xs">{deal.profiles.full_name[0]}</AvatarFallback>
              </Avatar>
              <span className="truncate">{deal.profiles.full_name}</span>
            </div>
          )}
        </div>
      </CardContent>

      <ProposalBuilder
        open={showProposal}
        onOpenChange={setShowProposal}
        dealId={deal.id}
        dealTitle={deal.title}
      />

      {showEmail && deal.contacts && (
        <EmailComposer
          open={showEmail}
          onOpenChange={setShowEmail}
          toEmail={
            (deal.contacts.enrichment_data as any)?.email ||
            deal.contacts.name ||
            deal.contacts.phone_number
          }
          contactId={deal.contact_id}
          dealId={deal.id}
          contactName={deal.contacts.name || undefined}
          dealTitle={deal.title}
        />
      )}
    </Card>
  );
};
