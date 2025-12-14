import { MessageSquarePlus, CheckSquare, Square, CheckCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ContactAvatar } from "@/components/ContactAvatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/pages/Chat";
import NewConversationDialog from "./NewConversationDialog";
import SearchBar from "./SearchBar";
import { AdvancedFiltersDialog } from "./AdvancedFiltersDialog";
import { ChatFilters } from "@/types/chatFilters";
import { ChatFiltersBar } from "./ChatFiltersBar";
import { useState, useEffect, useCallback, ReactNode } from "react";
import { LabelBadge } from "./LabelBadge";
import { SatisfactionBadge } from "./SatisfactionBadge";
import { useCompany } from "@/contexts/CompanyContext";

type ConversationListProps = {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  isLoading: boolean;
  searchQuery: string;
  startDate: Date | null;
  endDate: Date | null;
  onSearch: (query: string) => void;
  onDateFilter: (startDate: Date | null, endDate: Date | null) => void;
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
  onSelectConversationFromNotification?: (conversationId: string) => void;
  // Selection mode props
  isSelectionMode?: boolean;
  onToggleSelectionMode?: () => void;
  onToggleSelection?: (conversationId: string) => void;
  isSelected?: (conversationId: string) => boolean;
  onSelectAll?: () => void;
  snoozedBadge?: ReactNode;
};

const ConversationList = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  isLoading,
  searchQuery,
  startDate,
  endDate,
  onSearch,
  onDateFilter,
  isSearching,
  filters,
  onFilterChange,
  onClearAllFilters,
  conversationCounts,
  onSelectConversationFromNotification,
  isSelectionMode = false,
  onToggleSelectionMode,
  onToggleSelection,
  isSelected,
  onSelectAll,
  snoozedBadge,
}: ConversationListProps) => {
  const { currentCompany } = useCompany();
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [conversationLabels, setConversationLabels] = useState<Record<string, Array<{ id: string, name: string, color: string, icon?: string }>>>({});
  const [conversationSatisfaction, setConversationSatisfaction] = useState<Record<string, { score: number, survey_type: 'csat' | 'nps' }>>({});
  const [labels, setLabels] = useState<Array<{ id: string; name: string; color: string; icon?: string | null }>>([]);

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
        .from("labels")
        .select("*")
        .eq("company_id", currentCompany.id)
        .order("name");

      if (error) throw error;
      setLabels(data || []);
    } catch (error) {
      console.error("Erro ao carregar labels:", error);
    }
  };

  const loadConversationLabels = useCallback(async () => {
    try {
      const conversationIds = conversations.map(c => c.id);
      const { data, error } = await supabase
        .from('conversation_labels')
        .select(`
          conversation_id,
          labels (id, name, color, icon)
        `)
        .in('conversation_id', conversationIds);

      if (error) throw error;

      const labelsMap: Record<string, Array<{ id: string, name: string, color: string, icon?: string }>> = {};
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
        .from("satisfaction_surveys")
        .select("conversation_id, score, survey_type")
        .in("conversation_id", conversationIds)
        .eq("status", "answered")
        .not("score", "is", null);

      if (error) throw error;

      const satisfactionMap: Record<string, { score: number, survey_type: 'csat' | 'nps' }> = {};
      data?.forEach((survey: any) => {
        satisfactionMap[survey.conversation_id] = {
          score: survey.score,
          survey_type: survey.survey_type as 'csat' | 'nps',
        };
      });

      setConversationSatisfaction(satisfactionMap);
    } catch (error) {
      console.error("Erro ao carregar satisfação:", error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 24) {
      return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;

    const statusConfig = {
      waiting: { label: "Não Lido", variant: "secondary" as const },
      re_entry: { label: "Reentrada", variant: "default" as const },
      active: { label: "Ativo", variant: "default" as const },
      chatbot: { label: "ChatBot", variant: "outline" as const },
      closed: { label: "Encerrado", variant: "secondary" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  return (
    <>
      <div className="w-full md:w-96 border-r border-border flex flex-col bg-card">
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
                variant={isSelectionMode ? "secondary" : "ghost"}
                size="icon"
                onClick={onToggleSelectionMode}
                className="hover:bg-primary/10"
                title={isSelectionMode ? "Sair do modo de seleção" : "Selecionar múltiplas conversas"}
              >
                {isSelectionMode ? <CheckCheck className="w-5 h-5" /> : <CheckSquare className="w-5 h-5" />}
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
            <span className="text-sm text-muted-foreground">
              Modo de seleção ativo
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSelectAll}
              className="text-xs"
            >
              Selecionar todas
            </Button>
          </div>
        )}

        <SearchBar
          onSearch={onSearch}
          onDateFilter={onDateFilter}
          searchQuery={searchQuery}
          startDate={startDate}
          endDate={endDate}
          isSearching={isSearching}
          filters={filters}
          onFilterChange={onFilterChange}
          onClearAllFilters={onClearAllFilters}
          conversationCounts={conversationCounts}
          onSelectConversation={onSelectConversationFromNotification}
        />

        <ChatFiltersBar
          filters={filters}
          onRemoveStatus={(status) => {
            const newStatuses = filters.status.includes(status)
              ? filters.status.filter(s => s !== status)
              : [...filters.status, status];
            onFilterChange({ status: newStatuses });
          }}
          onRemoveLabel={(labelId) => {
            onFilterChange({ labels: filters.labels.filter(l => l !== labelId) });
          }}
          onClearAll={onClearAllFilters}
          labels={labels}
        />

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg animate-pulse"
                >
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
              <p>Nenhuma conversa ainda</p>
              <p className="text-sm mt-2">Clique em + para iniciar uma nova conversa</p>
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
                    "w-full flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-chat-hover",
                    selectedConversation?.id === conversation.id &&
                    "bg-primary/10 border-l-4 border-primary",
                    isSelectionMode && isSelected?.(conversation.id) && "bg-primary/20"
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
                      <span className="font-semibold truncate">
                        {conversation.contact_name}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatTime(conversation.last_message_time)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.last_message || "Nenhuma mensagem"}
                      </p>
                      {conversation.unread_count > 0 && (
                        <span className="ml-2 flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {conversation.status && getStatusBadge(conversation.status)}
                      {conversationSatisfaction[conversation.id] && (
                        <SatisfactionBadge
                          score={conversationSatisfaction[conversation.id].score}
                          surveyType={conversationSatisfaction[conversation.id].survey_type}
                        />
                      )}
                      {conversationLabels[conversation.id]?.slice(0, 3).map(label => (
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
        </ScrollArea>
      </div>

      <NewConversationDialog
        open={showNewConversation}
        onOpenChange={setShowNewConversation}
      />
    </>
  );
};

export default ConversationList;
