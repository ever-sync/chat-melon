import { Clock, Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageStatusProps {
  status: string;
  timestamp?: string;
  deliveredAt?: string;
  readAt?: string;
}

export function MessageStatus({ status, timestamp, deliveredAt, readAt }: MessageStatusProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3 text-muted-foreground" />;
      case 'sent':
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'played':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'error':
        return <span className="text-xs text-red-500">❌</span>;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    if (readAt) return `Lido ${new Date(readAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    if (deliveredAt) return `Entregue ${new Date(deliveredAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    if (timestamp) return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return '';
  };

  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="text-muted-foreground">{getStatusText()}</span>
      {getStatusIcon()}
    </div>
  );
}
