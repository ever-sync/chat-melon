import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
}

interface CampaignValidationProps {
  messageLength: number;
  sendingRate: number;
  totalContacts: number;
  isNewInstance?: boolean;
  instanceDaysSinceCreation?: number;
}

export function CampaignValidation({
  messageLength,
  sendingRate,
  totalContacts,
  isNewInstance,
  instanceDaysSinceCreation,
}: CampaignValidationProps) {
  const issues: ValidationIssue[] = [];

  // Message length validation
  if (messageLength > 1000) {
    issues.push({
      type: 'error',
      message: `Mensagem muito longa (${messageLength} caracteres). Máximo recomendado: 1000 caracteres.`,
    });
  } else if (messageLength > 800) {
    issues.push({
      type: 'warning',
      message: `Mensagem próxima do limite (${messageLength} caracteres). Considere reduzir para melhor entregabilidade.`,
    });
  }

  // Sending rate validation
  if (sendingRate > 30) {
    issues.push({
      type: 'warning',
      message: `Taxa de envio alta (${sendingRate} msgs/min). Risco de bloqueio aumentado. Recomendado: 10-20 msgs/min.`,
    });
  }

  // New instance warning
  if (isNewInstance && instanceDaysSinceCreation !== undefined) {
    if (sendingRate > 10) {
      issues.push({
        type: 'warning',
        message: `Instância nova (${instanceDaysSinceCreation} dias). Recomendamos começar com taxa menor (5-10 msgs/min) e aumentar gradualmente.`,
      });
    } else {
      issues.push({
        type: 'info',
        message: `Instância nova detectada. Taxa de ${sendingRate} msgs/min está adequada para warmup. Continue aumentando gradualmente nos próximos dias.`,
      });
    }
  }

  // Estimated time
  if (totalContacts > 0) {
    const estimatedMinutes = Math.ceil(totalContacts / sendingRate);
    const hours = Math.floor(estimatedMinutes / 60);
    const minutes = estimatedMinutes % 60;

    const timeStr = hours > 0 ? `${hours}h ${minutes}min` : `${minutes} minutos`;

    issues.push({
      type: 'info',
      message: `Tempo estimado de envio: ${timeStr}`,
    });
  }

  if (issues.length === 0) {
    return (
      <Card className="border-green-500/20 bg-green-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-500">Tudo Pronto!</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Sua campanha está configurada corretamente e pronta para ser enviada.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {issues.map((issue, index) => {
        const Icon =
          issue.type === 'error' ? AlertTriangle : issue.type === 'warning' ? AlertTriangle : Info;

        const colorClass =
          issue.type === 'error'
            ? 'border-red-500/20 bg-red-500/10'
            : issue.type === 'warning'
              ? 'border-yellow-500/20 bg-yellow-500/10'
              : 'border-blue-500/20 bg-blue-500/10';

        const iconColor =
          issue.type === 'error'
            ? 'text-red-500'
            : issue.type === 'warning'
              ? 'text-yellow-500'
              : 'text-blue-500';

        const textColor =
          issue.type === 'error'
            ? 'text-red-500'
            : issue.type === 'warning'
              ? 'text-yellow-500'
              : 'text-blue-500';

        const descColor =
          issue.type === 'error'
            ? 'text-red-600 dark:text-red-400'
            : issue.type === 'warning'
              ? 'text-yellow-600 dark:text-yellow-400'
              : 'text-blue-600 dark:text-blue-400';

        return (
          <Card key={index} className={`border ${colorClass}`}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-2">
                <Icon className={`h-5 w-5 ${iconColor} mt-0.5`} />
                <p className={`text-sm ${descColor}`}>{issue.message}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
