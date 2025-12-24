import { useEffect, useState, useRef } from 'react';
import {
  ArrowLeft,
  Send,
  User,
  RotateCcw,
  Tag,
  ArrowRightLeft,
  EyeOff,
  Bot,
  AlarmClock,
  HelpCircle,
  Pause,
  Play,
  CheckCircle,
  Brain,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Conversation } from '@/types/chat';
import { cn } from '@/lib/utils';
import { MediaUpload } from './MediaUpload';
import { LabelsManager } from '@/components/chat/LabelsManager';
import { MessageActions } from './MessageActions';
import { InteractiveMessageSender } from './InteractiveMessageSender';
import { PresenceIndicator } from '@/components/chat/PresenceIndicator';
import ReopenConversationDialog from '@/components/chat/dialogs/ReopenConversationDialog';
import TransferDialog from '@/components/chat/dialogs/TransferDialog';
import { AudioRecorder } from '@/components/chat/AudioRecorder';
import { QuickReplies } from '@/components/chat/QuickReplies';
import { FAQSelector } from '@/components/chat/FAQSelector';
import { DocumentSelector } from '@/components/chat/DocumentSelector';
import { AIAssistant } from '@/components/chat/AIAssistant';
import { ProductSelector } from '@/components/chat/ProductSelector';
import { MessageStatus } from './MessageStatus';
import { useSendPresence } from '@/hooks/useSendPresence';
import { useMarkAsRead } from '@/hooks/chat/useMarkAsRead';
import { MessageBubble } from './MessageBubble';
import { ChatLegend } from '@/components/chat/sidebar/ChatLegend';
import { useSendTextMessage } from '@/hooks/api/useEvolutionApi';
import { useCompany } from '@/contexts/CompanyContext';
import { ShortcutSuggestions } from '@/components/chat/ShortcutSuggestions';
import { ShortcutHelpModal } from '@/components/chat/ShortcutHelpModal';
import { SnoozeMenu } from '@/components/chat/SnoozeMenu';
import { useQuickResponses, useShortcutNavigation } from '@/hooks/chat/useQuickResponses';
import { CopilotToggle } from '@/components/chat/CopilotToggle';
import { TabulationModal } from '../TabulationModal';
import { VariablePicker } from '@/components/chat/VariablePicker';
import { useVariables } from '@/hooks/useVariables';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type Message = {
  id: string;
  content: string;
  is_from_me: boolean;
  timestamp: string;
  status: string;
  media_url?: string;
  media_type?: string;
  message_type?: string;
  edited_at?: string;
  deleted_at?: string;
  delivered_at?: string;
  read_at?: string;
  played_at?: string;
  external_id?: string;
  poll_data?: any;
  list_data?: any;
  location_data?: any;
  contact_data?: any;
  reaction?: string;
  sender?: {
    name: string;
    avatar_url?: string;
    message_color?: string;
  };
};

type MessageAreaProps = {
  conversation: Conversation | null;
  onBack: () => void;
  searchQuery?: string;
  onToggleDetailPanel: () => void;
  onToggleAIPanel?: () => void;
  showAIPanel?: boolean;
  showAIAssistant?: boolean;
};

const MessageArea = ({
  conversation,
  onBack,
  searchQuery = '',
  onToggleDetailPanel,
  onToggleAIPanel,
  showAIPanel = false,
  showAIAssistant = true,
}: MessageAreaProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [showLabelsManager, setShowLabelsManager] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showInternalNotes, setShowInternalNotes] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  const [copilotEnabled, setCopilotEnabled] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [isTogglingAI, setIsTogglingAI] = useState(false);
  const [showTabulationModal, setShowTabulationModal] = useState(false);
  const [isResolvingConversation, setIsResolvingConversation] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<{ full_name: string; first_name: string; message_color?: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Quick responses hook for /shortcuts
  const {
    isShortcutMode,
    suggestions,
    selectSuggestion,
    resetShortcutMode,
    setInputValue: setQuickResponseInput,
  } = useQuickResponses();

  const {
    selectedIndex,
    setSelectedIndex,
    handleKeyDown: handleShortcutKeyDown,
    resetSelection,
  } = useShortcutNavigation(suggestions.length);

  // Hook de presença (digitando/gravando)
  const { startTyping, startRecording, stopPresence } = useSendPresence(conversation?.id || '');
  const { markAsRead } = useMarkAsRead();

  const { variables: companyVariables } = useVariables();
  const { currentCompany } = useCompany();
  const sendTextMessage = useSendTextMessage(currentCompany?.evolution_instance_name || '');
  // const startCall = useStartCall();

  // Fechar painel AI quando copilot for desabilitado
  useEffect(() => {
    if (!copilotEnabled && showAIPanel && onToggleAIPanel) {
      onToggleAIPanel();
    }
  }, [copilotEnabled]);

  // Carregar status da IA
  useEffect(() => {
    const loadAIStatus = async () => {
      if (!conversation?.id) return;

      const { data } = await supabase
        .from('conversations')
        .select('ai_enabled')
        .eq('id', conversation.id)
        .maybeSingle();

      if (data) {
        setAiEnabled(data.ai_enabled || false);
      }
    };

    loadAIStatus();

    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, first_name, message_color')
          .eq('id', user.id)
          .maybeSingle();

        if (data) {
          setCurrentUserProfile(data as any);
        }
      }
    };
    fetchUserProfile();
  }, [conversation?.id]);

  // Toggle IA
  const toggleAI = async () => {
    if (!conversation?.id) return;

    setIsTogglingAI(true);
    const newEnabled = !aiEnabled;

    const { error } = await supabase
      .from('conversations')
      .update({
        ai_enabled: newEnabled,
        ai_paused_at: newEnabled ? null : new Date().toISOString(),
      })
      .eq('id', conversation.id);

    if (error) {
      toast.error('Erro ao atualizar IA');
    } else {
      setAiEnabled(newEnabled);
      toast.success(
        newEnabled ? 'IA ativada' : 'IA pausada',
        {
          description: newEnabled
            ? 'A IA voltará a responder automaticamente'
            : 'A IA não responderá mais nesta conversa',
        }
      );
    }
    setIsTogglingAI(false);
  };

  // Abrir modal de tabulação
  const handleOpenTabulationModal = () => {
    setShowTabulationModal(true);
  };

  // Encerrar atendimento com tabulação
  const handleResolveConversation = async (tabulationId: string) => {
    if (!conversation?.id) return;

    setIsResolvingConversation(true);

    try {
      const { error } = await supabase.rpc('mark_conversation_resolved', {
        p_conversation_id: conversation.id,
        p_tabulation_id: tabulationId,
      });

      if (error) throw error;

      toast.success('Atendimento encerrado', {
        description: 'A conversa foi marcada como resolvida',
      });

      setShowTabulationModal(false);

      // Opcional: voltar para lista de conversas
      if (onBack) {
        onBack();
      }
    } catch (error) {
      console.error('Erro ao encerrar atendimento:', error);
      toast.error('Erro ao encerrar atendimento');
    } finally {
      setIsResolvingConversation(false);
    }
  };

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Verifica se não está digitando em um input/textarea (exceto para Ctrl+Shift+N)
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // Verificar se e.key existe antes de usar toLowerCase
      if (!e.key) return;

      // L para abrir labels
      if (
        e.key.toLowerCase() === 'l' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey &&
        !isTyping
      ) {
        e.preventDefault();
        setShowLabelsManager(true);
      }

      // Ctrl+Shift+N para toggle nota interna
      if (e.key.toLowerCase() === 'n' && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        setIsInternalNote((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Function to replace template variables
  const replaceVariables = (text: string): string => {
    if (!conversation) return text;

    let processedText = text;

    // Helper to create a robust regex for variables (handles spaces and case insensitive)
    const getVarRegex = (key: string) => {
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`\\{\\{\\s*${escapedKey}\\s*\\}\\}`, 'gi');
    };

    // 1. First Pass: Replace Company/Custom Variables
    // This allows custom variables (aliases) to contain system variables like {{primeiro_nome}}
    if (companyVariables && Array.isArray(companyVariables)) {
      companyVariables.forEach((v) => {
        if (v.key) {
          processedText = processedText.replace(getVarRegex(v.key), v.value || '');
        }
      });
    }

    // 2. Second Pass: Replace System and Contact Variables
    const fullName = conversation.contact_name || 'Cliente';
    const firstName = fullName.trim().split(' ')[0] || 'Cliente';
    const now = new Date();
    const protocolo = conversation.id ? conversation.id.split('-')[0].toUpperCase() : 'REQ';

    processedText = processedText
      // Contact variables
      .replace(getVarRegex('nome'), fullName)
      .replace(getVarRegex('primeiro_nome'), firstName)
      .replace(getVarRegex('telefone'), conversation.contact_number || '')
      .replace(getVarRegex('email'), (conversation as any).email || '')
      // System variables
      .replace(getVarRegex('data_atual'), now.toLocaleDateString('pt-BR'))
      .replace(getVarRegex('hora_atual'), now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
      .replace(getVarRegex('protocolo'), protocolo)
      .replace(getVarRegex('empresa_nome'), currentCompany?.name || '')
      .replace(getVarRegex('empresa_cnpj'), (currentCompany as any)?.cnpj || '')
      .replace(getVarRegex('funcionario_nome'), currentUserProfile?.first_name || currentUserProfile?.full_name?.split(' ')[0] || 'Atendente')
      .replace(getVarRegex('cache'), 'Sessão Ativa');

    return processedText;
  };

  useEffect(() => {
    if (conversation) {
      loadMessages();
    }
  }, [conversation]);

  useEffect(() => {
    if (!conversation) return;

    const channel = supabase
      .channel(`messages-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          console.log('Realtime: New message', payload);
          const newMsg = payload.new as Message;

          // Add message only if it doesn't exist (prevent duplicates)
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === newMsg.id);
            if (exists) return prev;

            // Injetar informações do remetente se for eu (para garantir a cor)
            if (newMsg.is_from_me && !newMsg.sender && currentUserProfile) {
              newMsg.sender = {
                name: currentUserProfile.full_name,
                message_color: currentUserProfile.message_color
              };
            }

            return [...prev, newMsg];
          });

          // Scroll to bottom on new message
          setTimeout(() => {
            scrollToBottom('smooth');
          }, 100);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          console.log('Realtime: Message updated', payload);
          const updatedMsg = payload.new as Message;

          // Update message in list
          setMessages((prev) => prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m)));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          console.log('Realtime: Message deleted', payload);
          const deletedMsg = payload.old as Message;

          // Remove message from list
          setMessages((prev) => prev.filter((m) => m.id !== deletedMsg.id));
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime conectado com sucesso!');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('❌ Erro na subscription de mensagens');
          toast.error('Falha ao conectar ao sistema de mensagens em tempo real');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom('auto');
    }
  }, [messages]);

  useEffect(() => {
    let filtered = messages;

    // Filtrar por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((msg) => msg.content.toLowerCase().includes(query));
    }

    // Filtrar notas internas
    if (!showInternalNotes) {
      filtered = filtered.filter((msg) => msg.message_type !== 'internal_note');
    }

    setFilteredMessages(filtered);
  }, [searchQuery, messages, showInternalNotes]);

  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  const loadMessages = async () => {
    if (!conversation) {
      console.log('❌ loadMessages: Nenhuma conversa selecionada');
      return;
    }

    console.log('🔍 loadMessages: Carregando mensagens para conversa:', conversation.id);
    console.log('📋 Dados da conversa:', {
      id: conversation.id,
      contact_name: conversation.contact_name,
      unread_count: conversation.unread_count,
    });

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(
          `id, content, is_from_me, is_from_ai, ai_model, ai_confidence, ai_intent_detected, ai_sentiment, timestamp, status, media_url, media_type, message_type, edited_at, deleted_at, delivered_at, read_at, played_at, external_id, poll_data, list_data, location_data, contact_data, reaction,
           sender:profiles!messages_user_id_fkey(name:full_name, avatar_url, message_color)`
        )
        .eq('conversation_id', conversation.id)
        .is('deleted_at', null)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('❌ Erro na query:', error);
        throw error;
      }

      console.log('✅ Mensagens carregadas:', data?.length || 0);
      console.log('📨 Primeiras 3 mensagens:', data?.slice(0, 3));

      setMessages((data as any) || []);

      // Marcar mensagens como lidas quando abrir a conversa
      if (conversation.unread_count > 0) {
        markAsRead(conversation.id);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation || isSending) return;

    setIsSending(true);
    const processedMessage = replaceVariables(newMessage);
    const messageToSend = processedMessage;
    setNewMessage('');
    setSelectedTemplateId(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Se for nota interna, salvar direto no banco
      if (isInternalNote) {
        // Buscar company_id do usuário
        const { data: companyUser } = await supabase
          .from('company_users')
          .select('company_id')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .maybeSingle();

        const { error } = await supabase.from('messages').insert({
          conversation_id: conversation.id,
          user_id: user.id,
          company_id: companyUser?.company_id || null,
          content: messageToSend,
          is_from_me: true,
          message_type: 'internal_note',
          status: 'sent',
        });

        if (error) throw error;

        toast.success('Nota interna adicionada', {
          description: 'Sua nota foi salva e só é visível para a equipe',
        });

        setIsInternalNote(false);
        return;
      }

      // Mensagem normal via Edge Function (seguro)
      // Verificação removida para permitir envio quando configurado via Secrets/Evolution Settings
      // if (!currentCompany?.evolution_instance_name) {
      //   throw new Error("Evolution API não configurada. Configure em Configurações");
      // }

      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        content: messageToSend,
        is_from_me: true,
        timestamp: new Date().toISOString(),
        status: 'sending',
        sender: currentUserProfile ? {
          name: currentUserProfile.full_name,
          message_color: currentUserProfile.message_color
        } : undefined
      };

      setMessages((prev) => [...prev, tempMessage]);

      // Enviar via Edge Function (seguro - não expõe credenciais)
      const { data: sendResult, error: sendError } = await supabase.functions.invoke(
        'send-message',
        {
          body: {
            conversationId: conversation.id,
            content: messageToSend,
            messageType: 'text',
          },
        }
      );

      if (sendError || !sendResult?.success) {
        throw new Error(sendResult?.error || 'Erro ao enviar mensagem');
      }

      // Salvar no banco de dados
      const { data: companyUser } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .maybeSingle();

      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        user_id: user.id,
        company_id: companyUser?.company_id || null,
        content: messageToSend,
        is_from_me: true,
        message_type: 'text',
        status: 'sent',
      });

      // Atualizar última mensagem da conversa
      await supabase
        .from('conversations')
        .update({
          last_message: messageToSend,
          last_message_time: new Date().toISOString(),
        })
        .eq('id', conversation.id);

      // Remover mensagem temporária
      setMessages((prev) => prev.filter((m) => !m.id.startsWith('temp-')));

      toast.success('Mensagem enviada!');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setNewMessage(messageToSend);

      setMessages((prev) => prev.filter((m) => !m.id.startsWith('temp-')));

      toast.error(error instanceof Error ? error.message : 'Não foi possível enviar a mensagem');
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">Selecione uma conversa para começar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex">
      <div className="flex-1 flex flex-col bg-background overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3 bg-card shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden hover:bg-primary/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Avatar className="w-10 h-10">
            <AvatarImage src={conversation.profile_pic_url} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {getInitials(conversation.contact_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold truncate">{conversation.contact_name}</h2>
            <PresenceIndicator conversationId={conversation.id} />
          </div>
          {conversation.status === 'closed' ? (
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-primary/10"
              onClick={() => setShowReopenDialog(true)}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reabrir
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleOpenTabulationModal}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Encerrar Atendimento
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-primary/10"
            onClick={() => setShowTransferDialog(true)}
            title="Transferir conversa"
          >
            <ArrowRightLeft className="w-5 h-5" />
          </Button>
          <SnoozeMenu
            conversationId={conversation.id}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-primary/10"
                title="Adiar conversa"
              >
                <AlarmClock className="w-5 h-5" />
              </Button>
            }
          />
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-primary/10"
            onClick={onToggleDetailPanel}
            title="Ver detalhes do contato"
          >
            <User className="w-5 h-5" />
          </Button>
          {onToggleAIPanel && (
            <>
              <Button
                variant={showAIPanel ? 'default' : 'ghost'}
                size="icon"
                className={showAIPanel ? 'bg-violet-600 hover:bg-violet-700' : 'hover:bg-primary/10'}
                onClick={onToggleAIPanel}
                title="Painel do Agente de Atendimento (n8n)"
              >
                <Bot className="w-5 h-5" />
              </Button>
              <CopilotToggle
                conversationId={conversation.id}
                onToggle={setCopilotEnabled}
              />
            </>
          )}
        </div>

        {/* Legenda de cores */}
        <ChatLegend />

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-2">
            {filteredMessages.length === 0 && searchQuery ? (
              <div className="text-center text-muted-foreground py-8">
                <p>Nenhuma mensagem encontrada para "{searchQuery}"</p>
              </div>
            ) : (
              filteredMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  showSender={true}
                  contactAvatar={conversation?.profile_pic_url}
                  contactName={conversation?.contact_name}
                  contactPhone={conversation?.contact_number}
                  onUpdated={loadMessages}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-card space-y-2 shrink-0">
          {conversation.status === 'closed' ? (
            <div className="text-center py-2 text-muted-foreground bg-muted rounded-lg">
              Esta conversa está encerrada. Clique em "Reabrir" para continuar o atendimento.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">


                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <QuickReplies
                          onSelect={(content, templateId) => {
                            setNewMessage(content);
                            setSelectedTemplateId(templateId);
                          }}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">Respostas Rápidas (Templates)</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <FAQSelector
                          onSelect={(answer) => {
                            setNewMessage(answer);
                          }}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">Base de Conhecimento / FAQ</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <DocumentSelector
                          onSelect={(link) => {
                            setNewMessage((prev) => prev + (prev ? ' ' : '') + link);
                          }}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">Documentos Externos</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <ProductSelector
                          onProductSelect={(message) => {
                            setNewMessage(message);
                          }}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">Catálogo de Produtos</TooltipContent>
                  </Tooltip>


                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-border transition-all shadow-sm">
                      <Brain className={cn("h-4 w-4", aiEnabled ? "text-emerald-500" : "text-slate-400")} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">IA</span>
                      <Switch
                        checked={aiEnabled}
                        onCheckedChange={toggleAI}
                        disabled={isTogglingAI}
                        className="scale-75 data-[state=checked]:bg-emerald-500"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {aiEnabled ? 'Pausar Atendimento Automático (IA)' : 'Retomar Atendimento Automático (IA)'}
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="flex gap-2 relative items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="shrink-0">
                      <MediaUpload
                        conversationId={conversation.id}
                        contactNumber={conversation.contact_number}
                        onMediaSent={loadMessages}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">Anexar Arquivos</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant={isInternalNote ? 'outline' : 'ghost'}
                      onClick={() => setIsInternalNote(!isInternalNote)}
                      className={cn(
                        'rounded-full shrink-0',
                        isInternalNote && 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500'
                      )}
                    >
                      <EyeOff className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {isInternalNote ? 'Desativar Nota Interna' : 'Ativar Nota Interna'}
                  </TooltipContent>
                </Tooltip>

                {/* Shortcut suggestions popup */}
                {isShortcutMode && suggestions.length > 0 && (
                  <ShortcutSuggestions
                    suggestions={suggestions}
                    selectedIndex={selectedIndex}
                    onSelect={(suggestion) => {
                      const newContent = selectSuggestion(suggestion);
                      setNewMessage(newContent);
                      resetShortcutMode();
                      resetSelection();
                      inputRef.current?.focus();
                    }}
                    onHover={setSelectedIndex}
                  />
                )}

                <Input
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewMessage(value);
                    setQuickResponseInput(value);
                    startTyping();
                  }}
                  onKeyDown={(e) => {
                    if (isShortcutMode && suggestions.length > 0) {
                      const action = handleShortcutKeyDown(e);
                      if (action === 'select' && selectedIndex >= 0) {
                        const newContent = selectSuggestion(suggestions[selectedIndex]);
                        setNewMessage(newContent);
                        resetShortcutMode();
                        resetSelection();
                        e.preventDefault();
                      } else if (e.key === 'Escape') {
                        resetShortcutMode();
                        resetSelection();
                      }
                    }
                  }}
                  onBlur={stopPresence}
                  placeholder={
                    isInternalNote
                      ? 'Escreva uma nota interna (só a equipe verá)...'
                      : 'Digite / para atalhos ou sua mensagem...'
                  }
                  className={cn(
                    'flex-1 rounded-full',
                    isInternalNote &&
                    'bg-yellow-50 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-700'
                  )}
                  disabled={isSending}
                />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <VariablePicker
                        hideStandard={true}
                        onSelect={(variable) => {
                          setNewMessage((prev) => prev + variable);
                          inputRef.current?.focus();
                        }}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">Inserir Variáveis Dinâmicas</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <AudioRecorder
                        conversationId={conversation.id}
                        contactNumber={conversation.contact_number}
                        onSent={loadMessages}
                        onStartRecording={startRecording}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">Gravar Áudio</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!newMessage.trim() || isSending}
                      className="rounded-full bg-primary hover:bg-primary/90 transition-all hover:scale-105"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Enviar Mensagem (Enter)</TooltipContent>
                </Tooltip>
              </div>
              {isInternalNote && (
                <div className="text-xs text-yellow-700 dark:text-yellow-400 flex items-center gap-1">
                  <EyeOff className="w-3 h-3" />
                  Modo nota interna ativo - Esta mensagem NÃO será enviada ao cliente
                </div>
              )}
            </>
          )}
        </form>

        <ReopenConversationDialog
          open={showReopenDialog}
          onOpenChange={setShowReopenDialog}
          conversationId={conversation.id}
          onSuccess={loadMessages}
        />

        <TransferDialog
          open={showTransferDialog}
          onOpenChange={setShowTransferDialog}
          conversationId={conversation.id}
          currentAssignedTo={conversation.assigned_to}
          onSuccess={loadMessages}
        />

        <ShortcutHelpModal open={showShortcutHelp} onOpenChange={setShowShortcutHelp} />

        <TabulationModal
          open={showTabulationModal}
          onOpenChange={setShowTabulationModal}
          onConfirm={handleResolveConversation}
          isLoading={isResolvingConversation}
        />
      </div>

      {showAIAssistant && conversation && copilotEnabled && (
        <AIAssistant
          conversation={conversation}
          messages={messages}
          onUseSuggestion={(text) => setNewMessage(text)}
          onCreateTask={() => {
            toast.info('Em breve: Criação rápida de tarefa em desenvolvimento');
          }}
          onCreateProposal={() => {
            toast.info('Em breve: Criação rápida de proposta em desenvolvimento');
          }}
        />
      )}
    </div>
  );
};

export default MessageArea;
