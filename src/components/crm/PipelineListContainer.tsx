import { useState, useMemo } from "react";
import { useDeals, type Deal } from "@/hooks/crm/useDeals";
import { usePipelines } from "@/hooks/crm/usePipelines";
import { PipelineListView } from "./PipelineListView";
import { PipelineCalendarView } from "./PipelineCalendarView";
import { DealModal } from "./DealModal";
import { DealDetail } from "./DealDetail";
import { DealWinLossModal } from "./DealWinLossModal";
import { Skeleton } from "@/components/ui/skeleton";
import type { DealFilters } from "@/pages/CRM";
import type { TablesInsert } from "@/integrations/supabase/types";
import { useCelebration } from "@/hooks/useCelebration";
import { CelebrationModal } from "@/components/gamification/CelebrationModal";
import { toast } from "sonner";

interface PipelineListContainerProps {
    selectedPipelineId?: string;
    filters?: DealFilters;
    viewMode?: "list" | "calendar";
}

export const PipelineListContainer = ({ selectedPipelineId, filters, viewMode = "list" }: PipelineListContainerProps) => {
    const { pipelines, defaultPipeline } = usePipelines();
    const activePipelineId = selectedPipelineId || defaultPipeline?.id;

    const { deals, isLoading, createDeal, updateDeal, moveDeal, deleteDeal } = useDeals(activePipelineId);

    // States for modals
    const [modalOpen, setModalOpen] = useState(false);
    const [editingDeal, setEditingDeal] = useState<Deal | undefined>();
    const [viewingDeal, setViewingDeal] = useState<Deal | null>(null);
    const [showDealDetail, setShowDealDetail] = useState(false);
    const [winLossModal, setWinLossModal] = useState<{ open: boolean; type: "won" | "lost"; dealId?: string }>({
        open: false,
        type: "won",
    });

    // Selection State (Hoisted from PipelineListView)
    const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set());

    const { celebrate, showModal, setShowModal, celebrationType, celebrationData } = useCelebration();

    // Filter deals
    const filteredDeals = useMemo(() => {
        if (!filters || !deals) return deals || [];

        return deals.filter((deal) => {
            if (filters.search && !deal.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
            if (filters.assignedTo !== "all" && deal.assigned_to !== filters.assignedTo) return false;
            if (filters.priority !== "all" && deal.priority !== filters.priority) return false;
            if (filters.temperature !== "all" && deal.temperature !== filters.temperature) return false;
            return true;
        });
    }, [deals, filters]);

    // Handlers
    const handleEditDeal = (deal: Deal) => {
        setEditingDeal(deal);
        setModalOpen(true);
    };

    const handleDeleteDeal = (dealId: string) => {
        if (confirm("Tem certeza que deseja excluir este negócio?")) {
            deleteDeal.mutate(dealId);
        }
    };

    const handleViewDeal = (deal: Deal) => {
        setViewingDeal(deal);
        setShowDealDetail(true);
    }

    const handleSubmit = (data: TablesInsert<"deals">) => {
        if (editingDeal) {
            updateDeal.mutate({ id: editingDeal.id, ...data });
        } else {
            createDeal.mutate(data);
        }
        setEditingDeal(undefined);
    };

    // Bulk Handlers (Iterate over selectedDeals)
    const handleBulkMove = (stageId: string) => {
        selectedDeals.forEach(dealId => {
            moveDeal.mutate({ dealId, targetStageId: stageId });
        });
        toast.success(`${selectedDeals.size} negócios movidos!`);
        setSelectedDeals(new Set());
    };

    const handleBulkAssign = (userId: string) => {
        selectedDeals.forEach(dealId => {
            updateDeal.mutate({ id: dealId, assigned_to: userId });
        });
        toast.success(`${selectedDeals.size} negócios atribuídos!`);
        setSelectedDeals(new Set());
    };

    const handleBulkSetPriority = (priority: string) => {
        selectedDeals.forEach(dealId => {
            updateDeal.mutate({ id: dealId, priority: priority as any });
        });
        toast.success(`${selectedDeals.size} prioridades atualizadas!`);
        setSelectedDeals(new Set());
    };

    const handleBulkDelete = () => {
        if (confirm(`Excluir ${selectedDeals.size} negócios permanentemente?`)) {
            selectedDeals.forEach(dealId => {
                deleteDeal.mutate(dealId);
            });
            toast.success(`${selectedDeals.size} negócios excluídos!`);
            setSelectedDeals(new Set());
        }
    };

    if (isLoading) return <Skeleton className="w-full h-[400px]" />;

    return (
        <>
            {viewMode === "calendar" ? (
                <PipelineCalendarView
                    deals={filteredDeals}
                    onView={handleViewDeal}
                    onEdit={handleEditDeal}
                />
            ) : (
                <PipelineListView
                    deals={filteredDeals}
                    pipelineId={activePipelineId}
                    onEdit={handleEditDeal}
                    onDelete={handleDeleteDeal}
                    onView={handleViewDeal}
                    selectedDeals={selectedDeals}
                    onSelectionChange={setSelectedDeals}
                    onBulkMove={handleBulkMove}
                    onBulkAssign={handleBulkAssign}
                    onBulkSetPriority={handleBulkSetPriority}
                    onBulkDelete={handleBulkDelete}
                />
            )}

            <DealModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                deal={editingDeal}
                pipelineId={activePipelineId}
                onSubmit={handleSubmit}
            />

            <DealDetail
                deal={viewingDeal}
                open={showDealDetail}
                onOpenChange={setShowDealDetail}
                onEdit={handleEditDeal}
            />

            <CelebrationModal
                open={showModal}
                onOpenChange={setShowModal}
                type={celebrationType}
                data={celebrationData}
            />
        </>
    );
};
