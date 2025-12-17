import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSubscriptionBadge } from '@/hooks/useSubscriptionStatus';
import { Zap, Crown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Badge que mostra o status do plano no header
 * Clique para ver detalhes e fazer upgrade
 */
export function TrialBadge() {
  const navigate = useNavigate();
  const { badgeVariant, badgeText, status, daysRemaining, isTrialExpired } = useSubscriptionBadge();

  // Ícone baseado no status
  const Icon = isTrialExpired
    ? AlertTriangle
    : status === 'active'
      ? CheckCircle2
      : status === 'trial'
        ? Zap
        : Crown;

  // Classes de animação para badges urgentes
  const badgeClasses = cn(
    'cursor-pointer transition-all hover:scale-105',
    isTrialExpired && 'animate-pulse',
    daysRemaining <= 1 && status === 'trial' && 'animate-pulse'
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge variant={badgeVariant} className={badgeClasses}>
          <Icon className="mr-1 h-3 w-3" />
          {badgeText}
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          {/* Header */}
          <div className="space-y-1">
            <h4 className="font-semibold leading-none">Status da Assinatura</h4>
            <p className="text-sm text-muted-foreground">
              {status === 'trial' &&
                !isTrialExpired &&
                'Você está no período de avaliação gratuita'}
              {status === 'trial' && isTrialExpired && 'Seu período de avaliação expirou'}
              {status === 'active' && 'Sua assinatura está ativa'}
              {status === 'expired' && 'Sua assinatura expirou'}
              {status === 'cancelled' && 'Sua assinatura foi cancelada'}
            </p>
          </div>

          {/* Informações do trial */}
          {status === 'trial' && (
            <div className="rounded-lg border p-3 space-y-2">
              {!isTrialExpired ? (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Dias restantes:</span>
                    <span
                      className={cn(
                        'font-semibold',
                        daysRemaining <= 1 && 'text-destructive',
                        daysRemaining <= 3 && daysRemaining > 1 && 'text-orange-600'
                      )}
                    >
                      {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}
                    </span>
                  </div>
                  {daysRemaining <= 3 && (
                    <p className="text-xs text-muted-foreground">
                      Aproveite para escolher um plano e continuar usando a plataforma sem
                      interrupções.
                    </p>
                  )}
                </>
              ) : (
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                  <p className="text-sm text-destructive">
                    Escolha um plano para continuar usando a plataforma
                  </p>
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="space-y-2">
            {(status === 'trial' || status === 'expired') && (
              <Button className="w-full" size="sm" onClick={() => navigate('/upgrade')}>
                <Crown className="mr-2 h-4 w-4" />
                {isTrialExpired ? 'Escolher Plano Agora' : 'Ver Planos e Preços'}
              </Button>
            )}
            {status === 'active' && (
              <Button
                variant="outline"
                className="w-full"
                size="sm"
                onClick={() => navigate('/settings/billing')}
              >
                Gerenciar Assinatura
              </Button>
            )}
          </div>

          {/* Footer */}
          {status === 'trial' && !isTrialExpired && (
            <p className="text-xs text-center text-muted-foreground">
              Sem compromisso • Cancele quando quiser
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
