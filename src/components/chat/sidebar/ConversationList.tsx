import { MessageSquarePlus, CheckSquare, Square, CheckCheck, AlarmClock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ContactAvatar } from '@/components/ContactAvatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types/chat';
import NewConversationDialog from '@/components/chat/dialogs/NewConversationDialog';
import SearchBar from './SearchBar';
import { AdvancedFiltersDialog } from '@/components/chat/dialogs/AdvancedFiltersDialog';
import { ChatFilters } from '@/types/chatFilters';
import { ChatFiltersBar } from './ChatFiltersBar';
import { QuickStatusFilters } from './QuickStatusFilters';
import { useState, useEffect, useCallback, ReactNode } from 'react';
import { LabelBadge } from '@/components/chat/LabelBadge';
import { SatisfactionBadge } from '@/components/chat/SatisfactionBadge';
import { useCompany } from '@/contexts/CompanyContext';
import { ChannelIcon } from '@/components/chat/ChannelIcon';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { useConversationCounts } from '@/hooks/chat/useConversationCounts';

type ConversationListProps = {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  isLoading: boolean;
  searchQuery: string;
  onSearch: (query: string) => void;
  isSearching?: boolean;
  filters: ChatFilters;
  onFilterChange: (filters: Partial<ChatFilters>) => void;
  onClearAllFilters: () => void;
  conversationCounts: {
    myAttendances: number;
    unread: number;
    waiting: number;
    reEntry: number;
    active: number;
    chatbot: number;
    closed: number;
  };
  userId?: string | null;
  onSelectConversationFromNotification?: (conversationId: string) => void;
  // Selection mode props
  isSelectionMode?: boolean;
  onToggleSelectionMode?: () => void;
  onToggleSelection?: (conversationId: string) => void;
  isSelected?: (conversationId: string) => boolean;
  onSelectAll?: () => void;
  snoozedBadge?: ReactNode;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
  };
};

const ConversationList = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  isLoading,
  searchQuery,
  onSearch,
  isSearching,
  filters,
  onFilterChange,
  onClearAllFilters,
  conversationCounts,
  userId,
  onSelectConversationFromNotification,
  isSelectionMode = false,
  onToggleSelectionMode,
  onToggleSelection,
  isSelected,
  onSelectAll,
  snoozedBadge,
  pagination,
}: ConversationListProps) => {
  const { currentCompany } = useCompany();
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [conversationLabels, setConversationLabels] = useState<
    Record<string, Array<{ id: string; name: string; color: string; icon?: string }>>
  >({});
  const [conversationSatisfaction, setConversationSatisfaction] = useState<
    Record<string, { score: number; survey_type: 'csat' | 'nps' }>
  >({});
  const [labels, setLabels] = useState<
    Array<{ id: string; name: string; color: string; icon?: string | null }>
  >([]);

  // Buscar contadores reais do banco de dados (passando userId para contagem correta das 'minhas')
  const { data: realCounts, isLoading: isLoadingCounts, error: countsError } = useConversationCounts(userId);

  // Debug: log dos contadores
  useEffect(() => {
    console.log('🎯 ConversationList - realCounts:', realCounts);
    console.log('🎯 ConversationList - isLoadingCounts:', isLoadingCounts);
    console.log('🎯 ConversationList - countsError:', countsError);
  }, [realCounts, isLoadingCounts, countsError]);

  // Carregar labels das conversas
  useEffect(() => {
    if (conversations.length > 0 && currentCompany?.id) {
      loadConversationLabels();
    }
  }, [conversations.length, currentCompany?.id]); // Use .length to avoid infinite loop

  // Carregar labels disponíveis
  useEffect(() => {
    loadLabels();
  }, [currentCompany?.id]);

  const loadLabels = async () => {
    if (!currentCompany?.id) return;

    try {
      const { data, error } = await supabase
        .from('labels')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('name');

      if (error) throw error;
      setLabels(data || []);
    } catch (error) {
      console.error('Erro ao carregar labels:', error);
    }
  };

  const loadConversationLabels = useCallback(async () => {
    try {
      const conversationIds = conversations.map((c) => c.id);
      const { data, error } = await supabase
        .from('conversation_labels')
        .select(
          `
          conversation_id,
          labels (id, name, color, icon)
        `
        )
        .in('conversation_id', conversationIds);

      if (error) throw error;

      const labelsMap: Record<
        string,
        Array<{ id: string; name: string; color: string; icon?: string }>
      > = {};
      data?.forEach((item: any) => {
        if (!labelsMap[item.conversation_id]) {
          labelsMap[item.conversation_id] = [];
        }
        if (item.labels) {
          labelsMap[item.conversation_id].push(item.labels);
        }
      });

      setConversationLabels(labelsMap);
    } catch (error) {
      console.error('Erro ao carregar labels:', error);
    }
  }, [conversations]);

  const loadConversationSatisfaction = async () => {
    try {
      const conversationIds = conversations.map((c) => c.id);

      const { data, error } = await supabase
        .from('satisfaction_surveys')
        .select('conversation_id, score, survey_type')
        .in('conversation_id', conversationIds)
        .eq('status', 'answered')
        .not('score', 'is', null);

      if (error) throw error;

      const satisfactionMap: Record<string, { score: number; survey_type: 'csat' | 'nps' }> = {};
      data?.forEach((survey: any) => {
        satisfactionMap[survey.conversation_id] = {
          score: survey.score,
          survey_type: survey.survey_type as 'csat' | 'nps',
        };
      });

      setConversationSatisfaction(satisfactionMap);
    } catch (error) {
      console.error('Erro ao carregar satisfação:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 24) {
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const getStatusBadge = (conversation: Conversation) => {
    const { status, unread_count: unreadCount } = conversation;

    // Se tem mensagens não lidas, mostrar badge "Não Lido"
    if (unreadCount > 0) {
      return (
        <Badge variant="secondary" className="text-xs">
          Não Lido
        </Badge>
      );
    }

    // Caso contrário, mostrar badge de status normal
    if (!status) return null;

    const isSnoozed = conversation.snoozed_until && new Date(conversation.snoozed_until) > new Date();

    const statusConfig = {
      re_entry: { label: 'Reentrada', variant: 'default' as const },
      chatbot: { label: 'ChatBot', variant: 'outline' as const },
      closed: { label: 'Encerrado', variant: 'secondary' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    
    // Prioridade para o badge de adiado se estiver ativo
    if (isSnoozed) {
      return (
        <Badge variant="outline" className="text-xs border-amber-500 text-amber-600 bg-amber-50 gap-1">
          <AlarmClock className="h-3 w-3" />
          Adiada
        </Badge>
      );
    }

    if (!config || status === 'active') return null;

    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  // Filtragem agora é feita no servidor via filters.view em Chat.tsx
  // Mas mantemos a lógica de "minhas" e "não atribuídas" nos filtros avançados ou abas abaixo
  
  // Usar contadores reais do banco ou fallback para contadores locais
  const quickModeCounts = realCounts || {
    inbox: conversations.filter(c => c.unread_count > 0 && c.status !== 'closed').length,
    total: conversations.length,
    atendimento: conversations.filter(c => c.assigned_to && c.status !== 'chatbot' && !c.ai_enabled).length,
    aguardando: conversations.filter(c => (c.status === 'waiting' || c.status === 're_entry') && !c.assigned_to).length,
    bot: conversations.filter(c => c.status === 'chatbot' && !c.ai_enabled).length,
    ia: conversations.filter(c => c.ai_enabled === true).length,
    groups: conversations.filter(c => c.contact_number?.endsWith('@g.us')).length,
    mine: conversations.filter(c => c.assigned_to === userId).length,
    unassigned: conversations.filter(c => !c.assigned_to).length,
  };

  const handleQuickModeChange = (mode: any) => {
    onFilterChange({ view: mode });
  };

  return (
    <>
      <div className="h-full flex flex-col bg-card overflow-hidden md:pr-2.5">
        <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <MessageSquarePlus className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">Conversas</h1>
          </div>
          <div className="flex items-center gap-2">
            {snoozedBadge}
            {onToggleSelectionMode && (
              <Button
                variant={isSelectionMode ? 'secondary' : 'ghost'}
                size="icon"
                onClick={onToggleSelectionMode}
                className="hover:bg-primary/10"
                title={
                  isSelectionMode ? 'Sair do modo de seleção' : 'Selecionar múltiplas conversas'
                }
              >
                {isSelectionMode ? (
                  <CheckCheck className="w-5 h-5" />
                ) : (
                  <CheckSquare className="w-5 h-5" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNewConversation(true)}
              className="hover:bg-primary/10"
            >
              <MessageSquarePlus className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Selection mode header */}
        {isSelectionMode && onSelectAll && (
          <div className="px-4 py-2 border-b border-border bg-muted/50 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Modo de seleção ativo</span>
            <Button variant="ghost" size="sm" onClick={onSelectAll} className="text-xs">
              Selecionar todas
            </Button>
          </div>
        )}

        <SearchBar
          onSearch={onSearch}
          searchQuery={searchQuery}
          isSearching={isSearching}
          filters={filters}
          onFilterChange={onFilterChange}
          onClearAllFilters={onClearAllFilters}
          conversationCounts={conversationCounts}
          onSelectConversation={onSelectConversationFromNotification}
        />

        <QuickStatusFilters
          selectedMode={filters.view as any}
          onModeChange={handleQuickModeChange}
          counts={quickModeCounts}
        />

        {/* Abas de Atribuição (Minhas, Não atribuídas, Todos) */}
        <div className="flex items-center gap-4 px-4 pt-3 border-b border-border bg-card/30 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => onFilterChange({ assignedTo: 'me' })}
            className={cn(
              "relative pb-3 text-[13px] font-semibold transition-all hover:text-foreground whitespace-nowrap px-1 flex-shrink-0",
              filters.assignedTo === 'me' 
                ? "text-primary after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary" 
                : "text-muted-foreground"
            )}
          >
            Minhas 
            <span className={cn(
              "ml-1.5 px-1.5 py-0.5 rounded bg-muted text-[10px] font-bold transition-colors",
              filters.assignedTo === 'me' ? "text-primary bg-primary/10" : "text-muted-foreground/50"
            )}>
              {quickModeCounts.mine}
            </span>
          </button>
          
          <button
            onClick={() => onFilterChange({ assignedTo: 'unassigned' })}
            className={cn(
              "relative pb-3 text-[13px] font-semibold transition-all hover:text-foreground whitespace-nowrap px-1 flex-shrink-0",
              filters.assignedTo === 'unassigned' 
                ? "text-primary after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary" 
                : "text-muted-foreground"
            )}
          >
            Não atribuídas
            <span className={cn(
              "ml-1.5 px-1.5 py-0.5 rounded bg-muted text-[10px] font-bold transition-colors",
              filters.assignedTo === 'unassigned' ? "text-primary bg-primary/10" : "text-muted-foreground/50"
            )}>
              {quickModeCounts.unassigned}
            </span>
          </button>

          <button
            onClick={() => onFilterChange({ assignedTo: 'all' })}
            className={cn(
              "relative pb-3 text-[13px] font-semibold transition-all hover:text-foreground whitespace-nowrap px-1 flex-shrink-0",
              filters.assignedTo === 'all' 
                ? "text-primary after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary" 
                : "text-muted-foreground"
            )}
          >
            Todos
            <span className={cn(
              "ml-1.5 px-1.5 py-0.5 rounded bg-muted text-[10px] font-bold transition-colors",
              filters.assignedTo === 'all' ? "text-primary bg-primary/10" : "text-muted-foreground/50"
            )}>
              {quickModeCounts.total}
            </span>
          </button>
        </div>

        <ChatFiltersBar
          filters={filters}
          onRemoveStatus={(status) => {
            const newStatuses = filters.status.includes(status)
              ? filters.status.filter((s) => s !== status)
              : [...filters.status, status];
            onFilterChange({ status: newStatuses });
          }}
          onRemoveLabel={(labelId) => {
            onFilterChange({ labels: filters.labels.filter((l) => l !== labelId) });
          }}
          onClearAll={onClearAllFilters}
          labels={labels}
        />

        <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageSquarePlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
              {!currentCompany?.id ? (
                <>
                  <p className="font-medium text-destructive">Nenhuma empresa selecionada</p>
                  <p className="text-sm mt-2">Selecione uma empresa no menu superior para visualizar conversas</p>
                </>
              ) : (
                <>
                  <p>Nenhuma conversa encontrada</p>
                  <p className="text-sm mt-2">
                    {Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : !!v) || filters.view !== 'all'
                      ? "Tente limpar os filtros para ver mais resultados."
                      : "Clique em + para iniciar uma nova conversa"}
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="p-2">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => {
                    if (isSelectionMode && onToggleSelection) {
                      onToggleSelection(conversation.id);
                    } else {
                      onSelectConversation(conversation);
                    }
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-chat-hover',
                    selectedConversation?.id === conversation.id &&
                    'bg-primary/10 border-l-4 border-primary',
                    isSelectionMode && isSelected?.(conversation.id) && 'bg-primary/20'
                  )}
                >
                  {isSelectionMode && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected?.(conversation.id) || false}
                        onCheckedChange={() => onToggleSelection?.(conversation.id)}
                        className="h-5 w-5"
                      />
                    </div>
                  )}
                  <ContactAvatar
                    phoneNumber={conversation.contact_number}
                    name={conversation.contact_name}
                    instanceName={currentCompany?.evolution_instance_name || ''}
                    profilePictureUrl={conversation.profile_pic_url}
                    size="md"
                    showOnline={true}
                    isOnline={conversation.is_online}
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 min-w-0 pr-2">
                        <span className="font-semibold truncate">{conversation.contact_name}</span>
                        {/* Exibir ícone do canal se disponível */}
                        <ChannelIcon
                          type={(conversation.channel_type as any) || 'whatsapp'}
                          size="xs"
                          className="opacity-70 flex-shrink-0"
                        />
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                        {formatTime(conversation.last_message_time)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.last_message || 'Nenhuma mensagem'}
                      </p>
                      {conversation.unread_count > 0 && (
                        <span className="ml-2 flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {getStatusBadge(conversation)}
                      {conversationSatisfaction[conversation.id] && (
                        <SatisfactionBadge
                          score={conversationSatisfaction[conversation.id].score}
                          surveyType={conversationSatisfaction[conversation.id].survey_type}
                        />
                      )}
                      {conversationLabels[conversation.id]?.slice(0, 3).map((label) => (
                        <LabelBadge
                          key={label.id}
                          name={label.name}
                          color={label.color}
                          icon={label.icon}
                          className="text-[10px] px-1.5 py-0.5"
                        />
                      ))}
                      {conversationLabels[conversation.id]?.length > 3 && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                          +{conversationLabels[conversation.id].length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Paginação */}
        {pagination && pagination.totalPages > 1 && (
          <div className="border-t border-border p-4">
            <PaginationControls
              page={pagination.page}
              pageSize={pagination.pageSize}
              total={pagination.total}
              totalPages={pagination.totalPages}
              hasNext={pagination.hasNext}
              hasPrev={pagination.hasPrev}
              onPageChange={pagination.onPageChange}
              onPageSizeChange={pagination.onPageSizeChange}
              showPageSizeSelector={true}
              showInfo={true}
              compact={true}
            />
          </div>
        )}
      </div>

      <NewConversationDialog open={showNewConversation} onOpenChange={setShowNewConversation} />
    </>
  );
};

export default ConversationList;
