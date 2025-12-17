import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { MessageSquare, Send, User, Search, X } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  display_name: string;
  is_online: boolean;
  last_sign_in_at: string;
  unread_count?: number;
}

interface InternalMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  message_type: string;
  media_url: string | null;
  read_at: string | null;
  created_at: string;
}

export function InternalChatPanel() {
  const { currentCompany } = useCompany();
  const [isOpen, setIsOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentCompany?.id && currentUserId) {
      loadTeamMembers();
    }
  }, [currentCompany?.id, currentUserId]);

  useEffect(() => {
    if (selectedMember && currentUserId) {
      loadMessages();
      markMessagesAsRead();
    }
  }, [selectedMember, currentUserId]);

  // Realtime subscriptions
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`internal-chat-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'internal_messages',
          filter: `recipient_id=eq.${currentUserId}`,
        },
        (payload) => {
          const newMsg = payload.new as InternalMessage;

          // Add to messages if this conversation is open
          if (selectedMember && newMsg.sender_id === selectedMember.id) {
            setMessages((prev) => [...prev, newMsg]);
            markMessagesAsRead();
          } else {
            // Update unread count for this member
            setTeamMembers((prev) =>
              prev.map((member) =>
                member.id === newMsg.sender_id
                  ? { ...member, unread_count: (member.unread_count || 0) + 1 }
                  : member
              )
            );
          }

          updateTotalUnread();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'internal_messages',
          filter: `recipient_id=eq.${currentUserId}`,
        },
        () => {
          updateTotalUnread();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, selectedMember]);

  const loadCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const loadTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('online_users')
        .select('*')
        .eq('company_id', currentCompany!.id)
        .neq('id', currentUserId);

      if (error) throw error;

      // Load unread counts for each member
      const membersWithUnread = await Promise.all(
        data.map(async (member) => {
          const { count } = await supabase
            .from('internal_messages')
            .select('*', { count: 'exact', head: true })
            .eq('sender_id', member.id)
            .eq('recipient_id', currentUserId)
            .is('read_at', null);

          return { ...member, unread_count: count || 0 };
        })
      );

      setTeamMembers(membersWithUnread);
      updateTotalUnread();
    } catch (error) {
      console.error('Error loading team members:', error);
      toast.error('Erro ao carregar equipe');
    }
  };

  const updateTotalUnread = async () => {
    const { count } = await supabase
      .from('internal_messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', currentUserId)
      .is('read_at', null);

    setTotalUnread(count || 0);
  };

  const loadMessages = async () => {
    if (!selectedMember || !currentUserId) return;

    try {
      const { data, error } = await supabase
        .from('internal_messages')
        .select('*')
        .or(
          `and(sender_id.eq.${currentUserId},recipient_id.eq.${selectedMember.id}),and(sender_id.eq.${selectedMember.id},recipient_id.eq.${currentUserId})`
        )
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data);

      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Erro ao carregar mensagens');
    }
  };

  const markMessagesAsRead = async () => {
    if (!selectedMember || !currentUserId) return;

    await supabase
      .from('internal_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('sender_id', selectedMember.id)
      .eq('recipient_id', currentUserId)
      .is('read_at', null);

    // Update unread count locally
    setTeamMembers((prev) =>
      prev.map((member) =>
        member.id === selectedMember.id ? { ...member, unread_count: 0 } : member
      )
    );

    updateTotalUnread();
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedMember || !currentUserId || !currentCompany) {
      return;
    }

    try {
      const { error } = await supabase.from('internal_messages').insert({
        company_id: currentCompany.id,
        sender_id: currentUserId,
        recipient_id: selectedMember.id,
        content: newMessage.trim(),
        message_type: 'text',
      });

      if (error) throw error;

      setNewMessage('');
      toast.success('Mensagem enviada!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };

  const filteredMembers = teamMembers.filter(
    (member) =>
      member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <MessageSquare className="h-5 w-5" />
          {totalUnread > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {totalUnread > 9 ? '9+' : totalUnread}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Chat da Equipe</SheetTitle>
        </SheetHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Members List */}
          {!selectedMember && (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar na equipe..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-2">
                  {filteredMembers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum membro encontrado</p>
                    </div>
                  ) : (
                    filteredMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => setSelectedMember(member)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="relative">
                          <Avatar>
                            <AvatarImage src={member.avatar_url || undefined} />
                            <AvatarFallback>
                              {member.display_name?.charAt(0) || member.email?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {member.is_online && (
                            <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{member.display_name || member.full_name}</p>
                            {member.unread_count > 0 && (
                              <Badge variant="destructive" className="h-5 min-w-[20px] px-1">
                                {member.unread_count}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Chat Area */}
          {selectedMember && (
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setSelectedMember(null)}>
                  <X className="h-4 w-4" />
                </Button>
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={selectedMember.avatar_url || undefined} />
                    <AvatarFallback>
                      {selectedMember.display_name?.charAt(0) || selectedMember.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {selectedMember.is_online && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {selectedMember.display_name || selectedMember.full_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedMember.is_online ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma mensagem ainda</p>
                    <p className="text-sm">Envie uma mensagem para começar!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isFromMe = message.sender_id === currentUserId;
                      return (
                        <div
                          key={message.id}
                          className={cn('flex', isFromMe ? 'justify-end' : 'justify-start')}
                        >
                          <div
                            className={cn(
                              'max-w-[70%] rounded-lg px-4 py-2',
                              isFromMe ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            )}
                          >
                            <p className="break-words">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {format(new Date(message.created_at), 'HH:mm', { locale: ptBR })}
                              {isFromMe && message.read_at && ' • Lido'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={scrollRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite uma mensagem..."
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
