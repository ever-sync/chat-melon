import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
  is_active: boolean;
  plan_id: string | null;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
}

export function PlatformCompanies() {
  const queryClient = useQueryClient();

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["platform-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Company[];
    },
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("id, name, slug")
        .order("price_monthly", { ascending: true });

      if (error) throw error;
      return data as SubscriptionPlan[];
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ companyId, planId }: { companyId: string; planId: string | null }) => {
      const { error } = await supabase
        .from("companies")
        .update({ plan_id: planId })
        .eq("id", companyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-companies"] });
      toast.success("Plano atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar plano: ${error.message}`);
    },
  });

  const handlePlanChange = (companyId: string, planId: string) => {
    updatePlanMutation.mutate({
      companyId,
      planId: planId === "null" ? null : planId
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {companies.map((company) => {
        const currentPlan = plans.find(p => p.id === company.plan_id);

        return (
          <div
            key={company.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">
                    {company.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              <div>
                <h3 className="font-semibold">{company.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Criada em {format(new Date(company.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant={company.is_active ? "default" : "secondary"}>
                {company.is_active ? "Ativa" : "Inativa"}
              </Badge>

              <div className="w-[200px]">
                <Select
                  value={company.plan_id || "null"}
                  onValueChange={(value) => handlePlanChange(company.id, value)}
                  disabled={updatePlanMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar plano">
                      {updatePlanMutation.isPending ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Atualizando...
                        </span>
                      ) : (
                        currentPlan?.name || "Sem plano"
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">
                      <span className="text-muted-foreground">Sem plano</span>
                    </SelectItem>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      })}

      {companies.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma empresa cadastrada ainda
        </div>
      )}
    </div>
  );
}
