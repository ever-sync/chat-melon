import React, { useState, useEffect } from 'react';
import { Bot, X, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AssistantPanel } from './AssistantPanel';
import { useAssistant } from '@/hooks/ai-assistant';

interface FloatingAssistantProps {
  className?: string;
  conversationId?: string;
  companyId?: string;
}

export function FloatingAssistant({ className, conversationId, companyId }: FloatingAssistantProps) {
  const {
    isExpanded,
    toggleExpanded,
    alertCount,
    urgentAlerts,
    settings,
    isEnabled,
  } = useAssistant();

  const [isAnimating, setIsAnimating] = useState(false);

  // Animar quando houver novos alertas urgentes
  useEffect(() => {
    if (urgentAlerts.length > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [urgentAlerts.length]);

  // Se o assistente estiver desabilitado, não renderizar
  if (!isEnabled) {
    return null;
  }

  const position = settings?.position === 'bottom-right' ? 'right-5' : 'left-5';

  return (
    <div
      className={cn(
        'fixed bottom-5 z-50 transition-all duration-300',
        position,
        className
      )}
    >
      {isExpanded ? (
        <AssistantPanel
          onClose={toggleExpanded}
          conversationId={conversationId}
          companyId={companyId}
        />
      ) : (
        <Button
          onClick={toggleExpanded}
          className={cn(
            'relative h-16 w-16 rounded-full shadow-lg transition-all duration-200',
            'bg-gradient-to-br from-primary to-primary/80',
            'hover:scale-105 hover:shadow-xl',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            isAnimating && 'animate-pulse'
          )}
        >
          <Bot className="h-7 w-7 text-white" />

          {/* Badge de alertas */}
          {alertCount > 0 && (
            <Badge
              className={cn(
                'absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5',
                urgentAlerts.length > 0
                  ? 'bg-red-500 text-white animate-bounce'
                  : 'bg-orange-500 text-white'
              )}
            >
              {alertCount > 99 ? '99+' : alertCount}
            </Badge>
          )}

          {/* Indicador de pulso quando há alertas urgentes */}
          {urgentAlerts.length > 0 && (
            <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-25" />
          )}
        </Button>
      )}
    </div>
  );
}

// Componente wrapper que inclui o Provider
import { AssistantProvider } from '@/hooks/ai-assistant';

interface FloatingAssistantWrapperProps {
  companyId?: string;
  currentConversationId?: string;
  className?: string;
}

export function FloatingAssistantWrapper({
  companyId,
  currentConversationId,
  className,
}: FloatingAssistantWrapperProps) {
  return (
    <AssistantProvider
      companyId={companyId}
      currentConversationId={currentConversationId}
    >
      <FloatingAssistant
        className={className}
        conversationId={currentConversationId}
        companyId={companyId}
      />
    </AssistantProvider>
  );
}

export default FloatingAssistantWrapper;
