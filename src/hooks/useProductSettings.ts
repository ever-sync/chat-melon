import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

export interface ProductSettings {
  id: string;
  company_id: string;
  entity_name: string;
  entity_name_plural: string;
  entity_icon: string;
}

const DEFAULT_SETTINGS: Omit<ProductSettings, 'id' | 'company_id'> = {
  entity_name: 'Produto',
  entity_name_plural: 'Produtos',
  entity_icon: 'Package',
};

export const useProductSettings = () => {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['product-settings', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return null;

      const { data, error } = await supabase
        .from('product_settings')
        .select('*')
        .eq('company_id', currentCompany.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading product settings:', error);
        return null;
      }

      return data as ProductSettings | null;
    },
    enabled: !!currentCompany?.id,
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<Omit<ProductSettings, 'id' | 'company_id'>>) => {
      if (!currentCompany?.id) throw new Error('No company');

      // Check if settings exist
      const { data: existing } = await supabase
        .from('product_settings')
        .select('id')
        .eq('company_id', currentCompany.id)
        .maybeSingle();

      if (existing) {
        // Update
        const { data, error } = await supabase
          .from('product_settings')
          .update(newSettings)
          .eq('company_id', currentCompany.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert
        const { data, error } = await supabase
          .from('product_settings')
          .insert({
            company_id: currentCompany.id,
            ...DEFAULT_SETTINGS,
            ...newSettings,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-settings'] });
      toast.success('Configurações salvas!');
    },
    onError: (error) => {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    },
  });

  // Return settings with defaults
  const effectiveSettings = {
    entity_name: settings?.entity_name || DEFAULT_SETTINGS.entity_name,
    entity_name_plural: settings?.entity_name_plural || DEFAULT_SETTINGS.entity_name_plural,
    entity_icon: settings?.entity_icon || DEFAULT_SETTINGS.entity_icon,
  };

  return {
    settings: effectiveSettings,
    rawSettings: settings,
    isLoading,
    updateSettings: updateSettings.mutate,
    isUpdating: updateSettings.isPending,
  };
};
