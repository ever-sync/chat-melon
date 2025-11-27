import { useState, useRef, useEffect } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DealCard } from "@/components/crm/DealCard";
import { DealModal } from "@/components/crm/DealModal";
import { usePipelines } from "@/hooks/usePipelines";
import { useDeals } from "@/hooks/useDeals";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export const MobilePipelineLayout = () => {
  const isMobile = useIsMobile();
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [showDealModal, setShowDealModal] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  
  const { pipelines, stages, isLoading: pipelinesLoading } = usePipelines();
  const { deals, isLoading: dealsLoading } = useDeals();

  const currentStage = stages?.[currentStageIndex];
  const stageDeals = deals?.filter(deal => deal.stage_id === currentStage?.id) || [];

  useEffect(() => {
    if (!containerRef.current) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX.current - touchEndX;

      if (Math.abs(diff) > 50) {
        if (diff > 0 && currentStageIndex < (stages?.length || 0) - 1) {
          setCurrentStageIndex(prev => prev + 1);
        } else if (diff < 0 && currentStageIndex > 0) {
          setCurrentStageIndex(prev => prev - 1);
        }
      }
    };

    const container = containerRef.current;
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentStageIndex, stages]);

  if (!isMobile) return null;
  if (pipelinesLoading || dealsLoading) return <div className="p-4">Carregando...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] pb-16">
      {/* Header com navegação */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentStageIndex(prev => Math.max(0, prev - 1))}
          disabled={currentStageIndex === 0}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex-1 text-center">
          <h2 className="text-lg font-semibold truncate">
            {currentStage?.name || 'Pipeline'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {stageDeals.length} {stageDeals.length === 1 ? 'negócio' : 'negócios'}
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentStageIndex(prev => Math.min((stages?.length || 0) - 1, prev + 1))}
          disabled={currentStageIndex === (stages?.length || 0) - 1}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Dots indicator */}
      <div className="flex items-center justify-center gap-2 py-3">
        {stages?.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentStageIndex(index)}
            className={cn(
              "h-2 rounded-full transition-all",
              index === currentStageIndex
                ? "w-8 bg-primary"
                : "w-2 bg-muted"
            )}
          />
        ))}
      </div>

      {/* Lista de deals com swipe */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 space-y-3"
      >
        {stageDeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <p>Nenhum negócio nesta etapa</p>
          </div>
        ) : (
          stageDeals.map((deal) => (
            <div 
              key={deal.id} 
              onClick={() => setSelectedDealId(deal.id)}
              className="cursor-pointer"
            >
              <DealCard 
                deal={deal}
                onEdit={() => {
                  setSelectedDealId(deal.id);
                  setShowDealModal(true);
                }}
                onDelete={() => {}}
                onView={() => {
                  setSelectedDealId(deal.id);
                  setShowDealModal(true);
                }}
              />
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <Button
        size="icon"
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
        onClick={() => {
          setSelectedDealId(null);
          setShowDealModal(true);
        }}
      >
        <Plus className="h-6 w-6" />
      </Button>

      <DealModal
        open={showDealModal}
        onOpenChange={setShowDealModal}
        deal={selectedDealId ? deals?.find(d => d.id === selectedDealId) : undefined}
        onSubmit={() => setShowDealModal(false)}
      />
    </div>
  );
};
