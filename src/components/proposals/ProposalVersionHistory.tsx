import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Proposal } from "@/hooks/useProposals";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Eye, GitCompare } from "lucide-react";

interface ProposalVersionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions: Proposal[];
  currentVersionId: string;
  onViewVersion: (versionId: string) => void;
  onCompareVersions: (versionId1: string, versionId2: string) => void;
}

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

export const ProposalVersionHistory = ({
  open,
  onOpenChange,
  versions,
  currentVersionId,
  onViewVersion,
  onCompareVersions,
}: ProposalVersionHistoryProps) => {
  const [selectedForComparison, setSelectedForComparison] = useState<string | null>(null);

  const sortedVersions = [...versions].sort((a, b) => b.version - a.version);

  const handleCompareClick = (versionId: string) => {
    if (selectedForComparison) {
      onCompareVersions(selectedForComparison, versionId);
      setSelectedForComparison(null);
    } else {
      setSelectedForComparison(versionId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Histórico de Versões</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {sortedVersions.map((version, index) => {
              const isCurrent = version.id === currentVersionId;
              const isSelectedForComparison = version.id === selectedForComparison;
              const isPrevious = index === sortedVersions.length - 1;

              return (
                <div
                  key={version.id}
                  className={`border rounded-lg p-4 ${
                    isCurrent ? "border-primary bg-primary/5" : "border-border"
                  } ${isSelectedForComparison ? "ring-2 ring-primary" : ""}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Versão {version.version}</span>
                          {isCurrent && (
                            <Badge variant="default" className="text-xs">
                              Atual
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(version.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>

                    <Badge
                      className={`${
                        statusColors[version.status as keyof typeof statusColors]
                      } text-white`}
                    >
                      {statusLabels[version.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>

                  {version.change_notes && (
                    <p className="text-sm text-muted-foreground mb-3 italic">
                      "{version.change_notes}"
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <span>
                      Total:{" "}
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(version.total)}
                    </span>
                    <span>•</span>
                    <span>{version.items.length} itens</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewVersion(version.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                    {!isPrevious && (
                      <Button
                        variant={isSelectedForComparison ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleCompareClick(version.id)}
                      >
                        <GitCompare className="h-4 w-4 mr-2" />
                        {isSelectedForComparison
                          ? "Selecionado"
                          : selectedForComparison
                          ? "Comparar"
                          : "Comparar com anterior"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
