import { useEffect, useState, useMemo, useCallback } from 'react';
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

import type { Conversation } from '@/types/chat';
import { cn } from '@/lib/utils';


const Chat = () => {
  const { withCompanyFilter, companyId } = useCompanyQuery();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
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

  const loadConversations = useCallback(async () => {
    // Não carregar se não houver empresa selecionada
    if (!companyId) {
      console.log('❌ Chat: Nenhuma empresa selecionada (companyId is null/undefined)');
      setIsLoading(false);
      setConversations([]);
      setFilteredConversations([]);
      return;
    }

    console.log('🔄 Chat: Carregando conversas para empresa:', companyId);

    try {
      const { data, error } = await withCompanyFilter(
        supabase.from('conversations').select(`
            *,
            contacts!left (
              profile_pic_url
            )
          `)
      )
        .neq('status', 'closed') // Ocultar conversas encerradas
        .order('last_message_time', { ascending: false });

      if (error) {
        console.error('❌ Chat: Erro na query:', error);
        throw error;
      }

      console.log(`✅ Chat: ${data?.length || 0} conversas carregadas`);
      console.log('📊 Chat: Primeiras 3 conversas:', data?.slice(0, 3));

      // Debug adicional
      if (data && data.length === 0) {
        console.log('⚠️ Chat: Nenhuma conversa retornada. Verificando se existem mensagens...');

        // Verificar quantas mensagens existem
        const { data: messages, error: msgError } = await supabase
          .from('messages')
          .select('conversation_id, company_id', { count: 'exact' })
          .eq('company_id', companyId)
          .limit(5);

        console.log('📨 Chat: Mensagens encontradas:', messages?.length, msgError);
        console.log('📨 Chat: Exemplos de conversation_ids:', messages?.map(m => m.conversation_id));

        // Verificar se existem conversas criadas
        const { data: allConvs, error: convError } = await supabase
          .from('conversations')
          .select('id, company_id, contact_name')
          .eq('company_id', companyId)
          .limit(5);

        console.log('💬 Chat: Conversas no banco:', allConvs?.length, convError);
        console.log('💬 Chat: Exemplos de conversas:', allConvs);
      }

      // Mesclar profile_pic_url do contact na conversation
      const conversationsWithPhotos = (data || []).map((conv: any) => ({
        ...conv,
        profile_pic_url: conv.contacts?.profile_pic_url || conv.profile_pic_url,
      }));

      setConversations(conversationsWithPhotos || []);
      setFilteredConversations(conversationsWithPhotos || []);
    } catch (error) {
      console.error('❌ Chat: Erro ao carregar conversas:', error);
      toast.error('Não foi possível carregar as conversas');
    } finally {
      setIsLoading(false);
    }
  }, [companyId, withCompanyFilter]);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  // Recarregar conversas quando empresa mudar
  useEffect(() => {
    if (companyId) {
      loadConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]); // Only depend on companyId, loadConversations is already memoized

  // Realtime subscription for conversations
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
        (payload) => {
          console.log('Realtime: New conversation', payload);
          const newConv = payload.new as Conversation;
          // Só adicionar se não estiver fechada
          if (newConv.status !== 'closed') {
            setConversations((prev) => [newConv, ...prev]);
          }
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
        (payload) => {
          console.log('Realtime: Conversation updated', payload);
          const updatedConv = payload.new as Conversation;

          setConversations((prev) => {
            // Se foi fechada, remover da lista
            if (updatedConv.status === 'closed') {
              return prev.filter((conv) => conv.id !== updatedConv.id);
            }

            // Se foi reaberta ou atualizada, atualizar na lista
            const exists = prev.find((conv) => conv.id === updatedConv.id);
            if (exists) {
              return prev.map((conv) => (conv.id === updatedConv.id ? updatedConv : conv));
            } else {
              // Se não existe e não está fechada, adicionar (foi reaberta)
              return [updatedConv, ...prev];
            }
          });
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
        (payload) => {
          console.log('Realtime: Conversation deleted', payload);
          setConversations((prev) => prev.filter((conv) => conv.id !== payload.old.id));
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
  }, [companyId]);

  useEffect(() => {
    filterConversations();
  }, [searchQuery, startDate, endDate, conversations, filters]);

  const filterConversations = async () => {
    setIsSearching(true);
    let filtered = [...conversations];

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
    if (filters.labels.length > 0) {
      try {
        const { data: conversationsWithLabel } = await supabase
          .from('conversation_labels')
          .select('conversation_id')
          .in('label_id', filters.labels);

        const conversationIdsWithLabel =
          conversationsWithLabel?.map((cl) => cl.conversation_id) || [];
        filtered = filtered.filter((conv) => conversationIdsWithLabel.includes(conv.id));
      } catch (error) {
        console.error('Erro ao filtrar por label:', error);
      }
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
    if (startDate || endDate) {
      filtered = filtered.filter((conv) => {
        if (!conv.last_message_time) return false;
        const messageDate = new Date(conv.last_message_time);

        if (startDate && messageDate < startDate) return false;
        if (endDate) {
          const endOfDay = new Date(endDate);
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
    if (filters.mediaType && filters.mediaType !== 'all' && filters.hasMedia === true) {
      try {
        const conversationIds = filtered.map((c) => c.id);
        const { data: conversationsWithMediaType } = await supabase
          .from('messages')
          .select('conversation_id')
          .in('conversation_id', conversationIds)
          .like('media_type', `%${filters.mediaType}%`)
          .not('media_type', 'is', null);

        const conversationIdsWithMedia =
          conversationsWithMediaType?.map((m) => m.conversation_id) || [];

        // Remover duplicatas
        const uniqueIds = Array.from(new Set(conversationIdsWithMedia));
        filtered = filtered.filter((conv) => uniqueIds.includes(conv.id));
      } catch (error) {
        console.error('Erro ao filtrar por tipo de mídia:', error);
      }
    }

    setFilteredConversations(filtered);
    setIsSearching(false);
  };

  const conversationCounts = useMemo(() => {
    return {
      myAttendances: conversations.filter((c) => c.assigned_to === currentUserId).length,
      unread: conversations.filter((c) => c.unread_count > 0).length,
      waiting: conversations.filter((c) => c.status === 'waiting').length,
      reEntry: conversations.filter((c) => c.status === 're_entry').length,
      active: conversations.filter((c) => c.status === 'active').length,
      chatbot: conversations.filter((c) => c.status === 'chatbot').length,
      closed: conversations.filter((c) => c.status === 'closed').length,
    };
  }, [conversations, currentUserId]);

  const handleSearch = (query: string) => {
    setFilters((prev) => ({ ...prev, search: query }));
    setSearchQuery(query);
  };

  const handleDateFilter = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
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
            status: conversation.status === 'waiting' ? 'active' : conversation.status,
            unread_count: 0, // Zerar contador de não lidas
          })
          .eq('id', conversation.id);

        if (error) throw error;

        // Atualizar localmente
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversation.id
              ? {
                ...c,
                status: c.status === 'waiting' ? 'active' : c.status,
                unread_count: 0,
              }
              : c
          )
        );
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
            "w-full md:w-80 flex-shrink-0 border-r border-border bg-card flex flex-col overflow-hidden",
            selectedConversation ? "hidden md:flex" : "flex"
          )}>
            <ConversationList
              conversations={filteredConversations}
              selectedConversation={selectedConversation}
              onSelectConversation={handleSelectConversation}
              isLoading={isLoading}
              searchQuery={searchQuery}
              startDate={startDate}
              endDate={endDate}
              onSearch={handleSearch}
              onDateFilter={handleDateFilter}
              isSearching={isSearching}
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearAllFilters={handleClearFilters}
              conversationCounts={conversationCounts}
              onSelectConversationFromNotification={handleSelectFromNotification}
              isSelectionMode={isSelectionMode}
              onToggleSelectionMode={toggleSelectionMode}
              onToggleSelection={toggleSelection}
              isSelected={isSelected}
              onSelectAll={() => selectAll(filteredConversations.map((c) => c.id))}
              snoozedBadge={
                <SnoozedConversationsBadge onSelectConversation={handleSelectFromNotification} />
              }
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
                  onConversationUpdated={loadConversations}
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
