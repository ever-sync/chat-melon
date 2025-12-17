import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyQuery } from './crm/useCompanyQuery';
import { toast } from 'sonner';

export interface Campaign {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  message_content: string;
  message_media_url?: string;
  message_type: 'text' | 'image' | 'video' | 'document';
  segment_id?: string;
  contact_filter?: any;
  schedule_at?: string;
  started_at?: string;
  completed_at?: string;
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
  total_contacts: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  reply_count: number;
  sending_rate: number;
  instance_id?: string;
  created_by?: string;
  created_at: string;
}

export const useCampaigns = () => {
  const { companyId } = useCompanyQuery();
  const queryClient = useQueryClient();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Campaign[];
    },
    enabled: !!companyId,
  });

  const createCampaign = useMutation({
    mutationFn: async (campaign: Partial<Campaign>) => {
      if (!companyId) throw new Error('No company selected');

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('campaigns')
        .insert([
          {
            name: campaign.name!,
            description: campaign.description,
            message_content: campaign.message_content!,
            message_media_url: campaign.message_media_url,
            message_type: campaign.message_type || 'text',
            segment_id: campaign.segment_id,
            contact_filter: campaign.contact_filter,
            schedule_at: campaign.schedule_at,
            status: campaign.status || 'draft',
            sending_rate: campaign.sending_rate || 10,
            instance_id: campaign.instance_id,
            company_id: companyId,
            created_by: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campanha criada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating campaign:', error);
      toast.error('Erro ao criar campanha');
    },
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Campaign> & { id: string }) => {
      const { data, error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campanha atualizada!');
    },
    onError: (error) => {
      console.error('Error updating campaign:', error);
      toast.error('Erro ao atualizar campanha');
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase.from('campaigns').delete().eq('id', campaignId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campanha excluída!');
    },
    onError: (error) => {
      console.error('Error deleting campaign:', error);
      toast.error('Erro ao excluir campanha');
    },
  });

  const startCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await supabase.functions.invoke('send-campaign', {
        body: { campaignId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campanha iniciada!');
    },
    onError: (error) => {
      console.error('Error starting campaign:', error);
      toast.error('Erro ao iniciar campanha');
    },
  });

  const pauseCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await supabase
        .from('campaigns')
        .update({ status: 'paused' })
        .eq('id', campaignId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campanha pausada!');
    },
    onError: (error) => {
      console.error('Error pausing campaign:', error);
      toast.error('Erro ao pausar campanha');
    },
  });

  const resumeCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await supabase.functions.invoke('send-campaign', {
        body: { campaignId, resume: true },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campanha retomada!');
    },
    onError: (error) => {
      console.error('Error resuming campaign:', error);
      toast.error('Erro ao retomar campanha');
    },
  });

  const resendToContact = useMutation({
    mutationFn: async ({ campaignId, contactId }: { campaignId: string; contactId: string }) => {
      if (!companyId) throw new Error('No company selected');

      // Update status to pending to retry
      const { error: updateError } = await supabase
        .from('campaign_contacts')
        .update({
          status: 'pending',
          error_message: null,
          sent_at: null,
          delivered_at: null,
        })
        .eq('campaign_id', campaignId)
        .eq('contact_id', contactId);

      if (updateError) throw updateError;

      // Trigger the send-campaign function to process this contact
      const { data, error } = await supabase.functions.invoke('send-campaign', {
        body: { campaignId, resume: true },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Mensagem reenviada!');
    },
    onError: (error) => {
      console.error('Error resending to contact:', error);
      toast.error('Erro ao reenviar mensagem');
    },
  });

  return {
    campaigns: campaigns || [],
    isLoading,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    startCampaign,
    pauseCampaign,
    resumeCampaign,
    resendToContact,
  };
};
