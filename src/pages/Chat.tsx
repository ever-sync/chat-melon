import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import ConversationList from '@/components/chat/sidebar/ConversationList';
import MessageArea from '@/components/chat/messages/MessageArea';
import ContactDetailPanel from '@/components/chat/ContactDetailPanel';
import { AIControlPanel } from '@/components/chat/AIControlPanel';
import { AIAssistant } from '@/components/chat/AIAssistant';
import { BulkActionsToolbar } from '@/components/chat/BulkActionsToolbar';
import { SnoozedConversationsBadge } from '@/components/chat/sidebar/SnoozedConversationsBadge';
import { ConversationActions } from '@/components/chat/ConversationActions';
import { FloatingAssistantWrapper } from '@/components/ai-assistant/FloatingAssistant';

import { toast } from 'sonner';
import { useNotifications } from '@/hooks/ui/useNotifications';
import { useCompanyQuery } from '@/hooks/crm/useCompanyQuery';
import { ChatFilters, getDefaultFilters } from '@/types/chatFilters';
import { useBulkConversationActions } from '@/hooks/chat/useBulkConversationActions';
import { useMyQueues } from '@/hooks/useQueues';
import { usePaginatedQuery } from '@/hooks/ui/usePaginatedQuery';
import { PAGINATION } from '@/config/constants';
import { useCachedQuery } from '@/hooks/ui/useCachedQuery';
import { CACHE_TAGS } from '@/lib/cache/cache-strategies';
import { useConversationCounts } from '@/hooks/chat/useConversationCounts';

import type { Conversation } from '@/types/chat';
import { cn } from '@/lib/utils';


const Chat = () => {
  const [searchParams] = useSearchParams();
  const initialConversationId = searchParams.get('conversationId');
  const { withCompanyFilter, companyId } = useCompanyQuery();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showCopilotPanel, setShowCopilotPanel] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState<ChatFilters>(() => {
    // Tenta restaurar filtros salvos do localStorage
    const saved = localStorage.getItem('chat-filters');
    return saved ? JSON.parse(saved) : getDefaultFilters();
  });

  // Bulk actions hook
  const {
    selectedIds,
    isSelectionMode,
    toggleSelectionMode,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
  } = useBulkConversationActions();

  // Fetch counts
  const { data: realCounts } = useConversationCounts(currentUserId);

  // Fetch queues I am a member of
  const { myQueueIds } = useMyQueues(currentUserId);


  // Salva filtros no localStorage quando mudam
  useEffect(() => {
    localStorage.setItem('chat-filters', JSON.stringify(filters));
  }, [filters]);

  const handleFilterChange = (newFilters: Partial<ChatFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setFilters(getDefaultFilters());
  };

  const loadCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  // Paginação de conversas
  const conversationsQuery = usePaginatedQuery<Conversation>({
    queryKey: ['conversations', companyId, filters],
    queryFn: async ({ page, limit, offset }) => {
    if (!companyId) {
        return { data: [], count: 0 };
      }

      let query = withCompanyFilter(
        supabase
          .from('conversations')
          .select(
            `
            *,
            contacts!left (
              profile_pic_url
            )
          `,
            { count: 'exact' }
          )
      );
      
      // Aplicar ordenação e paginação
      query = query.order('last_message_time', { ascending: false })
        .range(offset, offset + limit - 1);

      // Aplicar filtros de VIEW (Abas principais)
      if (filters.view === 'inbox') {
        // Inbox: mensagens nao lidas
        // NOTA: A definição de Inbox pode variar. Aqui estamos seguindo a definição do usuário:
        // "são mensagens que acabaram de chegar e nao foram lidas e estao em atendimento"
        query = query.gt('unread_count', 0).neq('status', 'closed');
      } 
      else if (filters.view === 'atendimento') {
        // Atendimento: em andamento e atribuído
        query = query.eq('status', 'active').not('assigned_to', 'is', null).eq('ai_enabled', false);
      }
      else if (filters.view === 'aguardando') {
        // Aguardando: na fila (waiting ou re_entry) e sem atendente
        query = query.in('status', ['waiting', 're_entry']).is('assigned_to', null);
      }
      else if (filters.view === 'bot') {
        // No Bot: status chatbot e não IA
        query = query.eq('status', 'chatbot').eq('ai_enabled', false);
      }
      else if (filters.view === 'ia') {
        // IA: ai_enabled = true (clientes conversando com IA)
        query = query.eq('ai_enabled', true);
      }
      else if (filters.view === 'groups') {
        // Grupos: termina com @g.us
        query = query.ilike('contact_number', '%@g.us');
      }

      if (filters.channelType && filters.channelType !== 'all') {
        query = query.eq('channel_type', filters.channelType);
      }

      if (filters.assignedTo === 'me' && currentUserId) {
        // Show assigned to me, OR (unassigned AND in my queues)
        if (myQueueIds.length > 0) {
           query = query.or(`assigned_to.eq.${currentUserId},and(assigned_to.is.null,queue_id.in.(${myQueueIds.join(',')}))`);
        } else {
           query = query.eq('assigned_to', currentUserId);
        }
      } else if (filters.assignedTo === 'unassigned') {
        query = query.is('assigned_to', null);
      }

      if (filters.hasUnread) {
        query = query.gt('unread_count', 0);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Chat: Erro na query:', error);
        throw error;
      }

      // Mesclar profile_pic_url do contact na conversation
      const conversationsWithPhotos = (data || []).map((conv: any) => ({
        ...conv,
        profile_pic_url: conv.contacts?.profile_pic_url || conv.profile_pic_url,
      }));

      return {
        data: conversationsWithPhotos,
        count: count || 0,
      };
    },
    enabled: !!companyId,
    pageSize: PAGINATION.LIST_PAGE_SIZE,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  const conversations = conversationsQuery.data || [];
  const isLoading = conversationsQuery.isLoading;

  useEffect(() => {
    loadCurrentUser();
  }, []);

  // Seleciona conversa inicial da URL
  useEffect(() => {
    if (initialConversationId && conversations.length > 0) {
      const target = conversations.find(c => c.id === initialConversationId);
      if (target) {
        setSelectedConversation(target);
      }
    }
  }, [initialConversationId, conversations]);

  // Sincroniza conversa selecionada com dados atualizados da lista (Realtime/Otimista)
  useEffect(() => {
    if (selectedConversation && conversations.length > 0) {
      const updated = conversations.find(c => c.id === selectedConversation.id);
      if (updated && (
        updated.assigned_to !== selectedConversation.assigned_to || 
        updated.status !== selectedConversation.status ||
        updated.unread_count !== selectedConversation.unread_count ||
        updated.ai_enabled !== selectedConversation.ai_enabled
      )) {
        setSelectedConversation(updated);
      }
    }
  }, [conversations, selectedConversation]);

  // Realtime subscription for conversations
  // Com paginação, o realtime apenas invalida a query para recarregar
  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel(`conversations-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          console.log('Realtime: New conversation - invalidating query');
          // Invalidar query para recarregar (mantém página atual se for nova conversa)
          conversationsQuery.refetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          console.log('Realtime: Conversation updated - invalidating query');
          conversationsQuery.refetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'conversations',
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          console.log('Realtime: Conversation deleted - invalidating query');
          conversationsQuery.refetch();
        }
      )
      .subscribe((status) => {
        console.log('Realtime conversations status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime conversations conectado!');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, conversationsQuery]);

  // Filtrar conversas no cliente (para filtros complexos que não podem ser feitos no servidor)
  useEffect(() => {
    setIsSearching(true);
    // Simular processamento de filtros
    const timer = setTimeout(() => setIsSearching(false), 100);
    return () => clearTimeout(timer);
  }, [conversations, filters, searchQuery]);

  const filteredConversations = useMemo(() => {
    let filtered = [...conversations];

    // Filtro por "view" (Abas principais) - Garante transição instantânea no client
    if (filters.view === 'inbox') {
      filtered = filtered.filter(c => c.unread_count > 0 && c.status !== 'closed');
    } else if (filters.view === 'atendimento') {
      filtered = filtered.filter(c => c.status === 'active' && c.assigned_to !== null && c.ai_enabled === false);
    } else if (filters.view === 'aguardando') {
      filtered = filtered.filter(c => (c.status === 'waiting' || c.status === 're_entry') && c.assigned_to === null);
    } else if (filters.view === 'bot') {
      filtered = filtered.filter(c => c.status === 'chatbot' && c.ai_enabled === false);
    } else if (filters.view === 'ia') {
      filtered = filtered.filter(c => c.ai_enabled === true);
    } else if (filters.view === 'groups') {
      filtered = filtered.filter(c => c.contact_number && c.contact_number.endsWith('@g.us'));
    }

    // Filtro por status (múltiplos)
    if (filters.status.length > 0) {
      filtered = filtered.filter((conv) => filters.status.includes(conv.status || ''));
    }

    // Filtro por atribuição
    if (filters.assignedTo !== 'all') {
      if (filters.assignedTo === 'me') {
        filtered = filtered.filter((conv) => conv.assigned_to === currentUserId);
      } else if (filters.assignedTo === 'unassigned') {
        filtered = filtered.filter((conv) => !conv.assigned_to);
      }
    }

    // Filtro por não lidas
    if (filters.hasUnread) {
      filtered = filtered.filter((conv) => conv.unread_count > 0);
    }

    // Filtro por setor
    if (filters.sector) {
      filtered = filtered.filter((conv) => conv.sector_id === filters.sector);
    }

    // Filtro por labels (múltiplas)
    // Note: This filter would need to be implemented server-side for better performance
    // For now, we skip this filter in the client-side filtering
    // TODO: Implement label filtering in the server query
    if (filters.labels.length > 0) {
      // Labels filtering should be done server-side
      console.warn('Label filtering is not implemented in client-side filtering');
    }

    // Filtro por data da última mensagem
    if (filters.lastMessageDate) {
      const now = new Date();
      const cutoffDate = now;

      switch (filters.lastMessageDate) {
        case 'today':
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case 'yesterday':
          cutoffDate.setDate(cutoffDate.getDate() - 1);
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoffDate.setDate(cutoffDate.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(cutoffDate.getMonth() - 1);
          break;
      }

      filtered = filtered.filter((conv) => {
        if (!conv.last_message_time) return false;
        return new Date(conv.last_message_time) >= cutoffDate;
      });
    }

    // Filtro por tempo sem resposta
    if (filters.noResponseTime) {
      const now = new Date();
      const hourLimits = { '1h': 1, '4h': 4, '24h': 24, '48h': 48 };
      const hoursAgo = hourLimits[filters.noResponseTime];
      const cutoff = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

      filtered = filtered.filter((conv) => {
        if (!conv.last_message_time) return false;
        return new Date(conv.last_message_time) < cutoff;
      });
    }

    // Filtro por busca de texto
    if (filters.search.trim()) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(
        (conv) =>
          conv.contact_name.toLowerCase().includes(query) ||
          conv.contact_number.toLowerCase().includes(query) ||
          (conv.last_message?.toLowerCase().includes(query) ?? false)
      );
    }

    // Filtro por data customizada (se existir)
    if (filters.dateRange) {
      filtered = filtered.filter((conv) => {
        if (!conv.last_message_time) return false;
        const messageDate = new Date(conv.last_message_time);

        if (filters.dateRange?.start && messageDate < filters.dateRange.start) return false;
        if (filters.dateRange?.end) {
          const endOfDay = new Date(filters.dateRange.end);
          endOfDay.setHours(23, 59, 59, 999);
          if (messageDate > endOfDay) return false;
        }

        return true;
      });
    }

    // Novos filtros avançados

    // Filtro por canal de comunicação
    if (filters.channelType && filters.channelType !== 'all') {
      filtered = filtered.filter((conv) => conv.channel_type === filters.channelType);
    }

    // Filtro por status online do contato
    if (filters.contactOnline === true) {
      filtered = filtered.filter((conv) => conv.is_online === true);
    }

    // Filtro por opt-in
    if (filters.optedIn === true) {
      filtered = filtered.filter((conv) => conv.opted_in === true);
    }

    // Filtro por tabulação
    if (filters.hasTabulation === true) {
      filtered = filtered.filter((conv) => !!conv.tabulation_id);
    }

    // Filtro por tempo de atribuição
    if (filters.assignedTime && filters.assignedTime !== 'all') {
      const now = new Date();
      const hourLimits = { '1h': 1, '4h': 4, '24h': 24, '48h': 48, 'week': 168 };
      const hours = hourLimits[filters.assignedTime];
      const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);

      filtered = filtered.filter((conv) => {
        if (!conv.assigned_at) return false;
        return new Date(conv.assigned_at) >= cutoff;
      });
    }

    // Filtro por tipo de mídia (requer consulta ao banco)
    // Note: This filter would need to be implemented server-side for better performance
    // For now, we skip this filter in the client-side filtering
    // TODO: Implement media type filtering in the server query
    if (filters.mediaType && filters.mediaType !== 'all' && filters.hasMedia === true) {
      // Media type filtering should be done server-side
      console.warn('Media type filtering is not implemented in client-side filtering');
    }
    return filtered;
  }, [conversations, filters, searchQuery, currentUserId]);

  interface ConversationCounts {
    inbox: number;
    atendimento: number;
    waiting: number;
    reEntry: number;
    active: number;
    chatbot: number;
    closed: number;
    myAttendances: number;
    unread: number;
  }

  // Usar contagens reais do hook useConversationCounts
  const conversationCounts = useMemo(() => {
    const counts = realCounts || {
      inbox: 0,
      total: 0,
      atendimento: 0,
      aguardando: 0,
      bot: 0,
      ia: 0,
      groups: 0,
      mine: 0,
      unassigned: 0,
    };

    // Mapeamento para garantir compatibilidade com todos os componentes (ConversationList, QuickStatusFilters)
    return {
      ...counts,
      myAttendances: counts.mine,
      unread: counts.inbox,
      waiting: counts.aguardando,
      reEntry: 0, // Aguardando engloba os dois no hook
      active: counts.atendimento,
      chatbot: counts.bot,
      closed: 0,
    };
  }, [realCounts]);

  const handleSearch = (query: string) => {
    setFilters((prev) => ({ ...prev, search: query }));
    setSearchQuery(query);
  };

  const handleDateFilter = (start: Date | null, end: Date | null) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: start && end ? { start, end } : null,
    }));
  };

  // Atualizar badge sempre que conversas mudarem
  useEffect(() => {
    const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
    // Badge count atualizado automaticamente pelo sistema de notificações
  }, [conversations]);

  // Limpar badge quando o usuário estiver visualizando a página
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && selectedConversation) {
        // Atualizar contagem ao voltar para a página
        const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
        // Badge atualizado automaticamente
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [selectedConversation, conversations]);

  // Subscription já existe acima (linhas 170-244), removendo duplicação

  const handleSelectFromNotification = async (conversationId: string) => {
    if (!companyId) return;

    try {
      const { data, error } = await withCompanyFilter(supabase.from('conversations').select('*'))
        .eq('id', conversationId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        handleSelectConversation(data);
      }
    } catch (error) {
      console.error('Erro ao buscar conversa:', error);
    }
  };

  // Função para selecionar conversa e marcar como lida
  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);

    // Marcar como lida se tiver mensagens não lidas
    if (conversation.unread_count > 0 || conversation.status === 'waiting') {
      try {
        const { error } = await supabase
          .from('conversations')
          .update({
            status: (conversation.status === 'waiting' ? 'active' : conversation.status) as any,
            unread_count: 0, // Zerar contador de não lidas
          })
          .eq('id', conversation.id);

        if (error) throw error;

        // Invalidar query para recarregar dados atualizados
        conversationsQuery.refetch();
        
        // Atualizar conversa selecionada localmente
        setSelectedConversation((prev) =>
          prev
            ? {
              ...prev,
              status: prev.status === 'waiting' ? 'active' : prev.status,
              unread_count: 0,
            }
            : prev
        );
      } catch (error) {
        console.error('Erro ao marcar conversa como lida:', error);
      }
    }
  };

  // Get available labels for bulk actions
  const availableLabels = useMemo(() => {
    const labels = new Set<string>();
    conversations.forEach((c) => {
      c.tags?.forEach((tag) => labels.add(tag));
    });
    return Array.from(labels);
  }, [conversations]);



  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        {/* Bulk Actions Toolbar - appears when conversations are selected */}
        {selectedIds.size > 0 && (
          <BulkActionsToolbar
            selectedIds={selectedIds}
            onClearSelection={clearSelection}
            availableLabels={availableLabels}
          />
        )}

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Sidebar de Conversas */}
          <aside className={cn(
            "w-full md:w-96 flex-shrink-0 border-r border-border bg-card flex flex-col overflow-hidden",
            selectedConversation ? "hidden md:flex" : "flex"
          )}>
            <ConversationList
              conversations={filteredConversations}
              selectedConversation={selectedConversation}
              onSelectConversation={handleSelectConversation}
              isLoading={isLoading}
              searchQuery={searchQuery}
              onSearch={handleSearch}
              isSearching={isSearching}
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearAllFilters={handleClearFilters}
              conversationCounts={conversationCounts}
              userId={currentUserId}
              onSelectConversationFromNotification={handleSelectFromNotification}
              isSelectionMode={isSelectionMode}
              onToggleSelectionMode={toggleSelectionMode}
              onToggleSelection={toggleSelection}
              isSelected={isSelected}
              onSelectAll={() => selectAll(filteredConversations.map((c) => c.id))}
              snoozedBadge={
                <SnoozedConversationsBadge onSelectConversation={handleSelectFromNotification} />
              }
              pagination={{
                page: conversationsQuery.page,
                pageSize: conversationsQuery.pageSize,
                total: conversationsQuery.total,
                totalPages: conversationsQuery.totalPages,
                hasNext: conversationsQuery.hasNext,
                hasPrev: conversationsQuery.hasPrev,
                onPageChange: conversationsQuery.goToPage,
                onPageSizeChange: conversationsQuery.setPageSize,
              }}
            />
          </aside>

          {/* Área Principal de Mensagens */}
          <main className={cn(
            "flex-1 flex flex-col min-w-0 bg-background overflow-hidden",
            !selectedConversation ? "hidden md:flex" : "flex"
          )}>
            <MessageArea
              conversation={selectedConversation}
              onBack={() => setSelectedConversation(null)}
              searchQuery={searchQuery}
              onToggleDetailPanel={() => setShowDetailPanel(!showDetailPanel)}
              onToggleAIPanel={() => setShowAIPanel(!showAIPanel)}
              showAIPanel={showAIPanel}
              onCopilotToggle={(enabled) => {
                // Exclusividade mútua: fechar painel Elisa quando Copiloto é ativado
                if (enabled && showAIPanel) {
                  setShowAIPanel(false);
                }
                setShowCopilotPanel(enabled);
              }}
              onConversationUpdated={(updates) => {
                setSelectedConversation(prev => prev ? { ...prev, ...updates } : null);
              }}
            />
          </main>

          {/* AI Control Panel */}
          {showAIPanel && selectedConversation && companyId && (
            <aside className="hidden lg:flex w-80 flex-shrink-0 border-l border-border bg-card flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                <AIControlPanel
                  conversationId={selectedConversation.id}
                  contactId={selectedConversation.contact_id || ''}
                  companyId={companyId}
                />
              </div>
            </aside>
          )}

          {/* Contact Detail Panel */}
          {showDetailPanel && selectedConversation && (
            <aside className="hidden xl:flex w-96 flex-shrink-0 border-l border-border bg-card flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                <ContactDetailPanel
                  conversation={selectedConversation}
                  onClose={() => setShowDetailPanel(false)}
                  onConversationUpdated={() => conversationsQuery.refetch()}
                />
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Assistente IA Flutuante - Portal fora do MainLayout */}
      {companyId && (
        <FloatingAssistantWrapper
          companyId={companyId}
          currentConversationId={selectedConversation?.id}
        />
      )}
    </MainLayout>
  );
};

export default Chat;
