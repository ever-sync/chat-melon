import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Flame, Snowflake, ThermometerSun, FileText, Mail, MessageCircle } from "lucide-react";
import type { Deal } from "@/hooks/useDeals";
import { ProposalBuilder } from "@/components/proposals/ProposalBuilder";
import { EmailComposer } from "./EmailComposer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DealCardProps {
  deal: Deal;
  onEdit: (deal: Deal) => void;
  onDelete: () => void;
  onView: (deal: Deal) => void;
}

export const DealCard = ({ deal, onEdit, onDelete, onView }: DealCardProps) => {
  const [showProposal, setShowProposal] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "default";
      case "medium":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getTemperatureIcon = (temp: string | null) => {
    if (!temp || temp === "warm") return <ThermometerSun className="h-4 w-4 text-yellow-500" />;
    if (temp === "hot") return <Flame className="h-4 w-4 text-orange-500" />;
    return <Snowflake className="h-4 w-4 text-blue-500" />;
  };

  const getBantProgress = () => {
    const bant = [
      deal.budget_confirmed,
      !!deal.decision_maker,
      !!deal.need_identified,
      deal.timeline_confirmed
    ];
    return bant.filter(Boolean).length * 25;
  };

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(date));
  };

  const handleOpenWhatsApp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!deal.contacts?.phone_number) {
      toast.error("Contato não possui número de telefone");
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
      toast.error("Não foi possível abrir a conversa");
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
      className="cursor-move hover:shadow-md transition-shadow"
      onClick={() => onView(deal)}
    >
      <CardContent className="p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={deal.contacts?.profile_pic_url || undefined} />
              <AvatarFallback>
                {deal.contacts?.name?.[0] || deal.contacts?.phone_number[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{deal.contacts?.name || deal.contacts?.phone_number}</p>
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
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(deal); }}>Editar</DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowProposal(true); }}>
                <FileText className="h-4 w-4 mr-2" />
                Criar Proposta
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowEmail(true); }}>
                <Mail className="h-4 w-4 mr-2" />
                Enviar Email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-destructive">
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
            <Badge variant={getPriorityColor(deal.priority)} className="text-xs">
              {deal.priority || "medium"}
            </Badge>
            {deal.probability !== null && (
              <Badge variant="outline" className="text-xs">
                {deal.probability}%
              </Badge>
            )}
            {getTemperatureIcon(deal.temperature)}
            {getBantProgress() > 0 && (
              <Badge variant="outline" className="text-xs">
                BANT {getBantProgress()}%
              </Badge>
            )}
          </div>

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
                <AvatarFallback className="text-xs">
                  {deal.profiles.full_name[0]}
                </AvatarFallback>
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
