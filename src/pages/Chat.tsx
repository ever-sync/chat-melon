import { useEffect, useState, useMemo, useCallback } from "react";
import { MainLayout } from "@/components/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import ConversationList from "@/components/chat/ConversationList";
import MessageArea from "@/components/chat/MessageArea";
import ContactDetailPanel from "@/components/chat/ContactDetailPanel";
import { AIControlPanel } from "@/components/chat/AIControlPanel";

import { toast } from "sonner";
import { useNotifications } from "@/hooks/useNotifications";
import { useCompanyQuery } from "@/hooks/useCompanyQuery";
import { ChatFilters, getDefaultFilters } from "@/types/chatFilters";

export type Conversation = {
  id: string;
  contact_id?: string;
  contact_name: string;
  contact_number: string;
  profile_pic_url?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
  status?: string;
  sector_id?: string;
  assigned_to?: string;
  tags?: string[];
  opted_in?: boolean;
  is_online?: boolean;
};

const Chat = () => {
  const { withCompanyFilter, companyId } = useCompanyQuery();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState<ChatFilters>(() => {
    // Tenta restaurar filtros salvos do localStorage
    const saved = localStorage.getItem('chat-filters');
    return saved ? JSON.parse(saved) : getDefaultFilters();
  });

  // Salva filtros no localStorage quando mudam
  useEffect(() => {
    localStorage.setItem('chat-filters', JSON.stringify(filters));
  }, [filters]);

  const handleFilterChange = (newFilters: Partial<ChatFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setFilters(getDefaultFilters());
  };

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const loadConversations = useCallback(async () => {
    // Não carregar se não houver empresa selecionada
    if (!companyId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await withCompanyFilter(
        supabase
          .from("conversations")
          .select("*")
      ).order("last_message_time", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
      setFilteredConversations(data || []);
    } catch (error) {
      console.error("Erro ao carregar conversas:", error);
      toast.error("Não foi possível carregar as conversas");
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

  useEffect(() => {
    filterConversations();
  }, [searchQuery, startDate, endDate, conversations, filters]);

  const filterConversations = async () => {
    setIsSearching(true);
    let filtered = [...conversations];

    // Filtro por status (múltiplos)
    if (filters.status.length > 0) {
      filtered = filtered.filter(conv => filters.status.includes(conv.status || ''));
    }

    // Filtro por atribuição
    if (filters.assignedTo !== "all") {
      if (filters.assignedTo === "me") {
        filtered = filtered.filter(conv => conv.assigned_to === currentUserId);
      } else if (filters.assignedTo === "unassigned") {
        filtered = filtered.filter(conv => !conv.assigned_to);
      }
    }

    // Filtro por não lidas
    if (filters.hasUnread) {
      filtered = filtered.filter(conv => conv.unread_count > 0);
    }

    // Filtro por setor
    if (filters.sector) {
      filtered = filtered.filter(conv => conv.sector_id === filters.sector);
    }

    // Filtro por labels (múltiplas)
    if (filters.labels.length > 0) {
      try {
        const { data: conversationsWithLabel } = await supabase
          .from('conversation_labels')
          .select('conversation_id')
          .in('label_id', filters.labels);

        const conversationIdsWithLabel = conversationsWithLabel?.map(cl => cl.conversation_id) || [];
        filtered = filtered.filter(conv => conversationIdsWithLabel.includes(conv.id));
      } catch (error) {
        console.error('Erro ao filtrar por label:', error);
      }
    }

    // Filtro por data da última mensagem
    if (filters.lastMessageDate) {
      const now = new Date();
      let cutoffDate = now;

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

      filtered = filtered.filter(conv => {
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

      filtered = filtered.filter(conv => {
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

    setFilteredConversations(filtered);
    setIsSearching(false);
  };

  const conversationCounts = useMemo(() => {
    return {
      myAttendances: conversations.filter(c => c.assigned_to === currentUserId).length,
      unread: conversations.filter(c => c.unread_count > 0).length,
      waiting: conversations.filter(c => c.status === "waiting").length,
      reEntry: conversations.filter(c => c.status === "re_entry").length,
      active: conversations.filter(c => c.status === "active").length,
      chatbot: conversations.filter(c => c.status === "chatbot").length,
      closed: conversations.filter(c => c.status === "closed").length,
    };
  }, [conversations, currentUserId]);

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, search: query }));
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

  useEffect(() => {
    // Só criar subscription se houver empresa selecionada
    if (!companyId) return;

    const channel = supabase
      .channel("conversations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        (payload) => {
          console.log("Realtime: Conversation changed", payload);
          loadConversations();
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, loadConversations]);

  const handleSelectFromNotification = async (conversationId: string) => {
    if (!companyId) return;

    try {
      const { data, error } = await withCompanyFilter(
        supabase
          .from('conversations')
          .select('*')
      ).eq('id', conversationId).maybeSingle();

      if (error) throw error;
      if (data) {
        setSelectedConversation(data);
      }
    } catch (error) {
      console.error('Erro ao buscar conversa:', error);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-5rem)]">
        <div className="flex flex-1 overflow-hidden">
          <ConversationList
            conversations={filteredConversations}
            selectedConversation={selectedConversation}
            onSelectConversation={setSelectedConversation}
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
          />
          <MessageArea
            conversation={selectedConversation}
            onBack={() => setSelectedConversation(null)}
            searchQuery={searchQuery}
            onToggleDetailPanel={() => setShowDetailPanel(!showDetailPanel)}
            onToggleAIPanel={() => setShowAIPanel(!showAIPanel)}
            showAIPanel={showAIPanel}
          />
          {showAIPanel && selectedConversation && companyId && (
            <AIControlPanel
              conversationId={selectedConversation.id}
              contactId={selectedConversation.contact_id || ''}
              companyId={companyId}
            />
          )}
          {showDetailPanel && selectedConversation && (
            <ContactDetailPanel
              conversation={selectedConversation}
              onClose={() => setShowDetailPanel(false)}
              onConversationUpdated={loadConversations}
            />
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Chat;
