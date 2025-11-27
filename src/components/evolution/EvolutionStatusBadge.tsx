import { Badge } from "@/components/ui/badge";
import { Circle, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface EvolutionStatusBadgeProps {
  status: string;
  className?: string;
}

export const EvolutionStatusBadge = ({ status, className = "" }: EvolutionStatusBadgeProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          label: 'Conectado',
          icon: CheckCircle2,
          variant: 'default' as const,
          className: 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20',
        };
      case 'created':
        return {
          label: 'Aguardando',
          icon: AlertCircle,
          variant: 'secondary' as const,
          className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20',
        };
      case 'disconnected':
        return {
          label: 'Desconectado',
          icon: XCircle,
          variant: 'destructive' as const,
          className: 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20',
        };
      case 'creating':
        return {
          label: 'Criando',
          icon: Circle,
          variant: 'outline' as const,
          className: 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20',
        };
      case 'error':
        return {
          label: 'Erro',
          icon: XCircle,
          variant: 'destructive' as const,
          className: 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20',
        };
      default:
        return {
          label: 'Não criado',
          icon: Circle,
          variant: 'outline' as const,
          className: 'bg-muted text-muted-foreground',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`${config.className} ${className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
};