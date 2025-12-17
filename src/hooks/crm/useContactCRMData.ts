
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ContactMetrics {
    total_conversations: number;
    total_deals_won: number;
    total_spent: number;
    last_interaction: string;
}

export function useContactCRMData(contactId: string | undefined) {
    return useQuery({
        queryKey: ['contact-crm-metrics', contactId],
        queryFn: async () => {
            if (!contactId) return null;

            const { data, error } = await supabase.rpc('get_contact_metrics', {
                p_contact_id: contactId
            });

            if (error) {
                console.warn('Error fetching metrics:', error);

                // Return default values in case of error (e.g. migration not applied yet)
                return {
                    total_conversations: 0,
                    total_deals_won: 0,
                    total_spent: 0,
                    last_interaction: null
                } as ContactMetrics;
            }

            return data as ContactMetrics;
        },
        enabled: !!contactId,
        retry: 1
    });
}
