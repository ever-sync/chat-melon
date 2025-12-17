import { useEffect, useState } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type NotificationHistoryItem = {
  id: string;
  title: string;
  body: string;
  message_type: string;
  read: boolean;
  created_at: string;
  conversation_id: string;
};

interface NotificationHistoryDialogProps {
  onSelectConversation?: (conversationId: string) => void;
  inModal?: boolean;
}

export const NotificationHistoryDialog = ({
  onSelectConversation,
  inModal = false,
}: NotificationHistoryDialogProps) => {
  const [notifications, setNotifications] = useState<NotificationHistoryItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen || inModal) {
      loadNotifications();
    }
  }, [isOpen, inModal]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notification_history')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast.error('Não foi possível carregar o histórico de notificações');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notification_history')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notification_history')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => n.id !== id));

      toast.success('Notificação removida do histórico');
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
      toast.error('Não foi possível remover a notificação');
    }
  };

  const clearAllRead = async () => {
    try {
      const readIds = notifications.filter((n) => n.read).map((n) => n.id);

      const { error } = await supabase
        .from('notification_history')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', readIds);

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => !n.read));

      toast.success('Notificações lidas foram removidas');
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
      toast.error('Não foi possível limpar o histórico');
    }
  };

  const handleNotificationClick = (notification: NotificationHistoryItem) => {
    markAsRead(notification.id);
    if (onSelectConversation) {
      onSelectConversation(notification.conversation_id);
    }
    setIsOpen(false);
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'audio':
        return '🎤';
      case 'media':
        return '📷';
      case 'poll':
        return '📊';
      case 'list':
        return '📋';
      case 'contact':
        return '👤';
      case 'location':
        return '📍';
      default:
        return '💬';
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Se está dentro de um modal, renderiza apenas o conteúdo
  if (inModal) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          {notifications.filter((n) => n.read).length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllRead}>
              Limpar lidas
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                    notification.read ? 'bg-muted/50' : 'bg-background'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {getMessageTypeIcon(notification.message_type)}
                        </span>
                        <p className="font-semibold text-sm">{notification.title}</p>
                        {!notification.read && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.body}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    );
  }

  // Renderização standalone (com Dialog)
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Histórico de Notificações</DialogTitle>
            {notifications.filter((n) => n.read).length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllRead}>
                Limpar lidas
              </Button>
            )}
          </div>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                    notification.read ? 'bg-muted/50' : 'bg-background'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {getMessageTypeIcon(notification.message_type)}
                        </span>
                        <p className="font-semibold text-sm">{notification.title}</p>
                        {!notification.read && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.body}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
