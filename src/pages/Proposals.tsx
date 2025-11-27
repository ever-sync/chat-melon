import { MainLayout } from "@/components/MainLayout";
import { ProposalList } from "@/components/proposals/ProposalList";
import { ProposalBuilder } from "@/components/proposals/ProposalBuilder";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useDeals } from "@/hooks/useDeals";

export default function Proposals() {
  const [showDealSelector, setShowDealSelector] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string>("");
  const { deals } = useDeals();

  const openDeals = deals.filter(d => d.status === 'open');

  const handleDealSelected = () => {
    if (!selectedDealId) return;
    setShowDealSelector(false);
    setShowBuilder(true);
  };

  const selectedDeal = deals.find(d => d.id === selectedDealId);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Propostas Comerciais</h1>
            <p className="text-muted-foreground">
              Gerencie suas propostas e acompanhe aprovações
            </p>
          </div>
          <Button onClick={() => setShowDealSelector(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Proposta
          </Button>
        </div>

        <ProposalList />
      </div>

      <Dialog open={showDealSelector} onOpenChange={setShowDealSelector}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar Negócio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Negócio</Label>
              <Select value={selectedDealId} onValueChange={setSelectedDealId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um negócio..." />
                </SelectTrigger>
                <SelectContent>
                  {openDeals.map((deal) => (
                    <SelectItem key={deal.id} value={deal.id}>
                      {deal.title} - {deal.contacts.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleDealSelected} 
              disabled={!selectedDealId}
              className="w-full"
            >
              Criar Proposta
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showBuilder && selectedDeal && (
        <ProposalBuilder
          open={showBuilder}
          onOpenChange={setShowBuilder}
          dealId={selectedDeal.id}
          dealTitle={selectedDeal.title}
        />
      )}
    </MainLayout>
  );
}
