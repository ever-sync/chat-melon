import { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/ui/use-mobile';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface MobileChatLayoutProps {
  selectedConversationId: string | null;
  onSelectConversation: (id: string | null) => void;
}

export const MobileChatLayout = ({
  selectedConversationId,
  onSelectConversation,
}: MobileChatLayoutProps) => {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  // Mobile: Mostrar lista OU conversa
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] pb-16">
      {!selectedConversationId ? (
        // Lista de conversas em tela cheia
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b bg-background sticky top-0 z-10">
            <h1 className="text-xl font-bold">Conversas</h1>
            <Button size="icon" className="rounded-full">
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          <div className="h-[calc(100%-4rem)] overflow-auto p-4 space-y-2">
            {/* Placeholder para demonstrar layout - ConversationList será renderizado aqui */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">João da Silva</p>
                    <p className="text-sm text-muted-foreground truncate">Última mensagem...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        // Conversa em tela cheia
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 p-4 border-b bg-background sticky top-0 z-10">
            <Button variant="ghost" size="icon" onClick={() => onSelectConversation(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold flex-1 truncate">Conversa</h2>
          </div>

          <div className="flex-1 overflow-hidden">
            {/* MessageArea será renderizado aqui */}
            <div className="p-4">
              <p className="text-muted-foreground">Área de mensagens</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
