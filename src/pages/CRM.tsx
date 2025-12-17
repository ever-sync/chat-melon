import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { PipelineBoard } from "@/components/crm/PipelineBoard";
import { usePipelines } from "@/hooks/crm/usePipelines";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Settings2 } from "lucide-react";
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
      <div className="space-y-8 h-full flex flex-col p-6">
        {/* Premium Header */}
        <div className="flex items-start justify-between flex-shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-sm">
                <TrendingUp className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Pipeline de Vendas
                </h1>
                <p className="text-gray-500 mt-1 text-base">
                  Visualize e gerencie suas oportunidades de negócio
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Select
              value={selectedPipelineId}
              onValueChange={setSelectedPipelineId}
            >
              <SelectTrigger className="w-[280px] h-11 rounded-xl border-gray-200 shadow-sm hover:border-gray-300 transition-colors">
                <SelectValue placeholder="Selecione um pipeline" />
              </SelectTrigger>
              <SelectContent>
                {pipelines.map((pipeline) => (
                  <SelectItem key={pipeline.id} value={pipeline.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      {pipeline.name}
                      {pipeline.is_default && (
                        <span className="text-xs text-gray-500 ml-1">(Padrão)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="h-11 rounded-xl border-gray-200 hover:bg-gray-50 transition-all duration-200 hover:scale-105"
              onClick={() => navigate("/settings/pipelines")}
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Gerenciar
            </Button>
          </div>
        </div>

        {/* Pipeline Board */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden -mx-6 px-6">
          <PipelineBoard selectedPipelineId={selectedPipelineId} />
        </div>
      </div>
    </MainLayout>
  );
}
