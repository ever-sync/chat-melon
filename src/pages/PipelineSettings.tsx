import { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Settings2, Trash2, Edit, ArrowLeft, Star } from 'lucide-react';
import { usePipelines } from '@/hooks/crm/usePipelines';
import { PipelineModal } from '@/components/settings/PipelineModal';
import { StagesManager } from '@/components/settings/StagesManager';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCompanyQuery } from '@/hooks/crm/useCompanyQuery';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

export default function PipelineSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  const handleSetDefault = async (pipelineId: string) => {
    try {
      // 1. Unset all defaults for this company
      await supabase
        .from('pipelines')
        .update({ is_default: false })
        .eq('company_id', companyId);

      // 2. Set this one as default
      const { error } = await supabase
        .from('pipelines')
        .update({ is_default: true })
        .eq('id', pipelineId);

      if (error) throw error;

      toast.success('Pipeline definido como padrão!');
      queryClient.invalidateQueries({ queryKey: ['pipeline-with-stages'] });
    } catch (error) {
      console.error('Error setting default pipeline:', error);
      toast.error('Erro ao definir pipeline padrão');
    }
  };

  const handleDeletePipeline = async () => {
    if (!deletingPipelineId) return;

    try {
      const pipelineToDelete = pipelines.find(p => p.id === deletingPipelineId);

      // 1. Identificar o pipeline padrão (para onde mover os negócios)
      // Se estivermos excluindo o padrão atual, precisamos de outro
      let defaultPipeline = pipelines.find(p => p.is_default && p.id !== deletingPipelineId);

      if (!defaultPipeline) {
        defaultPipeline = pipelines.find(p => p.id !== deletingPipelineId);
      }

      if (!defaultPipeline) {
        toast.error('Não é possível excluir o único pipeline do sistema');
        return;
      }

      // Se o excluído era o padrão, tornar o novo destino como padrão
      if (pipelineToDelete?.is_default) {
        await supabase
          .from('pipelines')
          .update({ is_default: true })
          .eq('id', defaultPipeline.id);
      }

      // 2. Obter a primeira etapa do pipeline padrão
      const targetStageId = defaultPipeline.pipeline_stages?.[0]?.id;

      if (!targetStageId) {
        toast.error('O pipeline de destino não possui etapas configuradas');
        return;
      }

      // 3. Obter as etapas do pipeline que será excluído
      const stagesToDeleteIds = pipelineToDelete?.pipeline_stages?.map((s: any) => s.id) || [];

      // 4. Mover negócios (deals) para o pipeline padrão
      if (stagesToDeleteIds.length > 0) {
        const { error: updateError } = await supabase
          .from('deals')
          .update({
            pipeline_id: defaultPipeline.id,
            stage_id: targetStageId
          })
          .in('stage_id', stagesToDeleteIds);

        if (updateError) {
          console.error('Erro ao mover negócios:', updateError);
        }
      }

      // 5. Excluir o pipeline
      const { error: deleteError } = await supabase
        .from('pipelines')
        .delete()
        .eq('id', deletingPipelineId);

      if (deleteError) throw deleteError;

      toast.success('Pipeline excluído e negócios movidos com sucesso!');

      queryClient.invalidateQueries({ queryKey: ['pipeline-with-stages'] });

      setDeleteDialogOpen(false);
      setDeletingPipelineId(null);
    } catch (error) {
      console.error('Error deleting pipeline:', error);
      toast.error('Erro ao excluir pipeline. Verifique se existem dependências.');
    }
  };

  const confirmDelete = (pipelineId: string) => {
    setDeletingPipelineId(pipelineId);
    setDeleteDialogOpen(true);
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8 p-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100">
          <div className="space-y-1">
            <Button
              variant="ghost"
              onClick={() => navigate('/crm')}
              className="group mb-2 -ml-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-all"
            >
              <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
              Voltar para o CRM
            </Button>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900">
              Pipelines de Vendas
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl font-medium">
              Organize seus processos comerciais, defina etapas claras e acompanhe o progresso dos seus negócios.
            </p>
          </div>

          <Button
            onClick={handleCreatePipeline}
            className="rounded-2xl h-12 px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl shadow-indigo-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] font-semibold text-base"
          >
            <Plus className="h-5 w-5 mr-2" />
            Novo Pipeline
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse border-none shadow-sm rounded-3xl h-[220px] bg-gray-50">
                <CardHeader className="p-6">
                  <div className="h-7 bg-gray-200 rounded-lg w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded-lg w-full mt-3"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pipelines.map((pipeline) => (
              <Card
                key={pipeline.id}
                className="group relative border-none shadow-sm hover:shadow-2xl transition-all duration-500 rounded-3xl overflow-hidden bg-white/70 backdrop-blur-xl border border-white/20 hover:-translate-y-2 ring-1 ring-gray-100/50"
              >
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl transition-all duration-500 group-hover:bg-indigo-500/10" />

                <CardHeader className="p-6">
                  <div className="flex items-start justify-between relative z-10">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-xl font-bold text-gray-900">{pipeline.name}</CardTitle>
                        {pipeline.is_default && (
                          <Badge className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 border-none px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                            Padrão
                          </Badge>
                        )}
                      </div>
                      {pipeline.description && (
                        <CardDescription className="text-sm font-medium text-gray-500 line-clamp-2 min-h-[40px]">
                          {pipeline.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 pt-0 relative z-10">
                  <div className="flex flex-col gap-4">
                    <div className="w-full bg-gray-50 rounded-2xl p-4 flex items-center justify-between border border-gray-100 group-hover:bg-white transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-sm font-semibold text-gray-600">Fluxo operacional</span>
                      </div>
                      <span className="text-xs font-bold text-indigo-500">Dinamizado</span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => handleManageStages(pipeline.id)}
                        className="flex-1 rounded-2xl h-11 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 font-bold transition-all border border-indigo-100/50"
                      >
                        <Settings2 className="h-4 w-4 mr-2" />
                        Etapas
                      </Button>

                      {!pipeline.is_default && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSetDefault(pipeline.id)}
                          className="rounded-2xl h-11 w-11 bg-amber-50 text-amber-500 hover:bg-amber-500 hover:text-white transition-all border border-amber-100"
                          title="Definir como Padrão"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditPipeline(pipeline)}
                        className="rounded-2xl h-11 w-11 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all border border-gray-100"
                        title="Editar Pipeline"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      {pipelines.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmDelete(pipeline.id)}
                          className="rounded-2xl h-11 w-11 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 border border-red-100"
                          title="Excluir Pipeline"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Empty State / Add Card */}
            <button
              onClick={handleCreatePipeline}
              className="group border-2 border-dashed border-gray-200 hover:border-indigo-400 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:bg-indigo-50/30 h-[220px]"
            >
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-indigo-500 group-hover:scale-110 transition-all duration-300 shadow-sm group-hover:shadow-indigo-200">
                <Plus className="h-6 w-6 text-gray-400 group-hover:text-white transition-colors" />
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900">Novo Pipeline</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">Crie uma nova jornada de vendas</p>
              </div>
            </button>
          </div>
        )}

        <PipelineModal open={modalOpen} onOpenChange={setModalOpen} pipeline={editingPipeline} />

        <StagesManager
          open={stagesManagerOpen}
          onOpenChange={setStagesManagerOpen}
          pipelineId={selectedPipelineId}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
            <AlertDialogHeader>
              <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="h-8 w-8 text-red-500" />
              </div>
              <AlertDialogTitle className="text-2xl font-bold text-center">Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription className="text-center text-gray-500 text-base">
                Tem certeza que deseja excluir o pipeline <span className="font-bold text-gray-900">"{pipelines.find(p => p.id === deletingPipelineId)?.name}"</span>?
                <br /><br />
                Esta ação <span className="text-red-600 font-semibold underline">não pode ser desfeita</span> e
                todos os negócios associados serão movidos para o pipeline padrão.
                {pipelines.find(p => p.id === deletingPipelineId)?.is_default && (
                  <div className="mt-4 p-3 bg-amber-50 text-amber-700 rounded-2xl text-sm border border-amber-100">
                    <strong>Nota:</strong> Este é o pipeline padrão. Se você o excluir, outro pipeline será automaticamente definido como padrão.
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-center gap-3 mt-6">
              <AlertDialogCancel className="rounded-2xl h-12 px-6 font-semibold border-gray-100 hover:bg-gray-50">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeletePipeline}
                className="rounded-2xl h-12 px-8 bg-red-500 hover:bg-red-600 font-semibold shadow-lg shadow-red-200 transition-all hover:scale-105 active:scale-95"
              >
                Sim, Excluir Pipeline
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
