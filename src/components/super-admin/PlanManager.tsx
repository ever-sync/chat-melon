import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Edit, Trash2, DollarSign } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Plan {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  max_companies: number | null;
  max_users: number | null;
  max_conversations: number | null;
  trial_days: number;
  is_free_plan: boolean;
  is_active: boolean;
  features: Record<string, any>;
  created_at: string;
}

interface PlanFormData {
  slug: string;
  name: string;
  description: string;
  price_monthly: string;
  price_yearly: string;
  max_companies: string;
  max_users: string;
  max_conversations: string;
  trial_days: string;
  is_free_plan: boolean;
  is_active: boolean;
}

export function PlanManager() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>({
    slug: "",
    name: "",
    description: "",
    price_monthly: "",
    price_yearly: "",
    max_companies: "",
    max_users: "",
    max_conversations: "",
    trial_days: "3",
    is_free_plan: false,
    is_active: true,
  });

  const queryClient = useQueryClient();

  // Busca todos os planos
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("price_monthly");

      if (error) throw error;
      return data as Plan[];
    },
  });

  // Criar novo plano
  const createPlanMutation = useMutation({
    mutationFn: async (data: PlanFormData) => {
      const { error } = await supabase.from("subscription_plans").insert({
        slug: data.slug,
        name: data.name,
        price_monthly: parseFloat(data.price_monthly),
        price_yearly: parseFloat(data.price_yearly),
        max_companies: data.max_companies ? parseInt(data.max_companies) : null,
        max_users: data.max_users ? parseInt(data.max_users) : null,
        max_conversations: data.max_conversations ? parseInt(data.max_conversations) : null,
        features: {},
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      toast.success("Plano criado com sucesso!");
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar plano");
    },
  });

  // Atualizar plano
  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PlanFormData }) => {
      const { error } = await supabase
        .from("subscription_plans")
        .update({
          slug: data.slug,
          name: data.name,
          price_monthly: parseFloat(data.price_monthly),
          price_yearly: parseFloat(data.price_yearly),
          max_companies: data.max_companies ? parseInt(data.max_companies) : null,
          max_users: data.max_users ? parseInt(data.max_users) : null,
          max_conversations: data.max_conversations ? parseInt(data.max_conversations) : null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      toast.success("Plano atualizado com sucesso!");
      setEditingPlan(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar plano");
    },
  });

  // Deletar plano
  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("subscription_plans")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      toast.success("Plano deletado com sucesso!");
      setDeletingPlan(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao deletar plano");
    },
  });

  const resetForm = () => {
    setFormData({
      slug: "",
      name: "",
      price_monthly: "",
      price_yearly: "",
      max_companies: "",
      max_users: "",
      max_conversations: "",
    });
  };

  const handleOpenCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const handleOpenEditDialog = (plan: Plan) => {
    setFormData({
      slug: plan.slug,
      name: plan.name,
      price_monthly: plan.price_monthly.toString(),
      price_yearly: plan.price_yearly.toString(),
      max_companies: plan.max_companies?.toString() || "",
      max_users: plan.max_users?.toString() || "",
      max_conversations: plan.max_conversations?.toString() || "",
    });
    setEditingPlan(plan);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, data: formData });
    } else {
      createPlanMutation.mutate(formData);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando planos...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header com botão de criar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gerenciar Planos</h3>
          <p className="text-sm text-muted-foreground">
            Crie, edite ou remova planos de assinatura
          </p>
        </div>
        <Button onClick={handleOpenCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      {/* Lista de planos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className="p-6">
            <div className="space-y-4">
              {/* Header do card */}
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-lg">{plan.name}</h4>
                  <Badge variant="outline" className="mt-1">
                    {plan.slug}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEditDialog(plan)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingPlan(plan)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {/* Preços */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    <span className="font-semibold">{formatPrice(plan.price_monthly)}</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    <span className="font-semibold">{formatPrice(plan.price_yearly)}</span>
                    <span className="text-muted-foreground">/ano</span>
                  </div>
                </div>
              </div>

              {/* Limites */}
              <div className="pt-4 border-t space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Empresas:</span>
                  <span className="font-medium">
                    {plan.max_companies === null ? "Ilimitadas" : plan.max_companies}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Usuários:</span>
                  <span className="font-medium">
                    {plan.max_users === null ? "Ilimitados" : plan.max_users}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Conversas:</span>
                  <span className="font-medium">
                    {plan.max_conversations === null ? "Ilimitadas" : plan.max_conversations.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="mb-4">Nenhum plano cadastrado ainda</p>
          <Button onClick={handleOpenCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeiro Plano
          </Button>
        </div>
      )}

      {/* Dialog de Criar/Editar */}
      <Dialog
        open={isCreateDialogOpen || !!editingPlan}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingPlan(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? "Editar Plano" : "Criar Novo Plano"}
              </DialogTitle>
              <DialogDescription>
                Configure os detalhes e limites do plano de assinatura
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Nome e Slug */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Plano *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Professional"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (identificador) *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value.toLowerCase() })
                    }
                    placeholder="professional"
                    required
                    disabled={!!editingPlan} // Não pode editar slug
                  />
                </div>
              </div>

              {/* Preços */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_monthly">Preço Mensal (R$) *</Label>
                  <Input
                    id="price_monthly"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price_monthly}
                    onChange={(e) =>
                      setFormData({ ...formData, price_monthly: e.target.value })
                    }
                    placeholder="297.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_yearly">Preço Anual (R$) *</Label>
                  <Input
                    id="price_yearly"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price_yearly}
                    onChange={(e) =>
                      setFormData({ ...formData, price_yearly: e.target.value })
                    }
                    placeholder="2851.20"
                    required
                  />
                </div>
              </div>

              {/* Limites */}
              <div className="space-y-4">
                <Label className="text-base">Limites (deixe vazio para ilimitado)</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max_companies">Máx. Empresas</Label>
                    <Input
                      id="max_companies"
                      type="number"
                      min="0"
                      value={formData.max_companies}
                      onChange={(e) =>
                        setFormData({ ...formData, max_companies: e.target.value })
                      }
                      placeholder="Ilimitado"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_users">Máx. Usuários</Label>
                    <Input
                      id="max_users"
                      type="number"
                      min="0"
                      value={formData.max_users}
                      onChange={(e) =>
                        setFormData({ ...formData, max_users: e.target.value })
                      }
                      placeholder="Ilimitado"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_conversations">Máx. Conversas/mês</Label>
                    <Input
                      id="max_conversations"
                      type="number"
                      min="0"
                      value={formData.max_conversations}
                      onChange={(e) =>
                        setFormData({ ...formData, max_conversations: e.target.value })
                      }
                      placeholder="Ilimitado"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setEditingPlan(null);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
              >
                {createPlanMutation.isPending || updatePlanMutation.isPending
                  ? "Salvando..."
                  : editingPlan
                  ? "Atualizar"
                  : "Criar Plano"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!deletingPlan} onOpenChange={() => setDeletingPlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a deletar o plano <strong>{deletingPlan?.name}</strong>.
              Esta ação não pode ser desfeita e pode afetar empresas que estão usando este plano.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPlan && deletePlanMutation.mutate(deletingPlan.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePlanMutation.isPending ? "Deletando..." : "Deletar Plano"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
