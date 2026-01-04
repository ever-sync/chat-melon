import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  Send, 
  User, 
  Search, 
  X, 
  Paperclip, 
  Smile, 
  ImageIcon, 
  FileIcon, 
  Loader2,
  CheckCircle,
  CheckSquare
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const EMOJIS = ['😀', '😂', '😍', '👍', '🙏', '❤️', '🔥', '✨', '👏', '🙌', '🎉', '💡', '✅', '❌', '🤔', '👀'];

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

  const sendMessage = async (e?: React.FormEvent, contentOverride?: string, mediaData?: { url: string; type: string; name: string }) => {
    if (e) e.preventDefault();

    const finalContent = contentOverride || newMessage.trim();
    if (!finalContent && !mediaData) return;

    if (!selectedMember || !currentUserId || !currentCompany) {
      return;
    }

    try {
      const { error } = await supabase.from('internal_messages').insert({
        company_id: currentCompany.id,
        sender_id: currentUserId,
        recipient_id: selectedMember.id,
        content: finalContent || (mediaData?.type === 'image' ? 'Imagem' : 'Arquivo'),
        message_type: mediaData ? (mediaData.type as any) : 'text',
        media_url: mediaData?.url || null,
      });

      if (error) throw error;

      if (!contentOverride) setNewMessage('');
      
      // Scroll to bottom
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentCompany || !currentUserId) return;

    // Check size (limit 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máx 10MB)');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUserId}/${Date.now()}.${fileExt}`;
      const isImage = file.type.startsWith('image/');
      
      const { data, error } = await supabase.storage
        .from('internal-chat-media')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('internal-chat-media')
        .getPublicUrl(data.path);

      await sendMessage(undefined, undefined, {
        url: publicUrl,
        type: isImage ? 'image' : 'file',
        name: file.name
      });

      toast.success('Arquivo enviado!');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Erro ao enviar arquivo');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
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
              <ScrollArea className="flex-1 p-4 bg-accent/5">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                    <div className="bg-primary/5 p-4 rounded-full mb-4">
                      <MessageSquare className="h-10 w-10 text-primary/40" />
                    </div>
                    <p className="font-medium">Nenhuma mensagem ainda</p>
                    <p className="text-sm opacity-70 mt-1">Envie uma mensagem para começar a colaborar!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((message, index) => {
                      const isFromMe = message.sender_id === currentUserId;
                      const showDate = index === 0 || 
                        format(new Date(messages[index-1].created_at), 'yyyy-MM-dd') !== format(new Date(message.created_at), 'yyyy-MM-dd');

                      return (
                        <div key={message.id} className="space-y-4">
                          {showDate && (
                            <div className="flex justify-center my-4">
                              <Badge variant="outline" className="text-[10px] font-normal opacity-50 px-2 py-0 bg-background">
                                {format(new Date(message.created_at), "d 'de' MMMM", { locale: ptBR })}
                              </Badge>
                            </div>
                          )}
                          <div className={cn('flex items-end gap-2', isFromMe ? 'flex-row-reverse' : 'flex-row')}>
                            <Avatar className="h-6 w-6 opacity-80 flex-shrink-0">
                                <AvatarImage src={(isFromMe ? null : selectedMember.avatar_url) || undefined} />
                                <AvatarFallback className="text-[8px]">
                                    {isFromMe ? 'Eu' : (selectedMember.display_name?.charAt(0) || '?')}
                                </AvatarFallback>
                            </Avatar>
                            <div
                              className={cn(
                                'max-w-[80%] rounded-2xl px-4 py-2 shadow-sm',
                                isFromMe 
                                  ? 'bg-primary text-primary-foreground rounded-br-none' 
                                  : 'bg-white border rounded-bl-none'
                              )}
                            >
                              {message.message_type === 'image' && message.media_url && (
                                <div className="mb-2 rounded-lg overflow-hidden border border-black/5 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(message.media_url!, '_blank')}>
                                  <img src={message.media_url} alt="Shared" className="max-w-full h-auto max-h-[300px] object-contain" />
                                </div>
                              )}

                              {message.message_type === 'file' && message.media_url && (
                                <button 
                                  onClick={() => window.open(message.media_url!, '_blank')}
                                  className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl mb-2 transition-colors",
                                    isFromMe ? "bg-white/10 hover:bg-white/20" : "bg-accent/30 hover:bg-accent/50"
                                  )}
                                >
                                  <div className={cn("p-2 rounded-lg", isFromMe ? "bg-white/20" : "bg-primary/10")}>
                                    <FileIcon className={cn("h-5 w-5", isFromMe ? "text-white" : "text-primary")} />
                                  </div>
                                  <div className="text-left overflow-hidden">
                                      <p className="text-sm font-medium truncate max-w-[150px]">{message.content || 'Arquivo'}</p>
                                      <p className="text-[10px] opacity-70">Clique para baixar</p>
                                  </div>
                                </button>
                              )}

                              <p className="break-words text-[15px]">{message.content}</p>
                              <p className={cn(
                                "text-[10px] mt-1 flex items-center gap-1 justify-end opacity-70",
                                isFromMe ? "text-primary-foreground/80" : "text-muted-foreground"
                              )}>
                                {format(new Date(message.created_at), 'HH:mm', { locale: ptBR })}
                                {isFromMe && (
                                  message.read_at ? <CheckCircle className="h-3 w-3 text-green-300" /> : <CheckSquare className="h-3 w-3" />
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={scrollRef} className="h-2" />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t bg-background">
                <form onSubmit={sendMessage} className="flex flex-col gap-2">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 bg-accent/30 rounded-2xl border flex items-center px-2 py-1 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full flex-shrink-0">
                            <Smile className="h-5 w-5 text-muted-foreground" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent side="top" align="start" className="w-[200px] p-2">
                           <div className="grid grid-cols-4 gap-1">
                              {EMOJIS.map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => addEmoji(emoji)}
                                  className="h-8 w-8 text-xl flex items-center justify-center hover:bg-accent rounded-lg transition-colors"
                                >
                                  {emoji}
                                </button>
                              ))}
                           </div>
                        </PopoverContent>
                      </Popover>

                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Digite uma mensagem..."
                        className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2 h-10"
                      />

                      <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                      />
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full flex-shrink-0" disabled={isUploading}>
                            {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5 text-muted-foreground" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                              <ImageIcon className="h-4 w-4 mr-2" />
                              Imagem
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                              <FileIcon className="h-4 w-4 mr-2" />
                              Arquivo
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <Button type="submit" size="icon" className="h-11 w-11 rounded-2xl shadow-md" disabled={!newMessage.trim() && !isUploading}>
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
