import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyQuery } from '../crm/useCompanyQuery';
import { toast } from 'sonner';

export interface ProposalItem {
  id: string;
  product_id: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Proposal {
  id: string;
  deal_id: string;
  title: string;
  items: ProposalItem[];
  subtotal: number;
  discount: number;
  discount_type: 'percentage' | 'fixed';
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  public_link: string | null;
  pdf_url: string | null;
  payment_terms: string | null;
  validity_days: number;
  viewed_at: string | null;
  created_at: string;
  version: number;
  parent_proposal_id: string | null;
  change_notes: string | null;
  deals?: {
    title: string;
    contacts: {
      name: string | null;
      phone_number: string;
    };
  };
}

export const useProposals = (dealId?: string) => {
  const { companyId } = useCompanyQuery();
  const queryClient = useQueryClient();

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ['proposals', companyId, dealId],
    queryFn: async () => {
      if (!companyId) return [];

      let query = supabase
        .from('proposals')
        .select(
          `
          *,
          deals!inner(
            title,
            company_id,
            contacts(name, phone_number)
          )
        `
        )
        .eq('deals.company_id', companyId)
        .order('created_at', { ascending: false });

      if (dealId) {
        query = query.eq('deal_id', dealId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data.map((p) => ({
        ...p,
        items: p.items as any as ProposalItem[],
      })) as Proposal[];
    },
    enabled: !!companyId,
  });

  const createProposal = useMutation({
    mutationFn: async (proposal: Partial<Proposal>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('proposals')
        .insert({
          deal_id: proposal.deal_id,
          title: proposal.title,
          items: proposal.items as any,
          subtotal: proposal.subtotal,
          discount: proposal.discount,
          discount_type: proposal.discount_type,
          tax: proposal.tax,
          total: proposal.total,
          status: proposal.status,
          payment_terms: proposal.payment_terms,
          validity_days: proposal.validity_days,
          created_by: user.id,
          version: proposal.version || 1,
          parent_proposal_id: proposal.parent_proposal_id || null,
          change_notes: proposal.change_notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Proposta criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar proposta');
      console.error(error);
    },
  });

  const updateProposal = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Proposal> & { id: string }) => {
      const updateData: any = { ...updates };
      if (updates.items) {
        updateData.items = updates.items as any;
      }

      const { data, error } = await supabase
        .from('proposals')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Proposta atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar proposta');
      console.error(error);
    },
  });

  const generatePublicLink = useMutation({
    mutationFn: async (proposalId: string) => {
      const publicSlug = crypto.randomUUID();

      const { data, error } = await supabase
        .from('proposals')
        .update({
          public_link: publicSlug,
          status: 'sent',
        })
        .eq('id', proposalId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Link público gerado!');
    },
    onError: (error) => {
      toast.error('Erro ao gerar link');
      console.error(error);
    },
  });

  const createVersion = useMutation({
    mutationFn: async ({
      originalProposalId,
      changeNotes,
    }: {
      originalProposalId: string;
      changeNotes: string;
    }) => {
      // Get original proposal
      const { data: original, error: fetchError } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', originalProposalId)
        .single();

      if (fetchError) throw fetchError;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Create new version
      const { data, error } = await supabase
        .from('proposals')
        .insert({
          deal_id: original.deal_id,
          title: original.title,
          items: original.items,
          subtotal: original.subtotal,
          discount: original.discount,
          discount_type: original.discount_type,
          tax: original.tax,
          total: original.total,
          status: 'draft',
          payment_terms: original.payment_terms,
          validity_days: original.validity_days,
          created_by: user.id,
          version: original.version + 1,
          parent_proposal_id: originalProposalId,
          change_notes: changeNotes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Nova versão criada!');
    },
    onError: (error) => {
      toast.error('Erro ao criar versão');
      console.error(error);
    },
  });

  const getVersionHistory = async (dealId: string) => {
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('deal_id', dealId)
      .order('version', { ascending: false });

    if (error) throw error;
    return data.map((p) => ({
      ...p,
      items: p.items as any as ProposalItem[],
    })) as Proposal[];
  };

  const sendViaWhatsApp = useMutation({
    mutationFn: async ({
      proposalId,
      contactPhone,
    }: {
      proposalId: string;
      contactPhone: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Gerar link público se ainda não tiver
      const { data: proposal } = await supabase
        .from('proposals')
        .select('public_link, title')
        .eq('id', proposalId)
        .single();

      let publicLink = proposal?.public_link;

      if (!publicLink) {
        const updated = await generatePublicLink.mutateAsync(proposalId);
        publicLink = updated.public_link;
      }

      const publicUrl = `${window.location.origin}/p/${publicLink}`;
      const message = `Olá! Segue sua proposta comercial "${proposal?.title}":\n\n${publicUrl}\n\nQualquer dúvida, estou à disposição!`;

      // Enviar via Evolution API
      const response = await supabase.functions.invoke('evolution-send-message', {
        body: {
          phone: contactPhone,
          message,
        },
      });

      if (response.error) throw response.error;

      return response.data;
    },
    onSuccess: () => {
      toast.success('Proposta enviada por WhatsApp!');
    },
    onError: (error) => {
      console.error('Erro ao enviar proposta:', error);
      toast.error('Erro ao enviar proposta por WhatsApp');
    },
  });

  return {
    proposals,
    isLoading,
    createProposal: createProposal.mutateAsync,
    updateProposal: updateProposal.mutateAsync,
    generatePublicLink: generatePublicLink.mutateAsync,
    createVersion: createVersion.mutateAsync,
    sendViaWhatsApp: sendViaWhatsApp.mutateAsync,
    getVersionHistory,
  };
};
