import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAssistantSettings } from './useAssistantSettings';
import { useAgentPerformance } from './useAgentPerformance';
import { useContextualSuggestions } from './useContextualSuggestions';
import { useConversationQuality } from './useConversationQuality';
import {
  AssistantState,
  AssistantTab,
  AssistantNotification,
  AssistantRealtimeEvent,
  MessageForAnalysis,
} from '@/types/ai-assistant';

interface UseAssistantMonitoringOptions {
  companyId?: string;
  currentConversationId?: string;
  enabled?: boolean;
}

export function useAssistantMonitoring({
  companyId,
  currentConversationId,
  enabled = true,
}: UseAssistantMonitoringOptions = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Estado do assistente
  const [state, setState] = useState<AssistantState>({
    isExpanded: false,
    activeTab: 'suggestions',
    isLoading: false,
    error: null,
    settings: null,
    unreadAlerts: 0,
  });

  // Notificações internas
  const [notifications, setNotifications] = useState<AssistantNotification[]>([]);
  const lastMessageTimeRef = useRef<Map<string, Date>>(new Map());

  // Hooks de dados
  const { settings, ensureSettings, isLoading: isLoadingSettings } = useAssistantSettings();
  const { currentSnapshot, comparison, isLoading: isLoadingSnapshot } = useAgentPerformance(user?.id);
  const {
    suggestions,
    allSuggestions,
    alerts,
    urgentAlerts,
    alertCount,
    generateSuggestions,
    isGenerating,
    isLoading: isLoadingSuggestions,
  } = useContextualSuggestions({
    conversationId: currentConversationId,
    companyId,
    enabled: enabled && !!settings?.is_enabled,
  });
  const { qualityScore, analyzeQuality, isAnalyzing } = useConversationQuality({
    conversationId: currentConversationId,
    agentId: user?.id,
    enabled: enabled && !!settings?.is_enabled,
  });

  // Atualizar settings no estado
  useEffect(() => {
    if (settings) {
      setState((prev) => ({ ...prev, settings }));
    }
  }, [settings]);

  // Atualizar contagem de alertas não lidos
  useEffect(() => {
    setState((prev) => ({ ...prev, unreadAlerts: alertCount }));
  }, [alertCount]);

  // Garantir que settings existam quando company_id estiver disponível
  useEffect(() => {
    if (companyId && !settings && !isLoadingSettings) {
      ensureSettings(companyId);
    }
  }, [companyId, settings, isLoadingSettings, ensureSettings]);

  // Toggle expandido/minimizado
  const toggleExpanded = useCallback(() => {
    setState((prev) => ({ ...prev, isExpanded: !prev.isExpanded }));
  }, []);

  // Mudar aba ativa
  const setActiveTab = useCallback((tab: AssistantTab) => {
    setState((prev) => ({ ...prev, activeTab: tab }));
    // Se abrir aba de alertas, limpar contagem de não lidos
    if (tab === 'alerts') {
      setState((prev) => ({ ...prev, unreadAlerts: 0 }));
    }
  }, []);

  // Adicionar notificação
  const addNotification = useCallback((notification: Omit<AssistantNotification, 'id' | 'created_at' | 'read'>) => {
    const newNotification: AssistantNotification = {
      ...notification,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotification, ...prev].slice(0, 50));
  }, []);

  // Monitoramento de novas mensagens para análise automática
  useEffect(() => {
    if (!user?.id || !settings?.is_enabled || !enabled) return;

    const channel = supabase
      .channel(`assistant-messages-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const message = payload.new as any;

          // Se é uma mensagem do cliente em uma conversa atribuída ao agente
          if (!message.is_from_me) {
            // Verificar se a conversa é do agente
            const { data: conversation } = await supabase
              .from('conversations')
              .select('id, assigned_to, contact_id, company_id')
              .eq('id', message.conversation_id)
              .eq('assigned_to', user.id)
              .maybeSingle();

            if (!conversation) return;

            // Marcar tempo da última mensagem para detectar espera longa
            lastMessageTimeRef.current.set(conversation.id, new Date());

            // Se tem sugestões automáticas habilitadas, gerar sugestões
            if (settings?.show_response_suggestions) {
              // Buscar últimas mensagens para contexto
              const { data: recentMessages } = await supabase
                .from('messages')
                .select('id, content, is_from_me, created_at')
                .eq('conversation_id', conversation.id)
                .order('created_at', { ascending: false })
                .limit(10);

              if (recentMessages && recentMessages.length > 0) {
                const messages: MessageForAnalysis[] = recentMessages
                  .reverse()
                  .map((m: any) => ({
                    id: m.id,
                    content: m.content || '',
                    sender_type: m.is_from_me ? 'agent' : 'contact',
                    created_at: m.created_at,
                  }));

                // Gerar sugestões (debounced internamente pela função)
                generateSuggestions({
                  conversationId: conversation.id,
                  companyId: conversation.company_id || companyId || '',
                  messages,
                  trigger: 'new_message',
                });
              }
            }
          }

          // Se é uma mensagem do agente, analisar qualidade
          if (message.is_from_me && message.sender_id === user.id) {
            if (settings.alert_quality_issues) {
              // Buscar mensagens para análise de qualidade
              const { data: recentMessages } = await supabase
                .from('messages')
                .select('id, content, is_from_me, created_at')
                .eq('conversation_id', message.conversation_id)
                .order('created_at', { ascending: false })
                .limit(15);

              if (recentMessages && recentMessages.length >= 3) {
                const messages: MessageForAnalysis[] = recentMessages
                  .reverse()
                  .map((m: any) => ({
                    id: m.id,
                    content: m.content || '',
                    sender_type: m.is_from_me ? 'agent' : 'contact',
                    created_at: m.created_at,
                  }));

                // Analisar qualidade
                analyzeQuality({
                  conversationId: message.conversation_id,
                  messages,
                  agentId: user.id,
                  companyId: companyId || '',
                });
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, settings, enabled, companyId, generateSuggestions, analyzeQuality]);

  // Detector de conversas esquecidas (tempo de espera longo)
  useEffect(() => {
    if (!user?.id || !settings?.is_enabled || !settings?.alert_forgotten_conversations) return;

    const checkInterval = setInterval(async () => {
      const threshold = settings.slow_response_threshold * 1000; // converter para ms

      for (const [conversationId, lastTime] of lastMessageTimeRef.current.entries()) {
        const waitTime = Date.now() - lastTime.getTime();

        if (waitTime > threshold) {
          // Verificar se já tem alerta para essa conversa
          const existingAlert = alerts.find(
            (a) => a.conversation_id === conversationId && a.type === 'alert'
          );

          if (!existingAlert) {
            // Gerar alerta de tempo de espera
            generateSuggestions({
              conversationId,
              companyId: companyId || '',
              messages: [],
              trigger: 'long_wait',
              context: {
                wait_time: Math.floor(waitTime / 1000),
              },
            });
          }
        }
      }
    }, 60 * 1000); // Verificar a cada minuto

    return () => clearInterval(checkInterval);
  }, [user?.id, settings, alerts, generateSuggestions]);

  // Limpar referências de mensagens antigas
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;

      for (const [conversationId, lastTime] of lastMessageTimeRef.current.entries()) {
        if (lastTime.getTime() < oneHourAgo) {
          lastMessageTimeRef.current.delete(conversationId);
        }
      }
    }, 5 * 60 * 1000); // A cada 5 minutos

    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    // Estado do assistente
    state,
    setState,
    isExpanded: state.isExpanded,
    activeTab: state.activeTab,
    toggleExpanded,
    setActiveTab,

    // Settings
    settings,
    isLoadingSettings,

    // Performance
    currentSnapshot,
    comparison,

    // Sugestões
    suggestions,
    allSuggestions,
    alerts,
    urgentAlerts,
    alertCount,
    isGenerating,

    // Qualidade
    qualityScore,
    isAnalyzing,

    // Notificações
    notifications,
    addNotification,

    // Status geral
    isEnabled: settings?.is_enabled ?? true,
    isLoading: isLoadingSettings || isGenerating || isAnalyzing || isLoadingSuggestions || isLoadingSnapshot,
  };
}

// Context para compartilhar estado do assistente
import { createContext, useContext, ReactNode } from 'react';

interface AssistantContextValue extends ReturnType<typeof useAssistantMonitoring> { }

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function AssistantProvider({
  children,
  companyId,
  currentConversationId,
}: {
  children: ReactNode;
  companyId?: string;
  currentConversationId?: string;
}) {
  const assistant = useAssistantMonitoring({
    companyId,
    currentConversationId,
  });

  return (
    <AssistantContext.Provider value={assistant}>
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error('useAssistant must be used within an AssistantProvider');
  }
  return context;
}
