import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Send, Info, RotateCcw, Tag, ArrowRightLeft, EyeOff, Bot } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Conversation } from "@/pages/Chat";
import { cn } from "@/lib/utils";
import { MediaUpload } from "./MediaUpload";
import { LabelsManager } from "./LabelsManager";
import { MessageActions } from "./MessageActions";
import { InteractiveMessageSender } from "./InteractiveMessageSender";
import { PresenceIndicator } from "./PresenceIndicator";
import ReopenConversationDialog from "./ReopenConversationDialog";
import TransferDialog from "./TransferDialog";
import { AudioRecorder } from "./AudioRecorder";
import { QuickReplies } from "./QuickReplies";
import { FAQSelector } from "./FAQSelector";
import { DocumentSelector } from "./DocumentSelector";
import { AIAssistant } from "./AIAssistant";
import { ProductSelector } from "./ProductSelector";
import { MessageStatus } from "./MessageStatus";
import { useSendPresence } from "@/hooks/useSendPresence";
import { useMarkAsRead } from "@/hooks/useMarkAsRead";
import { MessageBubble } from "./MessageBubble";
import { ChatLegend } from "./ChatLegend";
import { useSendTextMessage } from "@/hooks/useEvolutionApi";
import { useCompany } from "@/contexts/CompanyContext";

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

const MessageArea = ({ conversation, onBack, searchQuery = "", onToggleDetailPanel, onToggleAIPanel, showAIPanel = false, showAIAssistant = true }: MessageAreaProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [showLabelsManager, setShowLabelsManager] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showInternalNotes, setShowInternalNotes] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hook de presença (digitando/gravando)
  const { startTyping, startRecording, stopPresence } = useSendPresence(conversation?.id || "");
  const { markAsRead } = useMarkAsRead();

  // Hooks Evolution API
  const { currentCompany } = useCompany();
  const sendTextMessage = useSendTextMessage(currentCompany?.evolution_instance_name || '');
  // const startCall = useStartCall();

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Verifica se não está digitando em um input/textarea (exceto para Ctrl+Shift+N)
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // L para abrir labels
      if (e.key.toLowerCase() === 'l' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && !isTyping) {
        e.preventDefault();
        setShowLabelsManager(true);
      }

      // Ctrl+Shift+N para toggle nota interna
      if (e.key.toLowerCase() === 'n' && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        setIsInternalNote(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Function to replace template variables
  const replaceVariables = (text: string): string => {
    if (!conversation) return text;

    return text
      .replace(/\{\{nome\}\}/g, conversation.contact_name || "Cliente")
      .replace(/\{\{empresa\}\}/g, conversation.contact_name || "")
      .replace(/\{\{telefone\}\}/g, conversation.contact_number || "");
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
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          console.log("Realtime: New message", payload);
          const newMsg = payload.new as Message;

          // Add message only if it doesn't exist (prevent duplicates)
          setMessages((prev) => {
            const exists = prev.some(m => m.id === newMsg.id);
            if (exists) return prev;
            return [...prev, newMsg];
          });

          // Scroll to bottom on new message
          setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          console.log("Realtime: Message updated", payload);
          const updatedMsg = payload.new as Message;

          // Update message in list
          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          console.log("Realtime: Message deleted", payload);
          const deletedMsg = payload.old as Message;

          // Remove message from list
          setMessages((prev) => prev.filter((m) => m.id !== deletedMsg.id));
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
        if (status === 'SUBSCRIBED') {
          console.log("✅ Realtime conectado com sucesso!");
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('❌ Erro na subscription de mensagens');
          toast.error("Falha ao conectar ao sistema de mensagens em tempo real");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let filtered = messages;

    // Filtrar por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((msg) =>
        msg.content.toLowerCase().includes(query)
      );
    }

    // Filtrar notas internas
    if (!showInternalNotes) {
      filtered = filtered.filter((msg) =>
        msg.message_type !== 'internal_note'
      );
    }

    setFilteredMessages(filtered);
  }, [searchQuery, messages, showInternalNotes]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const loadMessages = async () => {
    if (!conversation) {
      console.log("❌ loadMessages: Nenhuma conversa selecionada");
      return;
    }

    console.log("🔍 loadMessages: Carregando mensagens para conversa:", conversation.id);
    console.log("📋 Dados da conversa:", {
      id: conversation.id,
      contact_name: conversation.contact_name,
      unread_count: conversation.unread_count
    });

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("id, content, is_from_me, is_from_ai, ai_model, ai_confidence, ai_intent_detected, ai_sentiment, timestamp, status, media_url, media_type, message_type, edited_at, deleted_at, delivered_at, read_at, played_at, external_id, poll_data, list_data, location_data, contact_data, reaction")
        .eq("conversation_id", conversation.id)
        .is("deleted_at", null)
        .order("timestamp", { ascending: true });

      if (error) {
        console.error("❌ Erro na query:", error);
        throw error;
      }

      console.log("✅ Mensagens carregadas:", data?.length || 0);
      console.log("📨 Primeiras 3 mensagens:", data?.slice(0, 3));

      setMessages(data || []);

      // Marcar mensagens como lidas quando abrir a conversa
      if (conversation.unread_count > 0) {
        markAsRead(conversation.id);
      }
    } catch (error) {
      console.error("❌ Erro ao carregar mensagens:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation || isSending) return;

    setIsSending(true);
    const processedMessage = replaceVariables(newMessage);
    const messageToSend = processedMessage;
    setNewMessage("");
    setSelectedTemplateId(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Se for nota interna, salvar direto no banco
      if (isInternalNote) {
        // Buscar company_id do usuário
        const { data: companyUser } = await supabase
          .from("company_users")
          .select("company_id")
          .eq("user_id", user.id)
          .eq("is_default", true)
          .maybeSingle();

        const { error } = await supabase.from("messages").insert({
          conversation_id: conversation.id,
          user_id: user.id,
          company_id: companyUser?.company_id || null,
          content: messageToSend,
          is_from_me: true,
          message_type: "internal_note",
          status: "sent",
        });

        if (error) throw error;

        toast.success("Nota interna adicionada", {
          description: "Sua nota foi salva e só é visível para a equipe"
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
        status: "sending",
      };

      setMessages((prev) => [...prev, tempMessage]);

      // Enviar via Edge Function (seguro - não expõe credenciais)
      const { data: sendResult, error: sendError } = await supabase.functions.invoke('send-message', {
        body: {
          conversationId: conversation.id,
          content: messageToSend,
          messageType: 'text'
        }
      });

      if (sendError || !sendResult?.success) {
        throw new Error(sendResult?.error || 'Erro ao enviar mensagem');
      }

      // Salvar no banco de dados
      const { data: companyUser } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", user.id)
        .maybeSingle();

      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        user_id: user.id,
        company_id: companyUser?.company_id || null,
        content: messageToSend,
        is_from_me: true,
        message_type: "text",
        status: "sent",
      });

      // Atualizar última mensagem da conversa
      await supabase
        .from("conversations")
        .update({
          last_message: messageToSend,
          last_message_time: new Date().toISOString(),
        })
        .eq("id", conversation.id);

      // Remover mensagem temporária
      setMessages((prev) => prev.filter((m) => !m.id.startsWith("temp-")));

      toast.success("Mensagem enviada!");
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setNewMessage(messageToSend);

      setMessages((prev) =>
        prev.filter((m) => !m.id.startsWith("temp-"))
      );

      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a mensagem");
    } finally {
      setIsSending(false);
    }
  };




  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
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
      <div className="flex-1 flex flex-col bg-background">
        <div className="p-4 border-b border-border flex items-center gap-3 bg-card">
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
          {conversation.status === 'closed' && (
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-primary/10"
              onClick={() => setShowReopenDialog(true)}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reabrir
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
          <Button
            variant={showInternalNotes ? "default" : "ghost"}
            size="icon"
            className="hover:bg-primary/10"
            onClick={() => setShowInternalNotes(!showInternalNotes)}
            title={showInternalNotes ? "Ocultar notas internas" : "Mostrar notas internas"}
          >
            <EyeOff className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-primary/10"
            onClick={onToggleDetailPanel}
            title="Ver detalhes do contato"
          >
            <Info className="w-5 h-5" />
          </Button>
          {onToggleAIPanel && (
            <Button
              variant={showAIPanel ? "default" : "ghost"}
              size="icon"
              className={showAIPanel ? "bg-violet-600 hover:bg-violet-700" : "hover:bg-primary/10"}
              onClick={onToggleAIPanel}
              title="Painel de IA"
            >
              <Bot className="w-5 h-5" />
            </Button>
          )}
          <LabelsManager
            conversationId={conversation.id}
            onLabelsChange={loadMessages}
            open={showLabelsManager}
            onOpenChange={setShowLabelsManager}
          />
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
          </div>
        </ScrollArea>

        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t border-border bg-card space-y-2"
        >
          {conversation.status === 'closed' ? (
            <div className="text-center py-2 text-muted-foreground bg-muted rounded-lg">
              Esta conversa está encerrada. Clique em "Reabrir" para continuar o atendimento.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1 mb-2">
                <InteractiveMessageSender
                  conversationId={conversation.id}
                  contactNumber={conversation.contact_number}
                  onMessageSent={loadMessages}
                />
                <MediaUpload
                  conversationId={conversation.id}
                  contactNumber={conversation.contact_number}
                  onMediaSent={loadMessages}
                />
                <AudioRecorder
                  conversationId={conversation.id}
                  contactNumber={conversation.contact_number}
                  onSent={loadMessages}
                  onStartRecording={startRecording}
                />
                <QuickReplies
                  onSelect={(content, templateId) => {
                    setNewMessage(content);
                    setSelectedTemplateId(templateId);
                  }}
                />
                <FAQSelector
                  onSelect={(answer) => {
                    setNewMessage(answer);
                  }}
                />
                <DocumentSelector
                  onSelect={(link) => {
                    setNewMessage(prev => prev + (prev ? " " : "") + link);
                  }}
                />
                <ProductSelector
                  onProductSelect={(message) => {
                    setNewMessage(message);
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  variant={isInternalNote ? "default" : "ghost"}
                  onClick={() => setIsInternalNote(!isInternalNote)}
                  title="Nota interna (Ctrl+Shift+N)"
                  className={cn(
                    "rounded-full",
                    isInternalNote && "bg-yellow-500 hover:bg-yellow-600 text-white"
                  )}
                >
                  <EyeOff className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    startTyping();
                  }}
                  onBlur={stopPresence}
                  placeholder={isInternalNote ? "Escreva uma nota interna (só a equipe verá)..." : "Digite uma mensagem... Use {{nome}}, {{empresa}}"}
                  className={cn(
                    "flex-1 rounded-full",
                    isInternalNote && "bg-yellow-50 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-700"
                  )}
                  disabled={isSending}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!newMessage.trim() || isSending}
                  className="rounded-full bg-primary hover:bg-primary/90 transition-all hover:scale-105"
                >
                  <Send className="w-5 h-5" />
                </Button>
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
      </div>

      {
        showAIAssistant && conversation && (
          <AIAssistant
            conversation={conversation}
            messages={messages}
            onUseSuggestion={(text) => setNewMessage(text)}
            onCreateTask={() => {
              toast.info("Em breve: Criação rápida de tarefa em desenvolvimento");
            }}
            onCreateProposal={() => {
              toast.info("Em breve: Criação rápida de proposta em desenvolvimento");
            }}
          />
        )
      }
    </div >
  );
};

export default MessageArea;
