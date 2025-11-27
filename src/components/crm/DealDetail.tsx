import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Flame, Snowflake, ThermometerSun, Phone, Mail } from "lucide-react";
import type { Deal } from "@/hooks/useDeals";
import { DealTimeline } from "./DealTimeline";

interface DealDetailProps {
  deal: Deal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (deal: Deal) => void;
}

export const DealDetail = ({ deal, open, onOpenChange, onEdit }: DealDetailProps) => {
  if (!deal) return null;

  const formatCurrency = (value: number | null) => {
    if (!value) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "urgent": return "destructive";
      case "high": return "default";
      case "medium": return "secondary";
      default: return "outline";
    }
  };

  const getTemperatureIcon = (score: number | null) => {
    if (!score) return <ThermometerSun className="h-5 w-5 text-muted-foreground" />;
    if (score >= 70) return <Flame className="h-5 w-5 text-orange-500" />;
    if (score >= 40) return <ThermometerSun className="h-5 w-5 text-yellow-500" />;
    return <Snowflake className="h-5 w-5 text-blue-500" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={deal.contacts?.profile_pic_url || undefined} />
                <AvatarFallback>
                  {deal.contacts?.name?.[0] || deal.contacts?.phone_number[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle>{deal.title}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {deal.contacts?.name || deal.contacts?.phone_number}
                </p>
              </div>
            </div>
            <Button onClick={() => onEdit(deal)} variant="outline" size="sm">
              Editar
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="proposals">Propostas</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="flex-1 overflow-y-auto space-y-6 mt-4">
            {/* Informações Principais */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Valor</p>
                <p className="text-2xl font-bold">{formatCurrency(deal.value)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Probabilidade</p>
                <p className="text-2xl font-bold">{deal.probability || 50}%</p>
              </div>
            </div>

            {/* Status e Prioridade */}
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Etapa</p>
                <Badge style={{ backgroundColor: deal.pipeline_stages?.color || undefined }}>
                  {deal.pipeline_stages?.name}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Prioridade</p>
                <Badge variant={getPriorityColor(deal.priority)}>
                  {deal.priority || "medium"}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Temperatura</p>
                {getTemperatureIcon(deal.temperature_score)}
              </div>
            </div>

            {/* Informações do Contato */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">Informações do Contato</h3>
              <div className="space-y-2">
                {deal.contacts?.phone_number && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{deal.contacts.phone_number}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Responsável */}
            {deal.profiles && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Responsável</h3>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={deal.profiles.avatar_url || undefined} />
                    <AvatarFallback>{deal.profiles.full_name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{deal.profiles.full_name}</p>
                    <p className="text-sm text-muted-foreground">Responsável pelo negócio</p>
                  </div>
                </div>
              </div>
            )}

            {/* Datas */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">Datas</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Criado em</p>
                  <p className="font-medium">
                    {new Date(deal.created_at!).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                {deal.expected_close_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Previsão de Fechamento</p>
                    <p className="font-medium">
                      {new Date(deal.expected_close_date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="flex-1 overflow-y-auto mt-4">
            <DealTimeline dealId={deal.id} />
          </TabsContent>

          <TabsContent value="proposals" className="flex-1 overflow-y-auto mt-4">
            <div className="text-center text-muted-foreground py-8">
              Propostas relacionadas aparecerão aqui
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
