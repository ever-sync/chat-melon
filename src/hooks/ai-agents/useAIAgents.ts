import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';
import type {
  AIAgent,
  AIAgentFormData,
  AIAgentStatus,
  AIAgentChannel,
  AIAgentSkill,
  AIAgentFlow,
  AIAgentKnowledge,
  AIAgentHandoffRule,
  AIAgentResponseTemplate,
  AIAgentSession,
  AIAgentMetrics,
  AIAgentVersion,
} from '@/types/ai-agents';

// =====================================================
// HOOK PRINCIPAL - AGENTES
// =====================================================

export function useAIAgents() {
  const { currentCompany } = useCompany();
  const companyId = currentCompany?.id;

  return useQuery({
    queryKey: ['ai-agents', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('ai_agents')
        .select(`
          *,
          channels:ai_agent_channels(
            id,
            channel_id,
            is_enabled,
            priority,
            trigger_type,
            channel:channels(id, name, type, status)
          )
        `)
        .eq('company_id', companyId)
        .neq('status', 'archived')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as AIAgent[];
    },
    enabled: !!companyId,
  });
}

export function useAIAgent(agentId: string | undefined) {
  const { currentCompany } = useCompany();
  const companyId = currentCompany?.id;

  return useQuery({
    queryKey: ['ai-agent', agentId],
    queryFn: async () => {
      if (!agentId || !companyId) return null;

      const { data, error } = await supabase
        .from('ai_agents')
        .select(`
          *,
          channels:ai_agent_channels(
            *,
            channel:channels(id, name, type, status)
          ),
          skills:ai_agent_skills(*),
          flows:ai_agent_flows(*),
          knowledge:ai_agent_knowledge(*),
          handoff_rules:ai_agent_handoff_rules(*),
          templates:ai_agent_response_templates(*)
        `)
        .eq('id', agentId)
        .eq('company_id', companyId)
        .single();

      if (error) throw error;
      return data as AIAgent;
    },
    enabled: !!agentId && !!companyId,
  });
}

export function useCreateAIAgent() {
  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();

  return useMutation({
    mutationFn: async (formData: AIAgentFormData) => {
      if (!currentCompany?.id) throw new Error('Empresa não selecionada');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('ai_agents')
        .insert({
          company_id: currentCompany.id,
          created_by: user.id,
          ...formData,
          status: 'draft',
          version: 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
      toast.success('Agente criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar agente:', error);
      toast.error('Erro ao criar agente');
    },
  });
}

export function useUpdateAIAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<AIAgent> & { id: string }) => {
      const { data: updated, error } = await supabase
        .from('ai_agents')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
      queryClient.invalidateQueries({ queryKey: ['ai-agent', data.id] });
      toast.success('Agente atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar agente:', error);
      toast.error('Erro ao atualizar agente');
    },
  });
}

export function useDeleteAIAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agentId: string) => {
      // Soft delete - apenas arquiva
      const { error } = await supabase
        .from('ai_agents')
        .update({ status: 'archived' as AIAgentStatus })
        .eq('id', agentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
      toast.success('Agente arquivado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao arquivar agente:', error);
      toast.error('Erro ao arquivar agente');
    },
  });
}

export function usePublishAIAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agentId: string) => {
      const { data: { user } } = await supabase.auth.getUser();

      // Buscar dados atuais do agente
      const { data: agent, error: fetchError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (fetchError) throw fetchError;

      // Criar versão
      const { error: versionError } = await supabase
        .from('ai_agent_versions')
        .insert({
          agent_id: agentId,
          company_id: agent.company_id,
          version_number: agent.version,
          agent_snapshot: agent,
          is_published: true,
          published_at: new Date().toISOString(),
          published_by: user?.id,
        });

      if (versionError) throw versionError;

      // Atualizar status e incrementar versão
      const { data, error } = await supabase
        .from('ai_agents')
        .update({
          status: 'active' as AIAgentStatus,
          published_at: new Date().toISOString(),
          version: agent.version + 1,
        })
        .eq('id', agentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
      queryClient.invalidateQueries({ queryKey: ['ai-agent', data.id] });
      toast.success('Agente publicado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao publicar agente:', error);
      toast.error('Erro ao publicar agente');
    },
  });
}

export function usePauseAIAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agentId: string) => {
      const { data, error } = await supabase
        .from('ai_agents')
        .update({ status: 'paused' as AIAgentStatus })
        .eq('id', agentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
      queryClient.invalidateQueries({ queryKey: ['ai-agent', data.id] });
      toast.success('Agente pausado!');
    },
    onError: (error) => {
      console.error('Erro ao pausar agente:', error);
      toast.error('Erro ao pausar agente');
    },
  });
}

export function useActivateAIAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agentId: string) => {
      const { data, error } = await supabase
        .from('ai_agents')
        .update({ status: 'active' as AIAgentStatus })
        .eq('id', agentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
      queryClient.invalidateQueries({ queryKey: ['ai-agent', data.id] });
      toast.success('Agente ativado!');
    },
    onError: (error) => {
      console.error('Erro ao ativar agente:', error);
      toast.error('Erro ao ativar agente');
    },
  });
}

// =====================================================
// CANAIS DO AGENTE
// =====================================================

export function useAIAgentChannels(agentId: string | undefined) {
  return useQuery({
    queryKey: ['ai-agent-channels', agentId],
    queryFn: async () => {
      if (!agentId) return [];

      const { data, error } = await supabase
        .from('ai_agent_channels')
        .select(`
          *,
          channel:channels(id, name, type, status)
        `)
        .eq('agent_id', agentId)
        .order('priority', { ascending: true });

      if (error) throw error;
      return (data || []) as AIAgentChannel[];
    },
    enabled: !!agentId,
  });
}

export function useAddAgentChannel() {
  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();

  return useMutation({
    mutationFn: async (data: Omit<AIAgentChannel, 'id' | 'created_at' | 'updated_at' | 'total_sessions' | 'total_messages'>) => {
      if (!currentCompany?.id) throw new Error('Empresa não selecionada');

      const { data: created, error } = await supabase
        .from('ai_agent_channels')
        .insert({
          ...data,
          company_id: currentCompany.id,
        })
        .select(`
          *,
          channel:channels(id, name, type, status)
        `)
        .single();

      if (error) throw error;
      return created;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-channels', variables.agent_id] });
      queryClient.invalidateQueries({ queryKey: ['ai-agent', variables.agent_id] });
      toast.success('Canal vinculado ao agente!');
    },
    onError: (error) => {
      console.error('Erro ao vincular canal:', error);
      toast.error('Erro ao vincular canal');
    },
  });
}

export function useUpdateAgentChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, agent_id, ...data }: Partial<AIAgentChannel> & { id: string; agent_id: string }) => {
      const { data: updated, error } = await supabase
        .from('ai_agent_channels')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...updated, agent_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-channels', data.agent_id] });
      toast.success('Canal atualizado!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar canal:', error);
      toast.error('Erro ao atualizar canal');
    },
  });
}

export function useRemoveAgentChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, agent_id }: { id: string; agent_id: string }) => {
      const { error } = await supabase
        .from('ai_agent_channels')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { agent_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-channels', data.agent_id] });
      toast.success('Canal removido do agente!');
    },
    onError: (error) => {
      console.error('Erro ao remover canal:', error);
      toast.error('Erro ao remover canal');
    },
  });
}

// =====================================================
// SKILLS DO AGENTE
// =====================================================

export function useAIAgentSkills(agentId: string | undefined) {
  return useQuery({
    queryKey: ['ai-agent-skills', agentId],
    queryFn: async () => {
      if (!agentId) return [];

      const { data, error } = await supabase
        .from('ai_agent_skills')
        .select('*')
        .eq('agent_id', agentId)
        .order('priority', { ascending: true });

      if (error) throw error;
      return (data || []) as AIAgentSkill[];
    },
    enabled: !!agentId,
  });
}

export function useCreateAgentSkill() {
  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();

  return useMutation({
    mutationFn: async (data: Omit<AIAgentSkill, 'id' | 'created_at' | 'updated_at' | 'times_triggered' | 'success_rate'>) => {
      if (!currentCompany?.id) throw new Error('Empresa não selecionada');

      const { data: created, error } = await supabase
        .from('ai_agent_skills')
        .insert({
          ...data,
          company_id: currentCompany.id,
        })
        .select()
        .single();

      if (error) throw error;
      return created;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-skills', variables.agent_id] });
      toast.success('Skill criada!');
    },
    onError: (error) => {
      console.error('Erro ao criar skill:', error);
      toast.error('Erro ao criar skill');
    },
  });
}

export function useUpdateAgentSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, agent_id, ...data }: Partial<AIAgentSkill> & { id: string; agent_id: string }) => {
      const { data: updated, error } = await supabase
        .from('ai_agent_skills')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...updated, agent_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-skills', data.agent_id] });
      toast.success('Skill atualizada!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar skill:', error);
      toast.error('Erro ao atualizar skill');
    },
  });
}

export function useDeleteAgentSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, agent_id }: { id: string; agent_id: string }) => {
      const { error } = await supabase
        .from('ai_agent_skills')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { agent_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-skills', data.agent_id] });
      toast.success('Skill removida!');
    },
    onError: (error) => {
      console.error('Erro ao remover skill:', error);
      toast.error('Erro ao remover skill');
    },
  });
}

// =====================================================
// KNOWLEDGE BASE
// =====================================================

export function useAIAgentKnowledge(agentId: string | undefined) {
  return useQuery({
    queryKey: ['ai-agent-knowledge', agentId],
    queryFn: async () => {
      if (!agentId) return [];

      const { data, error } = await supabase
        .from('ai_agent_knowledge')
        .select('*')
        .eq('agent_id', agentId)
        .eq('is_enabled', true)
        .order('priority', { ascending: true });

      if (error) throw error;
      return (data || []) as AIAgentKnowledge[];
    },
    enabled: !!agentId,
  });
}

export function useCreateAgentKnowledge() {
  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();

  return useMutation({
    mutationFn: async (data: Omit<AIAgentKnowledge, 'id' | 'created_at' | 'updated_at' | 'times_used' | 'helpful_votes'>) => {
      if (!currentCompany?.id) throw new Error('Empresa não selecionada');

      const { data: created, error } = await supabase
        .from('ai_agent_knowledge')
        .insert({
          ...data,
          company_id: currentCompany.id,
        })
        .select()
        .single();

      if (error) throw error;
      return created;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-knowledge', variables.agent_id] });
      toast.success('Conhecimento adicionado!');
    },
    onError: (error) => {
      console.error('Erro ao adicionar conhecimento:', error);
      toast.error('Erro ao adicionar conhecimento');
    },
  });
}

// =====================================================
// FLOWS
// =====================================================

export function useAIAgentFlows(agentId: string | undefined) {
  return useQuery({
    queryKey: ['ai-agent-flows', agentId],
    queryFn: async () => {
      if (!agentId) return [];

      const { data, error } = await supabase
        .from('ai_agent_flows')
        .select('*')
        .eq('agent_id', agentId)
        .order('is_default', { ascending: false });

      if (error) throw error;
      return (data || []) as AIAgentFlow[];
    },
    enabled: !!agentId,
  });
}

// =====================================================
// HANDOFF RULES
// =====================================================

export function useAIAgentHandoffRules(agentId: string | undefined) {
  return useQuery({
    queryKey: ['ai-agent-handoff-rules', agentId],
    queryFn: async () => {
      if (!agentId) return [];

      const { data, error } = await supabase
        .from('ai_agent_handoff_rules')
        .select('*')
        .eq('agent_id', agentId)
        .order('priority', { ascending: true });

      if (error) throw error;
      return (data || []) as AIAgentHandoffRule[];
    },
    enabled: !!agentId,
  });
}

export function useCreateHandoffRule() {
  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();

  return useMutation({
    mutationFn: async (data: Omit<AIAgentHandoffRule, 'id' | 'created_at' | 'updated_at' | 'times_triggered'>) => {
      if (!currentCompany?.id) throw new Error('Empresa não selecionada');

      const { data: created, error } = await supabase
        .from('ai_agent_handoff_rules')
        .insert({
          ...data,
          company_id: currentCompany.id,
        })
        .select()
        .single();

      if (error) throw error;
      return created;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-handoff-rules', variables.agent_id] });
      toast.success('Regra de handoff criada!');
    },
    onError: (error) => {
      console.error('Erro ao criar regra:', error);
      toast.error('Erro ao criar regra');
    },
  });
}

// =====================================================
// SESSIONS
// =====================================================

export function useAIAgentSessions(agentId: string | undefined, options?: { status?: AIAgentSession['status']; limit?: number }) {
  return useQuery({
    queryKey: ['ai-agent-sessions', agentId, options],
    queryFn: async () => {
      if (!agentId) return [];

      let query = supabase
        .from('ai_agent_sessions')
        .select(`
          *,
          contact:contacts(id, name, phone, profile_pic_url)
        `)
        .eq('agent_id', agentId)
        .order('started_at', { ascending: false });

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as AIAgentSession[];
    },
    enabled: !!agentId,
  });
}

export function useActiveAIAgentSessions() {
  const { currentCompany } = useCompany();
  const companyId = currentCompany?.id;

  return useQuery({
    queryKey: ['ai-agent-sessions-active', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('ai_agent_sessions')
        .select(`
          *,
          agent:ai_agents(id, name, avatar_url),
          contact:contacts(id, name, phone, profile_pic_url)
        `)
        .eq('company_id', companyId)
        .in('status', ['active', 'waiting_response'])
        .order('last_activity_at', { ascending: false });

      if (error) throw error;
      return (data || []) as AIAgentSession[];
    },
    enabled: !!companyId,
    refetchInterval: 10000, // Atualiza a cada 10 segundos
  });
}

// =====================================================
// METRICS
// =====================================================

export function useAIAgentMetrics(agentId: string | undefined, periodType: 'daily' | 'weekly' | 'monthly' = 'daily') {
  return useQuery({
    queryKey: ['ai-agent-metrics', agentId, periodType],
    queryFn: async () => {
      if (!agentId) return [];

      const { data, error } = await supabase
        .from('ai_agent_metrics')
        .select('*')
        .eq('agent_id', agentId)
        .eq('period_type', periodType)
        .order('period_start', { ascending: false })
        .limit(30);

      if (error) throw error;
      return (data || []) as AIAgentMetrics[];
    },
    enabled: !!agentId,
  });
}

// =====================================================
// VERSIONS
// =====================================================

export function useAIAgentVersions(agentId: string | undefined) {
  return useQuery({
    queryKey: ['ai-agent-versions', agentId],
    queryFn: async () => {
      if (!agentId) return [];

      const { data, error } = await supabase
        .from('ai_agent_versions')
        .select('*')
        .eq('agent_id', agentId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      return (data || []) as AIAgentVersion[];
    },
    enabled: !!agentId,
  });
}

// =====================================================
// DUPLICATE AGENT
// =====================================================

export function useDuplicateAIAgent() {
  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();

  return useMutation({
    mutationFn: async (agentId: string) => {
      if (!currentCompany?.id) throw new Error('Empresa não selecionada');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar agente original
      const { data: original, error: fetchError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (fetchError) throw fetchError;

      // Criar cópia
      const { id, created_at, updated_at, published_at, last_active_at, total_sessions, total_messages_sent, total_handoffs, ...agentData } = original;

      const { data, error } = await supabase
        .from('ai_agents')
        .insert({
          ...agentData,
          name: `${original.name} (Cópia)`,
          status: 'draft',
          version: 1,
          created_by: user.id,
          satisfaction_score: 0,
          resolution_rate: 0,
          avg_session_duration: 0,
          avg_messages_per_session: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
      toast.success('Agente duplicado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao duplicar agente:', error);
      toast.error('Erro ao duplicar agente');
    },
  });
}
