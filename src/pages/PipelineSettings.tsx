import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Settings2, Trash2, Edit } from "lucide-react";
import { usePipelines } from "@/hooks/crm/usePipelines";
import { PipelineModal } from "@/components/settings/PipelineModal";
import { StagesManager } from "@/components/settings/StagesManager";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCompanyQuery } from "@/hooks/crm/useCompanyQuery";

export default function PipelineSettings() {
  const { pipelines, isLoading } = usePipelines();
  const { companyId } = useCompanyQuery();
  const [modalOpen, setModalOpen] = useState(false);
  const [stagesManagerOpen, setStagesManagerOpen] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState<any>(null);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPipelineId, setDeletingPipelineId] = useState<string | null>(null);

  const handleCreatePipeline = () => {
    setEditingPipeline(null);
    setModalOpen(true);
  };

  const handleEditPipeline = (pipeline: any) => {
    setEditingPipeline(pipeline);
    setModalOpen(true);
  };

  const handleManageStages = (pipelineId: string) => {
    setSelectedPipelineId(pipelineId);
    setStagesManagerOpen(true);
  };

  const handleDeletePipeline = async () => {
    if (!deletingPipelineId) return;

    try {
      const { error } = await supabase
        .from("pipelines")
        .delete()
        .eq("id", deletingPipelineId);

      if (error) throw error;

      toast.success("Pipeline excluído com sucesso!");
      setDeleteDialogOpen(false);
      setDeletingPipelineId(null);
    } catch (error) {
      console.error("Error deleting pipeline:", error);
      toast.error("Erro ao excluir pipeline");
    }
  };

  const confirmDelete = (pipelineId: string) => {
    setDeletingPipelineId(pipelineId);
    setDeleteDialogOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pipelines</h1>
            <p className="text-muted-foreground">
              Gerencie seus pipelines de vendas e suas etapas
            </p>
          </div>
          <Button onClick={handleCreatePipeline}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Pipeline
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-full mt-2"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pipelines.map((pipeline) => (
              <Card key={pipeline.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{pipeline.name}</CardTitle>
                        {pipeline.is_default && (
                          <Badge variant="secondary">Padrão</Badge>
                        )}
                      </div>
                      {pipeline.description && (
                        <CardDescription className="mt-1">
                          {pipeline.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManageStages(pipeline.id)}
                      className="flex-1"
                    >
                      <Settings2 className="h-4 w-4 mr-2" />
                      Gerenciar Etapas
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPipeline(pipeline)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {!pipeline.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => confirmDelete(pipeline.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <PipelineModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          pipeline={editingPipeline}
        />

        <StagesManager
          open={stagesManagerOpen}
          onOpenChange={setStagesManagerOpen}
          pipelineId={selectedPipelineId}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este pipeline? Esta ação não pode ser desfeita e todos os negócios associados serão movidos para o pipeline padrão.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePipeline}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
