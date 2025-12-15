import { useState } from "react";
import { useProposals, Proposal } from "@/hooks/chat/useProposals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Link as LinkIcon, Eye, History, GitCompare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { ProposalVersionHistory } from "./ProposalVersionHistory";
import { ProposalComparison } from "./ProposalComparison";
import { useQuery } from "@tanstack/react-query";

const statusColors = {
  draft: "bg-gray-500",
  sent: "bg-blue-500",
  viewed: "bg-yellow-500",
  accepted: "bg-green-500",
  rejected: "bg-red-500",
  expired: "bg-gray-400",
};

const statusLabels = {
  draft: "Rascunho",
  sent: "Enviada",
  viewed: "Visualizada",
  accepted: "Aceita",
  rejected: "Rejeitada",
  expired: "Expirada",
};

export const ProposalList = () => {
  const { proposals, isLoading, generatePublicLink, getVersionHistory } = useProposals();
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [comparisonVersions, setComparisonVersions] = useState<{
    version1: Proposal;
    version2: Proposal;
  } | null>(null);

  // Get versions for selected proposal
  const { data: versions = [] } = useQuery({
    queryKey: ["proposal-versions", selectedProposal],
    queryFn: () => {
      if (!selectedProposal) return [];
      const proposal = proposals.find(p => p.id === selectedProposal);
      if (!proposal) return [];
      return getVersionHistory(proposal.deal_id);
    },
    enabled: !!selectedProposal,
  });

  const copyPublicLink = async (proposal: Proposal) => {
    if (!proposal.public_link) {
      const updated = await generatePublicLink(proposal.id);
      const publicUrl = `${window.location.origin}/p/${updated.public_link}`;
      navigator.clipboard.writeText(publicUrl);
      toast.success("Link gerado e copiado!");
    } else {
      const publicUrl = `${window.location.origin}/p/${proposal.public_link}`;
      navigator.clipboard.writeText(publicUrl);
      toast.success("Link copiado!");
    }
  };

  const handleViewVersionHistory = (proposalId: string) => {
    setSelectedProposal(proposalId);
    setShowVersionHistory(true);
  };

  const handleViewVersion = (versionId: string) => {
    // In a real implementation, would navigate to proposal detail
    toast.info("Visualização de versão específica será implementada");
  };

  const handleCompareVersions = async (versionId1: string, versionId2: string) => {
    const v1 = versions.find(v => v.id === versionId1);
    const v2 = versions.find(v => v.id === versionId2);
    
    if (v1 && v2) {
      setComparisonVersions({ version1: v1, version2: v2 });
      setShowVersionHistory(false);
    }
  };

  // Group proposals by deal and get latest version
  const groupedProposals = proposals.reduce((acc, proposal) => {
    const key = proposal.deal_id;
    if (!acc[key] || proposal.version > acc[key].version) {
      acc[key] = proposal;
    }
    return acc;
  }, {} as Record<string, Proposal>);

  const latestProposals = Object.values(groupedProposals);

  // Get version count for each proposal
  const getVersionCount = (dealId: string) => {
    return proposals.filter(p => p.deal_id === dealId).length;
  };

  if (isLoading) {
    return <div>Carregando propostas...</div>;
  }

  if (latestProposals.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma proposta criada</h3>
          <p className="text-muted-foreground">
            Crie propostas comerciais a partir dos negócios no pipeline
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {latestProposals.map((proposal) => {
          const versionCount = getVersionCount(proposal.deal_id);
          
          return (
            <Card key={proposal.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div>
                      <CardTitle className="text-lg">{proposal.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {proposal.deals?.title} • {proposal.deals?.contacts.name}
                      </p>
                    </div>
                    {versionCount > 1 && (
                      <Badge variant="outline" className="ml-2">
                        v{proposal.version}
                      </Badge>
                    )}
                  </div>
                  <Badge className={statusColors[proposal.status]}>
                    {statusLabels[proposal.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-2xl font-bold">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(proposal.total)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Criada {formatDistanceToNow(new Date(proposal.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </div>
                    {proposal.viewed_at && (
                      <div className="text-sm text-muted-foreground">
                        <Eye className="inline h-3 w-3 mr-1" />
                        Visualizada {formatDistanceToNow(new Date(proposal.viewed_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {versionCount > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewVersionHistory(proposal.id)}
                      >
                        <History className="h-4 w-4 mr-2" />
                        Histórico ({versionCount})
                      </Button>
                    )}
                    {(proposal.status === "draft" || proposal.status === "sent") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyPublicLink(proposal)}
                      >
                        <LinkIcon className="h-4 w-4 mr-2" />
                        {proposal.public_link ? "Copiar Link" : "Gerar Link"}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-4 text-sm text-muted-foreground">
                  {proposal.items.length} {proposal.items.length === 1 ? "item" : "itens"} • 
                  Validade: {proposal.validity_days} dias
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ProposalVersionHistory
        open={showVersionHistory}
        onOpenChange={setShowVersionHistory}
        versions={versions}
        currentVersionId={selectedProposal || ""}
        onViewVersion={handleViewVersion}
        onCompareVersions={handleCompareVersions}
      />

      {comparisonVersions && (
        <ProposalComparison
          open={!!comparisonVersions}
          onOpenChange={(open) => !open && setComparisonVersions(null)}
          version1={comparisonVersions.version1}
          version2={comparisonVersions.version2}
        />
      )}
    </>
  );
};
