import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyQuery } from './crm/useCompanyQuery';

export type CustomFieldForVariable = {
  id: string;
  field_name: string;
  field_label: string;
  entity_type: 'contact' | 'deal' | 'company';
};

export const useAllCustomFields = () => {
  const { companyId } = useCompanyQuery();

  const { data: customFields = [], isLoading } = useQuery({
    queryKey: ['all_custom_fields', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('custom_fields')
        .select('id, field_name, field_label, entity_type')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('entity_type')
        .order('display_order');

      if (error) throw error;
      return data as CustomFieldForVariable[];
    },
    enabled: !!companyId,
  });

  // Group by entity type
  const contactFields = customFields.filter(f => f.entity_type === 'contact');
  const dealFields = customFields.filter(f => f.entity_type === 'deal');
  const companyFields = customFields.filter(f => f.entity_type === 'company');

  return {
    customFields,
    contactFields,
    dealFields,
    companyFields,
    isLoading,
  };
};
