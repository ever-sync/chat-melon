import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { PipelineBoard } from "@/components/crm/PipelineBoard";
import { usePipelines } from "@/hooks/usePipelines";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CRM() {
  const { pipelines, defaultPipeline } = usePipelines();
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | undefined>(defaultPipeline?.id);
  const navigate = useNavigate();

  // Sincronizar selectedPipelineId com defaultPipeline quando carregar
  useEffect(() => {
    if (defaultPipeline?.id && !selectedPipelineId) {
      setSelectedPipelineId(defaultPipeline.id);
    }
  }, [defaultPipeline?.id, selectedPipelineId]);

  return (
    <MainLayout>
      <div className="space-y-6 h-full flex flex-col">
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">CRM</h1>
            <p className="text-muted-foreground">
              Gestão de relacionamento com clientes e pipeline de vendas
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select
              value={selectedPipelineId}
              onValueChange={setSelectedPipelineId}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Selecione um pipeline" />
              </SelectTrigger>
              <SelectContent>
                {pipelines.map((pipeline) => (
                  <SelectItem key={pipeline.id} value={pipeline.id}>
                    {pipeline.name}
                    {pipeline.is_default && " (Padrão)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/settings/pipelines")}
              title="Gerenciar pipelines"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <PipelineBoard selectedPipelineId={selectedPipelineId} />
        </div>
      </div>
    </MainLayout>
  );
}
