import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type {
  Chatbot,
  ChatbotVersion,
  ChatbotExecution,
  ChatbotTemplate,
  CreateChatbotInput,
  UpdateChatbotInput,
  PublishChatbotInput,
  ChatbotNode,
  ChatbotEdge,
} from '@/types/chatbot';

// =====================================================
// Chatbots CRUD Hook
// =====================================================

export function useChatbots() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const chatbotsQuery = useQuery({
    queryKey: ['chatbots', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];

      const { data, error } = await supabase
        .from('chatbots')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Chatbot[];
    },
    enabled: !!profile?.company_id,
  });

  const createChatbot = useMutation({
    mutationFn: async (input: CreateChatbotInput) => {
      if (!profile?.company_id) throw new Error('Company not found');

      const defaultNodes: ChatbotNode[] = input.nodes || [
        {
          id: 'start_1',
          type: 'start',
          position: { x: 250, y: 0 },
          data: { label: 'Início' },
        },
      ];

      const { data, error } = await supabase
        .from('chatbots')
        .insert({
          company_id: profile.company_id,
          name: input.name,
          description: input.description,
          nodes: defaultNodes,
          edges: input.edges || [],
          triggers: input.triggers || [],
          active_channels: input.active_channels || ['whatsapp'],
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Chatbot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
    },
  });

  const updateChatbot = useMutation({
    mutationFn: async ({ id, ...input }: UpdateChatbotInput & { id: string }) => {
      const { data, error } = await supabase
        .from('chatbots')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Chatbot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
    },
  });

  const deleteChatbot = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('chatbots')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
    },
  });

  const duplicateChatbot = useMutation({
    mutationFn: async (id: string) => {
      if (!profile?.company_id) throw new Error('Company not found');

      // Get the original chatbot
      const { data: original, error: fetchError } = await supabase
        .from('chatbots')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Create a copy
      const { data, error } = await supabase
        .from('chatbots')
        .insert({
          company_id: profile.company_id,
          name: `${original.name} (cópia)`,
          description: original.description,
          nodes: original.nodes,
          edges: original.edges,
          variables: original.variables,
          settings: original.settings,
          triggers: original.triggers,
          active_channels: original.active_channels,
          status: 'draft',
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Chatbot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
    },
  });

  return {
    chatbots: chatbotsQuery.data || [],
    isLoading: chatbotsQuery.isLoading,
    error: chatbotsQuery.error,
    createChatbot,
    updateChatbot,
    deleteChatbot,
    duplicateChatbot,
  };
}

// =====================================================
// Single Chatbot Hook
// =====================================================

export function useChatbot(id: string | undefined) {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const chatbotQuery = useQuery({
    queryKey: ['chatbot', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('chatbots')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Chatbot;
    },
    enabled: !!id,
  });

  const saveFlow = useMutation({
    mutationFn: async ({ nodes, edges }: { nodes: ChatbotNode[]; edges: ChatbotEdge[] }) => {
      if (!id) throw new Error('Chatbot ID required');

      const { data, error } = await supabase
        .from('chatbots')
        .update({ nodes, edges })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Chatbot;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['chatbot', id], data);
    },
  });

  const publish = useMutation({
    mutationFn: async (input: PublishChatbotInput) => {
      if (!id || !profile) throw new Error('Chatbot ID required');

      const chatbot = chatbotQuery.data;
      if (!chatbot) throw new Error('Chatbot not found');

      // Create a new version
      const { error: versionError } = await supabase
        .from('chatbot_versions')
        .insert({
          chatbot_id: id,
          version: chatbot.version + 1,
          nodes: chatbot.nodes,
          edges: chatbot.edges,
          variables: chatbot.variables,
          settings: chatbot.settings,
          triggers: chatbot.triggers,
          published_by: profile.id,
          release_notes: input.release_notes,
        });

      if (versionError) throw versionError;

      // Update the chatbot status
      const { data, error } = await supabase
        .from('chatbots')
        .update({
          status: 'active',
          version: chatbot.version + 1,
          published_at: new Date().toISOString(),
          published_by: profile.id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Chatbot;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['chatbot', id], data);
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
    },
  });

  const pause = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('Chatbot ID required');

      const { data, error } = await supabase
        .from('chatbots')
        .update({ status: 'paused' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Chatbot;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['chatbot', id], data);
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
    },
  });

  const activate = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('Chatbot ID required');

      const { data, error } = await supabase
        .from('chatbots')
        .update({ status: 'active' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Chatbot;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['chatbot', id], data);
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
    },
  });

  return {
    chatbot: chatbotQuery.data,
    isLoading: chatbotQuery.isLoading,
    error: chatbotQuery.error,
    saveFlow,
    publish,
    pause,
    activate,
  };
}

// =====================================================
// Chatbot Versions Hook
// =====================================================

export function useChatbotVersions(chatbotId: string | undefined) {
  const versionsQuery = useQuery({
    queryKey: ['chatbot-versions', chatbotId],
    queryFn: async () => {
      if (!chatbotId) return [];

      const { data, error } = await supabase
        .from('chatbot_versions')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .order('version', { ascending: false });

      if (error) throw error;
      return data as ChatbotVersion[];
    },
    enabled: !!chatbotId,
  });

  return {
    versions: versionsQuery.data || [],
    isLoading: versionsQuery.isLoading,
    error: versionsQuery.error,
  };
}

// =====================================================
// Chatbot Executions Hook
// =====================================================

export function useChatbotExecutions(chatbotId?: string) {
  const { profile } = useAuth();

  const executionsQuery = useQuery({
    queryKey: ['chatbot-executions', chatbotId],
    queryFn: async () => {
      if (!profile?.company_id) return [];

      let query = supabase
        .from('chatbot_executions')
        .select(`
          *,
          chatbot:chatbots(name)
        `)
        .order('started_at', { ascending: false })
        .limit(100);

      if (chatbotId) {
        query = query.eq('chatbot_id', chatbotId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as (ChatbotExecution & { chatbot: { name: string } })[];
    },
    enabled: !!profile?.company_id,
  });

  return {
    executions: executionsQuery.data || [],
    isLoading: executionsQuery.isLoading,
    error: executionsQuery.error,
  };
}

// =====================================================
// Chatbot Templates Hook
// =====================================================

export function useChatbotTemplates() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ['chatbot-templates', profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chatbot_templates')
        .select('*')
        .or(`is_system.eq.true,company_id.eq.${profile?.company_id}`)
        .order('is_system', { ascending: false })
        .order('usage_count', { ascending: false });

      if (error) throw error;
      return data as ChatbotTemplate[];
    },
    enabled: !!profile?.company_id,
  });

  const createFromTemplate = useMutation({
    mutationFn: async ({ templateId, name }: { templateId: string; name: string }) => {
      if (!profile?.company_id) throw new Error('Company not found');

      // Get the template
      const { data: template, error: fetchError } = await supabase
        .from('chatbot_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (fetchError) throw fetchError;

      // Increment usage count
      await supabase
        .from('chatbot_templates')
        .update({ usage_count: (template.usage_count || 0) + 1 })
        .eq('id', templateId);

      // Create chatbot from template
      const { data, error } = await supabase
        .from('chatbots')
        .insert({
          company_id: profile.company_id,
          name,
          description: template.description,
          nodes: template.nodes,
          edges: template.edges,
          variables: template.variables || {},
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Chatbot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
    },
  });

  const saveAsTemplate = useMutation({
    mutationFn: async ({
      chatbotId,
      name,
      description,
      category,
    }: {
      chatbotId: string;
      name: string;
      description?: string;
      category?: string;
    }) => {
      if (!profile?.company_id) throw new Error('Company not found');

      // Get the chatbot
      const { data: chatbot, error: fetchError } = await supabase
        .from('chatbots')
        .select('*')
        .eq('id', chatbotId)
        .single();

      if (fetchError) throw fetchError;

      // Create template
      const { data, error } = await supabase
        .from('chatbot_templates')
        .insert({
          name,
          description,
          category,
          nodes: chatbot.nodes,
          edges: chatbot.edges,
          variables: chatbot.variables,
          is_system: false,
          company_id: profile.company_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ChatbotTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-templates'] });
    },
  });

  return {
    templates: templatesQuery.data || [],
    isLoading: templatesQuery.isLoading,
    error: templatesQuery.error,
    createFromTemplate,
    saveAsTemplate,
  };
}

// =====================================================
// Chatbot Analytics Hook
// =====================================================

export function useChatbotAnalytics(chatbotId: string | undefined, days = 30) {
  const analyticsQuery = useQuery({
    queryKey: ['chatbot-analytics', chatbotId, days],
    queryFn: async () => {
      if (!chatbotId) return null;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: executions, error } = await supabase
        .from('chatbot_executions')
        .select('status, started_at, completed_at, handoff_at, messages_sent, messages_received')
        .eq('chatbot_id', chatbotId)
        .gte('started_at', startDate.toISOString());

      if (error) throw error;

      // Calculate metrics
      const totalExecutions = executions.length;
      const completedExecutions = executions.filter((e) => e.status === 'completed').length;
      const handoffExecutions = executions.filter((e) => e.status === 'handoff').length;
      const failedExecutions = executions.filter((e) => e.status === 'failed' || e.status === 'timeout').length;

      const completionRate = totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0;
      const handoffRate = totalExecutions > 0 ? (handoffExecutions / totalExecutions) * 100 : 0;

      // Average session duration (for completed executions)
      const completedWithDuration = executions.filter(
        (e) => e.status === 'completed' && e.completed_at && e.started_at
      );
      const avgDurationMs = completedWithDuration.length > 0
        ? completedWithDuration.reduce((sum, e) => {
            const duration = new Date(e.completed_at!).getTime() - new Date(e.started_at).getTime();
            return sum + duration;
          }, 0) / completedWithDuration.length
        : 0;

      // Messages per execution
      const totalMessagesSent = executions.reduce((sum, e) => sum + (e.messages_sent || 0), 0);
      const totalMessagesReceived = executions.reduce((sum, e) => sum + (e.messages_received || 0), 0);
      const avgMessagesPerExecution = totalExecutions > 0
        ? (totalMessagesSent + totalMessagesReceived) / totalExecutions
        : 0;

      // Daily breakdown
      const dailyData = executions.reduce((acc, e) => {
        const date = new Date(e.started_at).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { total: 0, completed: 0, handoff: 0 };
        }
        acc[date].total++;
        if (e.status === 'completed') acc[date].completed++;
        if (e.status === 'handoff') acc[date].handoff++;
        return acc;
      }, {} as Record<string, { total: number; completed: number; handoff: number }>);

      return {
        totalExecutions,
        completedExecutions,
        handoffExecutions,
        failedExecutions,
        completionRate,
        handoffRate,
        avgDurationSeconds: avgDurationMs / 1000,
        avgMessagesPerExecution,
        totalMessagesSent,
        totalMessagesReceived,
        dailyData: Object.entries(dailyData)
          .map(([date, data]) => ({ date, ...data }))
          .sort((a, b) => a.date.localeCompare(b.date)),
      };
    },
    enabled: !!chatbotId,
  });

  return {
    analytics: analyticsQuery.data,
    isLoading: analyticsQuery.isLoading,
    error: analyticsQuery.error,
  };
}
