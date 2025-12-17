import { useState } from "react";
import { DealWinLossModal } from "./DealWinLossModal";
import { DealDetail } from "./DealDetail";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DealCard } from "./DealCard";
import { DealModal } from "./DealModal";
import { useDeals, type Deal } from "@/hooks/crm/useDeals";
import { usePipelines } from "@/hooks/crm/usePipelines";
import { Skeleton } from "@/components/ui/skeleton";
import type { TablesInsert } from "@/integrations/supabase/types";
import { CelebrationModal } from "@/components/gamification/CelebrationModal";
import { useCelebration } from "@/hooks/useCelebration";
import { useGamification } from "@/hooks/useGamification";

interface PipelineBoardProps {
  selectedPipelineId?: string;
}

export const PipelineBoard = ({ selectedPipelineId }: PipelineBoardProps) => {
  const { pipelines, defaultPipeline, isLoading: isPipelinesLoading } = usePipelines();
  const activePipelineId = selectedPipelineId || defaultPipeline?.id;

  // Get stages for active pipeline
  const activePipeline = pipelines.find((p) => p.id === activePipelineId);
  const stages = ((activePipeline as any)?.pipeline_stages || []).sort(
    (a: any, b: any) => a.order_index - b.order_index
  );

  const { deals, isLoading: isDealsLoading, createDeal, updateDeal, moveDeal, deleteDeal } = useDeals(activePipelineId);
  const { celebrate, showModal, setShowModal, celebrationType, celebrationData } = useCelebration();
  const { checkAchievements } = useGamification();

  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string | undefined>();
  const [editingDeal, setEditingDeal] = useState<Deal | undefined>();
  const [viewingDeal, setViewingDeal] = useState<Deal | null>(null);
  const [showDealDetail, setShowDealDetail] = useState(false);
  const [winLossModal, setWinLossModal] = useState<{ open: boolean; type: "won" | "lost"; dealId?: string }>({
    open: false,
    type: "won",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const deal = deals.find((d) => d.id === event.active.id);
    setActiveDeal(deal || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);

    if (!over) return;

    const dealId = active.id as string;
    const overId = over.id as string;

    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;

    // O over.id pode ser um stage ID ou um deal ID
    // Se for um deal ID, precisamos encontrar o stage daquele deal
    let targetStageId = overId;
    const overDeal = deals.find((d) => d.id === overId);

    if (overDeal) {
      // Se soltou sobre um deal, usar o stage daquele deal
      targetStageId = overDeal.stage_id;
    }

    const targetStage = stages.find((s) => s.id === targetStageId);

    // Validar que o stage de destino existe no pipeline atual
    if (!targetStage) {
      console.error("Stage inválido:", targetStageId);
      return;
    }

    if (deal && deal.stage_id !== targetStageId) {
      // Abrir modal de ganho/perda se for stage de fechamento
      if (targetStage?.is_closed_won) {
        setWinLossModal({ open: true, type: "won", dealId });
        return;
      }

      if (targetStage?.is_closed_lost) {
        setWinLossModal({ open: true, type: "lost", dealId });
        return;
      }

      // Move normal para outros stages
      moveDeal.mutate({ dealId, targetStageId });
    }
  };

  const handleCreateDeal = (stageId: string) => {
    setSelectedStage(stageId);
    setEditingDeal(undefined);
    setModalOpen(true);
  };

  const handleEditDeal = (deal: Deal) => {
    setEditingDeal(deal);
    setModalOpen(true);
  };

  const handleViewDeal = (deal: Deal) => {
    setViewingDeal(deal);
    setShowDealDetail(true);
  };

  const handleDeleteDeal = (dealId: string) => {
    if (confirm("Tem certeza que deseja excluir este negócio?")) {
      deleteDeal.mutate(dealId);
    }
  };

  const handleSubmit = (data: TablesInsert<"deals">) => {
    if (editingDeal) {
      updateDeal.mutate({ id: editingDeal.id, ...data });
    } else {
      createDeal.mutate(data);
    }
    setEditingDeal(undefined);
    setSelectedStage(undefined);
  };

  const handleWinLoss = (data: { reason: string; detail: string }) => {
    if (!winLossModal.dealId) return;

    const deal = deals.find((d) => d.id === winLossModal.dealId);
    const targetStage = stages.find((s) =>
      winLossModal.type === "won" ? s.is_closed_won : s.is_closed_lost
    );

    if (!deal || !targetStage) return;

    // Atualiza o deal com motivo e move para stage
    const updateData: any = {
      id: deal.id,
      stage_id: targetStage.id,
      status: winLossModal.type === "won" ? "won" : "lost",
    };

    if (winLossModal.type === "won") {
      updateData.win_reason = data.reason;
      updateData.won_at = new Date().toISOString();
    } else {
      updateData.loss_reason = data.reason;
      updateData.loss_reason_detail = data.detail;
      updateData.lost_at = new Date().toISOString();
    }

    updateDeal.mutate(updateData);

    // Celebração se ganhou
    if (winLossModal.type === "won") {
      setTimeout(() => {
        celebrate("deal_won", {
          title: deal.title,
          value: deal.value || 0,
        });
        checkAchievements();
      }, 500);
    }
  };

  const formatCurrency = (deals: Deal[]) => {
    const total = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(total);
  };

  if (isPipelinesLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="min-w-[280px] h-[600px] flex-shrink-0" />
        ))}
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory">
          {stages.map((stage) => {
            const stageDeals = deals.filter((deal) => deal.stage_id === stage.id);
            return (
              <Card
                key={stage.id}
                className="min-w-[300px] max-w-[340px] flex-shrink-0 flex flex-col snap-start border-0 shadow-lg rounded-3xl overflow-hidden bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                {/* Gradient top border */}
                <div
                  className="h-1.5 w-full"
                  style={{ background: `linear-gradient(90deg, ${stage.color}, ${stage.color}dd)` }}
                />

                <CardHeader className="pb-4 pt-5 px-6">
                  <div className="flex justify-between items-center mb-3">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shadow-sm"
                        style={{ backgroundColor: stage.color }}
                      />
                      {stage.name}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-xl hover:bg-gray-100 transition-colors"
                      onClick={() => handleCreateDeal(stage.id)}
                    >
                      <Plus className="h-4 w-4 text-gray-600" />
                    </Button>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-sm text-gray-500 font-medium">
                      {stageDeals.length} {stageDeals.length === 1 ? "negócio" : "negócios"}
                    </span>
                    <span
                      className="text-sm font-bold px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: `${stage.color}15`,
                        color: stage.color
                      }}
                    >
                      {formatCurrency(stageDeals)}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto space-y-3 pt-0 px-6 pb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <SortableContext
                    items={stageDeals.map((d) => d.id)}
                    strategy={verticalListSortingStrategy}
                    id={stage.id}
                  >
                    {stageDeals.map((deal) => (
                      <DealCard
                        key={deal.id}
                        deal={deal}
                        onEdit={handleEditDeal}
                        onDelete={() => handleDeleteDeal(deal.id)}
                        onView={handleViewDeal}
                      />
                    ))}

                    {stageDeals.length === 0 && (
                      <div className="text-center py-12 text-gray-400">
                        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-50 flex items-center justify-center">
                          <Plus className="h-8 w-8 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium">Nenhum negócio</p>
                        <p className="text-xs mt-1">Arraste cards para cá</p>
                      </div>
                    )}
                  </SortableContext>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <DragOverlay>
          {activeDeal ? (
            <DealCard
              deal={activeDeal}
              onEdit={(deal) => { }}
              onDelete={() => { }}
              onView={() => { }}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <DealModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        deal={editingDeal}
        stageId={selectedStage}
        pipelineId={activePipelineId}
        onSubmit={handleSubmit}
      />

      <CelebrationModal
        open={showModal}
        onOpenChange={setShowModal}
        type={celebrationType}
        data={celebrationData}
      />

      <DealDetail
        deal={viewingDeal}
        open={showDealDetail}
        onOpenChange={setShowDealDetail}
        onEdit={handleEditDeal}
      />

      <DealWinLossModal
        open={winLossModal.open}
        onOpenChange={(open) => setWinLossModal({ ...winLossModal, open })}
        type={winLossModal.type}
        onSubmit={handleWinLoss}
      />
    </>
  );
};
