import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCompanyQuery } from "@/hooks/useCompanyQuery";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, ShoppingCart, Headphones, Users, Handshake } from "lucide-react";

interface PipelineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipeline?: any;
}

const PIPELINE_TEMPLATES = [
  {
    id: "b2b",
    name: "Vendas B2B",
    description: "Pipeline para vendas corporativas complexas",
    icon: Briefcase,
    stages: [
      { name: "Prospecção", color: "#6B7280", order_index: 0, probability_default: 10 },
      { name: "Qualificação", color: "#3B82F6", order_index: 1, probability_default: 25 },
      { name: "Apresentação", color: "#8B5CF6", order_index: 2, probability_default: 40 },
      { name: "Proposta", color: "#F59E0B", order_index: 3, probability_default: 60 },
      { name: "Negociação", color: "#EF4444", order_index: 4, probability_default: 80 },
      { name: "Fechado Ganho", color: "#10B981", order_index: 5, probability_default: 100, is_closed_won: true },
      { name: "Fechado Perdido", color: "#EF4444", order_index: 6, probability_default: 0, is_closed_lost: true },
    ],
  },
  {
    id: "b2c",
    name: "Vendas B2C",
    description: "Pipeline para vendas diretas ao consumidor",
    icon: ShoppingCart,
    stages: [
      { name: "Novo Lead", color: "#6B7280", order_index: 0, probability_default: 20 },
      { name: "Contato Feito", color: "#3B82F6", order_index: 1, probability_default: 40 },
      { name: "Interessado", color: "#8B5CF6", order_index: 2, probability_default: 60 },
      { name: "Negociando", color: "#F59E0B", order_index: 3, probability_default: 80 },
      { name: "Fechado Ganho", color: "#10B981", order_index: 4, probability_default: 100, is_closed_won: true },
      { name: "Fechado Perdido", color: "#EF4444", order_index: 5, probability_default: 0, is_closed_lost: true },
    ],
  },
  {
    id: "customer_success",
    name: "Sucesso do Cliente",
    description: "Pipeline para pós-venda e retenção",
    icon: Headphones,
    stages: [
      { name: "Onboarding", color: "#3B82F6", order_index: 0, probability_default: 30 },
      { name: "Ativo", color: "#10B981", order_index: 1, probability_default: 80 },
      { name: "Em Risco", color: "#F59E0B", order_index: 2, probability_default: 50 },
      { name: "Renovação", color: "#8B5CF6", order_index: 3, probability_default: 70 },
      { name: "Renovado", color: "#10B981", order_index: 4, probability_default: 100, is_closed_won: true },
      { name: "Churn", color: "#EF4444", order_index: 5, probability_default: 0, is_closed_lost: true },
    ],
  },
  {
    id: "recruitment",
    name: "Recrutamento",
    description: "Pipeline para processo seletivo",
    icon: Users,
    stages: [
      { name: "Triagem", color: "#6B7280", order_index: 0, probability_default: 20 },
      { name: "Entrevista RH", color: "#3B82F6", order_index: 1, probability_default: 40 },
      { name: "Entrevista Técnica", color: "#8B5CF6", order_index: 2, probability_default: 60 },
      { name: "Entrevista Final", color: "#F59E0B", order_index: 3, probability_default: 80 },
      { name: "Proposta", color: "#10B981", order_index: 4, probability_default: 90 },
      { name: "Contratado", color: "#10B981", order_index: 5, probability_default: 100, is_closed_won: true },
      { name: "Rejeitado", color: "#EF4444", order_index: 6, probability_default: 0, is_closed_lost: true },
    ],
  },
  {
    id: "partnerships",
    name: "Parcerias",
    description: "Pipeline para desenvolvimento de parcerias",
    icon: Handshake,
    stages: [
      { name: "Identificação", color: "#6B7280", order_index: 0, probability_default: 10 },
      { name: "Primeiro Contato", color: "#3B82F6", order_index: 1, probability_default: 30 },
      { name: "Análise de Fit", color: "#8B5CF6", order_index: 2, probability_default: 50 },
      { name: "Negociação", color: "#F59E0B", order_index: 3, probability_default: 70 },
      { name: "Contrato", color: "#10B981", order_index: 4, probability_default: 90 },
      { name: "Parceria Ativa", color: "#10B981", order_index: 5, probability_default: 100, is_closed_won: true },
      { name: "Não Avançou", color: "#EF4444", order_index: 6, probability_default: 0, is_closed_lost: true },
    ],
  },
];

export function PipelineModal({ open, onOpenChange, pipeline }: PipelineModalProps) {
  const { companyId } = useCompanyQuery();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    if (pipeline) {
      setFormData({
        name: pipeline.name || "",
        description: pipeline.description || "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
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
          .from("pipelines")
          .update({
            name: formData.name,
            description: formData.description,
          })
          .eq("id", pipeline.id);

        if (error) throw error;
        toast.success("Pipeline atualizado com sucesso!");
      } else {
        // Create new pipeline
        const { data: newPipeline, error: pipelineError } = await supabase
          .from("pipelines")
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

          const { error: stagesError } = await supabase
            .from("pipeline_stages")
            .insert(stages);

          if (stagesError) throw stagesError;
        }

        toast.success("Pipeline criado com sucesso!");
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error saving pipeline:", error);
      toast.error("Erro ao salvar pipeline");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {pipeline ? "Editar Pipeline" : "Novo Pipeline"}
          </DialogTitle>
          <DialogDescription>
            {pipeline
              ? "Atualize as informações do pipeline"
              : "Crie um novo pipeline ou use um template"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!pipeline && (
            <Tabs defaultValue="custom" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="custom">Personalizado</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
              </TabsList>

              <TabsContent value="custom" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Pipeline *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Pipeline de Vendas"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição do pipeline"
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="templates" className="mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {PIPELINE_TEMPLATES.map((template) => {
                    const Icon = template.icon;
                    return (
                      <Card
                        key={template.id}
                        className={`cursor-pointer transition-all ${
                          selectedTemplate === template.id
                            ? "ring-2 ring-primary"
                            : "hover:border-primary"
                        }`}
                        onClick={() => {
                          setSelectedTemplate(template.id);
                          setFormData({
                            name: template.name,
                            description: template.description,
                          });
                        }}
                      >
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{template.name}</CardTitle>
                              <CardDescription className="text-xs">
                                {template.stages.length} etapas
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {template.description}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          )}

          {pipeline && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Pipeline *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Pipeline de Vendas"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do pipeline"
                  rows={3}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : pipeline ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
