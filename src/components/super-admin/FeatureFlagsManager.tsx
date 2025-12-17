import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import * as Icons from 'lucide-react';

export function FeatureFlagsManager() {
  const queryClient = useQueryClient();

  const { data: features = [], isLoading } = useQuery({
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

  const updateFeatureMutation = useMutation({
    mutationFn: async ({ id, is_global_enabled }: { id: string; is_global_enabled: boolean }) => {
      const { error } = await supabase
        .from('platform_features')
        .update({ is_global_enabled })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-features-all'] });
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast.success('Feature atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar feature');
      console.error(error);
    },
  });

  const getCategoryBadge = (category: string) => {
    const colors = {
      crm: 'bg-blue-500/10 text-blue-500',
      engagement: 'bg-purple-500/10 text-purple-500',
      marketing: 'bg-green-500/10 text-green-500',
      automation: 'bg-yellow-500/10 text-yellow-500',
      data: 'bg-orange-500/10 text-orange-500',
      chat: 'bg-cyan-500/10 text-cyan-500',
      ai: 'bg-pink-500/10 text-pink-500',
      analytics: 'bg-indigo-500/10 text-indigo-500',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500/10 text-gray-500';
  };

  if (isLoading) {
    return <div>Carregando features...</div>;
  }

  return (
    <div className="space-y-4">
      {features.map((feature) => {
        const IconComponent = feature.icon ? (Icons as any)[feature.icon] : Icons.Circle;

        return (
          <div
            key={feature.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-4 flex-1">
              {IconComponent && (
                <div className="p-2 rounded-lg bg-primary/10">
                  <IconComponent className="h-5 w-5 text-primary" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{feature.name}</h3>
                  <Badge className={getCategoryBadge(feature.category)}>{feature.category}</Badge>
                </div>
                {feature.description && (
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Key: <code className="bg-muted px-1 py-0.5 rounded">{feature.feature_key}</code>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium">
                  {feature.is_global_enabled ? (
                    <span className="text-green-600">Ativo</span>
                  ) : (
                    <span className="text-red-600">Desativado</span>
                  )}
                </div>
              </div>
              <Switch
                checked={feature.is_global_enabled}
                onCheckedChange={(checked) =>
                  updateFeatureMutation.mutate({
                    id: feature.id,
                    is_global_enabled: checked,
                  })
                }
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
