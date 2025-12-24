import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCompanyQuery } from '@/hooks/crm/useCompanyQuery';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, ShoppingCart, Headphones, Users, Handshake } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PipelineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipeline?: any;
}

const PIPELINE_TEMPLATES = [
  {
    id: 'b2b',
    name: 'Vendas B2B',
    description: 'Pipeline para vendas corporativas complexas',
    icon: Briefcase,
    stages: [
      { name: 'Prospecção', color: '#6B7280', order_index: 0, probability_default: 10 },
      { name: 'Qualificação', color: '#3B82F6', order_index: 1, probability_default: 25 },
      { name: 'Apresentação', color: '#8B5CF6', order_index: 2, probability_default: 40 },
      { name: 'Proposta', color: '#F59E0B', order_index: 3, probability_default: 60 },
      { name: 'Negociação', color: '#EF4444', order_index: 4, probability_default: 80 },
      {
        name: 'Fechado Ganho',
        color: '#10B981',
        order_index: 5,
        probability_default: 100,
        is_closed_won: true,
      },
      {
        name: 'Fechado Perdido',
        color: '#EF4444',
        order_index: 6,
        probability_default: 0,
        is_closed_lost: true,
      },
    ],
  },
  {
    id: 'b2c',
    name: 'Vendas B2C',
    description: 'Pipeline para vendas diretas ao consumidor',
    icon: ShoppingCart,
    stages: [
      { name: 'Novo Lead', color: '#6B7280', order_index: 0, probability_default: 20 },
      { name: 'Contato Feito', color: '#3B82F6', order_index: 1, probability_default: 40 },
      { name: 'Interessado', color: '#8B5CF6', order_index: 2, probability_default: 60 },
      { name: 'Negociando', color: '#F59E0B', order_index: 3, probability_default: 80 },
      {
        name: 'Fechado Ganho',
        color: '#10B981',
        order_index: 4,
        probability_default: 100,
        is_closed_won: true,
      },
      {
        name: 'Fechado Perdido',
        color: '#EF4444',
        order_index: 5,
        probability_default: 0,
        is_closed_lost: true,
      },
    ],
  },
  {
    id: 'customer_success',
    name: 'Sucesso do Cliente',
    description: 'Pipeline para pós-venda e retenção',
    icon: Headphones,
    stages: [
      { name: 'Onboarding', color: '#3B82F6', order_index: 0, probability_default: 30 },
      { name: 'Ativo', color: '#10B981', order_index: 1, probability_default: 80 },
      { name: 'Em Risco', color: '#F59E0B', order_index: 2, probability_default: 50 },
      { name: 'Renovação', color: '#8B5CF6', order_index: 3, probability_default: 70 },
      {
        name: 'Renovado',
        color: '#10B981',
        order_index: 4,
        probability_default: 100,
        is_closed_won: true,
      },
      {
        name: 'Churn',
        color: '#EF4444',
        order_index: 5,
        probability_default: 0,
        is_closed_lost: true,
      },
    ],
  },
  {
    id: 'recruitment',
    name: 'Recrutamento',
    description: 'Pipeline para processo seletivo',
    icon: Users,
    stages: [
      { name: 'Triagem', color: '#6B7280', order_index: 0, probability_default: 20 },
      { name: 'Entrevista RH', color: '#3B82F6', order_index: 1, probability_default: 40 },
      { name: 'Entrevista Técnica', color: '#8B5CF6', order_index: 2, probability_default: 60 },
      { name: 'Entrevista Final', color: '#F59E0B', order_index: 3, probability_default: 80 },
      { name: 'Proposta', color: '#10B981', order_index: 4, probability_default: 90 },
      {
        name: 'Contratado',
        color: '#10B981',
        order_index: 5,
        probability_default: 100,
        is_closed_won: true,
      },
      {
        name: 'Rejeitado',
        color: '#EF4444',
        order_index: 6,
        probability_default: 0,
        is_closed_lost: true,
      },
    ],
  },
  {
    id: 'partnerships',
    name: 'Parcerias',
    description: 'Pipeline para desenvolvimento de parcerias',
    icon: Handshake,
    stages: [
      { name: 'Identificação', color: '#6B7280', order_index: 0, probability_default: 10 },
      { name: 'Primeiro Contato', color: '#3B82F6', order_index: 1, probability_default: 30 },
      { name: 'Análise de Fit', color: '#8B5CF6', order_index: 2, probability_default: 50 },
      { name: 'Negociação', color: '#F59E0B', order_index: 3, probability_default: 70 },
      { name: 'Contrato', color: '#10B981', order_index: 4, probability_default: 90 },
      {
        name: 'Parceria Ativa',
        color: '#10B981',
        order_index: 5,
        probability_default: 100,
        is_closed_won: true,
      },
      {
        name: 'Não Avançou',
        color: '#EF4444',
        order_index: 6,
        probability_default: 0,
        is_closed_lost: true,
      },
    ],
  },
];

export function PipelineModal({ open, onOpenChange, pipeline }: PipelineModalProps) {
  const { companyId } = useCompanyQuery();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    if (pipeline) {
      setFormData({
        name: pipeline.name || '',
        description: pipeline.description || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
      });
      setSelectedTemplate(null);
    }
  }, [pipeline, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    setLoading(true);

    try {
      if (pipeline) {
        // Update existing pipeline
        const { error } = await supabase
          .from('pipelines')
          .update({
            name: formData.name,
            description: formData.description,
          })
          .eq('id', pipeline.id);

        if (error) throw error;
        toast.success('Pipeline atualizado com sucesso!');
      } else {
        // Create new pipeline
        const { data: newPipeline, error: pipelineError } = await supabase
          .from('pipelines')
          .insert({
            company_id: companyId,
            name: formData.name,
            description: formData.description,
            is_default: false,
            order_index: 999,
          })
          .select()
          .single();

        if (pipelineError) throw pipelineError;

        // Create stages from template
        const template = PIPELINE_TEMPLATES.find((t) => t.id === selectedTemplate);
        if (template && newPipeline) {
          const stages = template.stages.map((stage) => ({
            pipeline_id: newPipeline.id,
            ...stage,
          }));

          const { error: stagesError } = await supabase.from('pipeline_stages').insert(stages);

          if (stagesError) throw stagesError;
        }

        toast.success('Pipeline criado com sucesso!');
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving pipeline:', error);
      toast.error('Erro ao salvar pipeline');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-8 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Briefcase className="w-32 h-32" />
          </div>
          <DialogTitle className="text-3xl font-bold mb-2">
            {pipeline ? 'Editar Pipeline' : 'Novo Pipeline'}
          </DialogTitle>
          <DialogDescription className="text-indigo-100 text-lg">
            {pipeline
              ? 'Atualize as informações do seu fluxo de vendas'
              : 'Comece com um de nossos templates profissionais ou crie do zero'}
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 bg-gray-50/50">
          {!pipeline && (
            <Tabs defaultValue="templates" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-2xl h-14">
                <TabsTrigger value="templates" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-base transition-all">
                  Usar Template
                </TabsTrigger>
                <TabsTrigger value="custom" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-base transition-all">
                  Personalizado
                </TabsTrigger>
              </TabsList>

              <TabsContent value="templates" className="mt-8">
                <div className="grid gap-6 md:grid-cols-2">
                  {PIPELINE_TEMPLATES.map((template) => {
                    const Icon = template.icon;
                    const isActive = selectedTemplate === template.id;
                    return (
                      <Card
                        key={template.id}
                        className={cn(
                          "cursor-pointer transition-all duration-300 rounded-3xl border-2 hover:shadow-xl group relative overflow-hidden",
                          isActive
                            ? "border-indigo-500 bg-indigo-50/50 shadow-lg shadow-indigo-100 ring-1 ring-indigo-500"
                            : "border-gray-100 hover:border-indigo-200"
                        )}
                        onClick={() => {
                          setSelectedTemplate(template.id);
                          setFormData({
                            name: template.name,
                            description: template.description,
                          });
                        }}
                      >
                        <CardHeader className="p-5">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm",
                              isActive ? "bg-indigo-500 text-white scale-110" : "bg-gray-100 text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-500"
                            )}>
                              <Icon className="h-6 w-6" />
                            </div>
                            <div>
                              <CardTitle className="text-lg font-bold">{template.name}</CardTitle>
                              <CardDescription className="text-xs font-bold uppercase tracking-widest text-indigo-500/70">
                                {template.stages.length} Etapas Estruturadas
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-5 pt-0">
                          <p className="text-sm text-gray-500 font-medium leading-relaxed">{template.description}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="custom" className="space-y-6 mt-8">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-bold text-gray-700 ml-1">Nome do Pipeline</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Vendas Complexas High Ticket"
                      className="rounded-2xl h-12 border-gray-200 focus:ring-indigo-500 text-base"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-bold text-gray-700 ml-1">Descrição Estratégica</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Como este pipeline ajudará seu time?"
                      className="rounded-2xl border-gray-200 focus:ring-indigo-500 text-base min-h-[120px]"
                      rows={3}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {pipeline && (
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-bold text-gray-700 ml-1">Nome do Pipeline</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Pipeline de Vendas"
                  className="rounded-2xl h-12 border-gray-200 focus:ring-indigo-500 text-base"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-bold text-gray-700 ml-1">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do pipeline"
                  className="rounded-2xl border-gray-200 focus:ring-indigo-500 text-base min-h-[120px]"
                  rows={3}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-2xl h-12 px-6 font-bold text-gray-500 hover:bg-gray-100"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || (!pipeline && !formData.name)}
              className="rounded-2xl h-12 px-10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl shadow-indigo-500/20 font-bold text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? 'Processando...' : pipeline ? 'Salvar Alterações' : 'Criar Pipeline'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
