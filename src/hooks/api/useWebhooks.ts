import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyQuery } from '@/hooks/crm/useCompanyQuery';
import { toast } from 'sonner';

export interface WebhookEndpoint {
  id: string;
  company_id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  enabled: boolean;
  verified: boolean;
  verified_at?: string;
  failure_count: number;
  last_failure_at?: string;
  last_failure_reason?: string;
  consecutive_failures: number;
  disabled_at?: string;
  total_deliveries: number;
  successful_deliveries: number;
  last_triggered_at?: string;
  avg_response_time_ms?: number;
  custom_headers: Record<string, string>;
  retry_count: number;
  retry_delay_seconds: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WebhookLog {
  id: string;
  endpoint_id: string;
  company_id: string;
  event_type: string;
  event_id: string;
  payload: Record<string, any>;
  attempt_number: number;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  response_status?: number;
  response_body?: string;
  response_headers?: Record<string, string>;
  sent_at?: string;
  responded_at?: string;
  duration_ms?: number;
  error_message?: string;
  next_retry_at?: string;
  created_at: string;
}

export interface CreateWebhookInput {
  name: string;
  url: string;
  events: string[];
  custom_headers?: Record<string, string>;
  retry_count?: number;
  retry_delay_seconds?: number;
}

// Generate a secure webhook secret
function generateWebhookSecret(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export const useWebhooks = () => {
  const { companyId } = useCompanyQuery();
  const queryClient = useQueryClient();

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ['webhooks', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('webhook_endpoints')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WebhookEndpoint[];
    },
    enabled: !!companyId,
  });

  const createWebhook = useMutation({
    mutationFn: async (input: CreateWebhookInput) => {
      if (!companyId) throw new Error('No company selected');

      const { data: user } = await supabase.auth.getUser();

      const secret = generateWebhookSecret();

      const { data, error } = await supabase
        .from('webhook_endpoints')
        .insert({
          company_id: companyId,
          name: input.name,
          url: input.url,
          secret,
          events: input.events,
          custom_headers: input.custom_headers || {},
          retry_count: input.retry_count || 3,
          retry_delay_seconds: input.retry_delay_seconds || 60,
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as WebhookEndpoint;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook criado!');
    },
    onError: (error) => {
      toast.error('Erro ao criar webhook: ' + error.message);
    },
  });

  const updateWebhook = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<WebhookEndpoint, 'name' | 'url' | 'events' | 'enabled' | 'custom_headers' | 'retry_count' | 'retry_delay_seconds'>>;
    }) => {
      const { error } = await supabase
        .from('webhook_endpoints')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar webhook: ' + error.message);
    },
  });

  const deleteWebhook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('webhook_endpoints')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook excluído!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir webhook: ' + error.message);
    },
  });

  const testWebhook = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('test-webhook', {
        body: { webhookId: id },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Webhook testado com sucesso!', {
          description: `Status: ${data.statusCode}, Tempo: ${data.duration}ms`,
        });
      } else {
        toast.error('Falha no teste do webhook', {
          description: data.error,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
    onError: (error) => {
      toast.error('Erro ao testar webhook: ' + error.message);
    },
  });

  const regenerateSecret = useMutation({
    mutationFn: async (id: string) => {
      const newSecret = generateWebhookSecret();

      const { error } = await supabase
        .from('webhook_endpoints')
        .update({ secret: newSecret })
        .eq('id', id);

      if (error) throw error;
      return newSecret;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Secret regenerado!', {
        description: 'Atualize a configuração no seu servidor.',
      });
    },
    onError: (error) => {
      toast.error('Erro ao regenerar secret: ' + error.message);
    },
  });

  return {
    webhooks,
    isLoading,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook,
    regenerateSecret,
  };
};

export const useWebhookLogs = (endpointId: string) => {
  const { companyId } = useCompanyQuery();

  return useQuery({
    queryKey: ['webhook-logs', endpointId],
    queryFn: async () => {
      if (!companyId || !endpointId) return [];

      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('endpoint_id', endpointId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as WebhookLog[];
    },
    enabled: !!companyId && !!endpointId,
  });
};

// Available webhook events
export const WEBHOOK_EVENTS = [
  // Messages
  { value: 'message.received', label: 'Mensagem recebida', category: 'Mensagens' },
  { value: 'message.sent', label: 'Mensagem enviada', category: 'Mensagens' },
  { value: 'message.delivered', label: 'Mensagem entregue', category: 'Mensagens' },
  { value: 'message.read', label: 'Mensagem lida', category: 'Mensagens' },

  // Conversations
  { value: 'conversation.created', label: 'Conversa criada', category: 'Conversas' },
  { value: 'conversation.resolved', label: 'Conversa resolvida', category: 'Conversas' },
  { value: 'conversation.closed', label: 'Conversa fechada', category: 'Conversas' },
  { value: 'conversation.assigned', label: 'Conversa atribuída', category: 'Conversas' },

  // Contacts
  { value: 'contact.created', label: 'Contato criado', category: 'Contatos' },
  { value: 'contact.updated', label: 'Contato atualizado', category: 'Contatos' },
  { value: 'contact.deleted', label: 'Contato excluído', category: 'Contatos' },

  // Deals
  { value: 'deal.created', label: 'Negócio criado', category: 'CRM' },
  { value: 'deal.updated', label: 'Negócio atualizado', category: 'CRM' },
  { value: 'deal.stage_changed', label: 'Stage alterado', category: 'CRM' },
  { value: 'deal.won', label: 'Negócio ganho', category: 'CRM' },
  { value: 'deal.lost', label: 'Negócio perdido', category: 'CRM' },

  // Tasks
  { value: 'task.created', label: 'Tarefa criada', category: 'Tarefas' },
  { value: 'task.completed', label: 'Tarefa concluída', category: 'Tarefas' },
  { value: 'task.overdue', label: 'Tarefa atrasada', category: 'Tarefas' },

  // Proposals
  { value: 'proposal.created', label: 'Proposta criada', category: 'Propostas' },
  { value: 'proposal.sent', label: 'Proposta enviada', category: 'Propostas' },
  { value: 'proposal.viewed', label: 'Proposta visualizada', category: 'Propostas' },
  { value: 'proposal.accepted', label: 'Proposta aceita', category: 'Propostas' },
  { value: 'proposal.rejected', label: 'Proposta rejeitada', category: 'Propostas' },

  // Campaigns
  { value: 'campaign.started', label: 'Campanha iniciada', category: 'Campanhas' },
  { value: 'campaign.completed', label: 'Campanha concluída', category: 'Campanhas' },
  { value: 'campaign.paused', label: 'Campanha pausada', category: 'Campanhas' },
] as const;
