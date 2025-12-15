import { useNotifications } from "@/hooks/ui/useNotifications";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCheck,
  Trash2,
  MessageSquare,
  Calendar,
  TrendingUp,
  AlertTriangle,
  X,
  Trophy,
  FileText,
  CheckCircle,
  Settings,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export const NotificationCenter = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllRead,
  } = useNotifications();
  
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  const getIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "task":
        return <Calendar className="h-4 w-4 text-orange-500" />;
      case "deal":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "inactivity":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "system":
        return <Trophy className="h-4 w-4 text-purple-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const filteredNotifications = activeTab === "unread" 
    ? notifications.filter(n => !n.is_read) 
    : notifications;

  const renderNotificationList = (notificationsList: typeof notifications) => {
    if (notificationsList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            {activeTab === "unread" ? "Nenhuma notificação não lida" : "Nenhuma notificação ainda"}
          </p>
        </div>
      );
    }

    return (
      <div className="divide-y">
        {notificationsList.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "p-4 hover:bg-muted/50 transition-colors cursor-pointer relative group",
                  !notification.is_read && "bg-primary/5"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm line-clamp-1">
                        {notification.title}
                      </p>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {notification.message}
                    </p>
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  
                  {!notification.is_read && (
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                  )}
                </div>
              </div>
            ))}
          </div>
        );
  };

  return (
    <div className="flex flex-col h-[500px]">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Notificações</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/new-settings")}
            className="text-xs"
          >
            <Settings className="h-3 w-3 mr-1" />
            Configurações
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "unread")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">
              Todas {notifications.length > 0 && `(${notifications.length})`}
            </TabsTrigger>
            <TabsTrigger value="unread">
              Não lidas {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsRead()}
              className="text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
          
          {notifications.filter(n => n.is_read).length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearAllRead()}
              className="text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Limpar lidas
            </Button>
          )}
        </div>
      </div>

      {/* Lista de notificações */}
      <ScrollArea className="flex-1">
        {renderNotificationList(filteredNotifications)}
      </ScrollArea>
    </div>
  );
};
