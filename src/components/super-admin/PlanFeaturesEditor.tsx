import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function PlanFeaturesEditor() {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: plans = [] } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase.from('subscription_plans').select('*').order('price');

      if (error) throw error;
      return data;
    },
  });

  const { data: features = [] } = useQuery({
    queryKey: ['platform-features-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_features')
        .select('*')
        .order('order_index');

      if (error) throw error;
      return data;
    },
  });

  const { data: planFeatures = [] } = useQuery({
    queryKey: ['plan-features', selectedPlanId],
    queryFn: async () => {
      if (!selectedPlanId) return [];

      const { data, error } = await supabase
        .from('plan_features')
        .select('*')
        .eq('plan_id', selectedPlanId);

      if (error) throw error;
      return data;
    },
    enabled: !!selectedPlanId,
  });

  const updatePlanFeatureMutation = useMutation({
    mutationFn: async ({ featureId, isEnabled }: { featureId: string; isEnabled: boolean }) => {
      if (!selectedPlanId) return;

      const existing = planFeatures.find((pf) => pf.feature_id === featureId);

      if (existing) {
        const { error } = await supabase
          .from('plan_features')
          .update({ is_enabled: isEnabled })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('plan_features').insert({
          plan_id: selectedPlanId,
          feature_id: featureId,
          is_enabled: isEnabled,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-features'] });
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast.success('Configuração do plano atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar configuração');
      console.error(error);
    },
  });

  const isFeatureEnabled = (featureId: string) => {
    const planFeature = planFeatures.find((pf) => pf.feature_id === featureId);
    return planFeature ? planFeature.is_enabled : true; // Default true se não configurado
  };

  if (!selectedPlanId) {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Selecione um plano:</label>
          <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
            <SelectTrigger className="w-full mt-2">
              <SelectValue placeholder="Escolha um plano" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name} - R$ {plan.price_monthly.toFixed(2)}/mês
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{selectedPlan?.name}</h3>
          <p className="text-sm text-muted-foreground">
            Configure as features disponíveis neste plano
          </p>
        </div>
        <Button variant="outline" onClick={() => setSelectedPlanId('')}>
          Trocar Plano
        </Button>
      </div>

      <div className="space-y-3">
        {features.map((feature) => (
          <div key={feature.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Checkbox
                id={feature.id}
                checked={isFeatureEnabled(feature.id)}
                onCheckedChange={(checked) =>
                  updatePlanFeatureMutation.mutate({
                    featureId: feature.id,
                    isEnabled: checked as boolean,
                  })
                }
              />
              <label htmlFor={feature.id} className="cursor-pointer">
                <div className="font-medium">{feature.name}</div>
                {feature.description && (
                  <div className="text-sm text-muted-foreground">{feature.description}</div>
                )}
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
