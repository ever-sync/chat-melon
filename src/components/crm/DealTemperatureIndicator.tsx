import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Flame, Snowflake, ThermometerSun } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DealTemperatureIndicatorProps {
  temperature: 'cold' | 'warm' | 'hot' | null;
  temperatureScore?: number | null;
  budgetConfirmed?: boolean;
  timelineConfirmed?: boolean;
  decisionMaker?: string | null;
  daysSinceActivity?: number;
  className?: string;
}

export const DealTemperatureIndicator = ({
  temperature,
  temperatureScore,
  budgetConfirmed,
  timelineConfirmed,
  decisionMaker,
  daysSinceActivity,
  className,
}: DealTemperatureIndicatorProps) => {
  const getTemperatureConfig = () => {
    switch (temperature) {
      case 'hot':
        return {
          label: 'Quente',
          icon: Flame,
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-100 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          progressColor: 'bg-red-500',
        };
      case 'warm':
        return {
          label: 'Morno',
          icon: ThermometerSun,
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          progressColor: 'bg-yellow-500',
        };
      case 'cold':
      default:
        return {
          label: 'Frio',
          icon: Snowflake,
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-100 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          progressColor: 'bg-blue-500',
        };
    }
  };

  const config = getTemperatureConfig();
  const Icon = config.icon;
  const score = temperatureScore || 50;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('inline-flex items-center gap-2', className)}>
            <Badge
              variant="outline"
              className={cn('gap-1.5 px-3 py-1', config.bgColor, config.borderColor, config.color)}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="font-semibold">{config.label}</span>
              {temperatureScore !== null && temperatureScore !== undefined && (
                <span className="text-xs opacity-80">({score}/100)</span>
              )}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="w-80 p-4">
          <div className="space-y-3">
            {/* Score visual */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold">Score de Temperatura</span>
                <span className={cn('text-lg font-bold', config.color)}>{score}/100</span>
              </div>
              <Progress value={score} className="h-2">
                <div
                  className={cn('h-full transition-all', config.progressColor)}
                  style={{ width: `${score}%` }}
                />
              </Progress>
            </div>

            {/* Fatores que afetam o score */}
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs font-semibold text-muted-foreground">
                Fatores que afetam a temperatura:
              </p>

              <div className="space-y-1.5 text-xs">
                {/* BANT - Budget */}
                <div className="flex items-center gap-2">
                  {budgetConfirmed ? (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span className="text-green-600 dark:text-green-400">
                        Orçamento confirmado (+20)
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      <span className="text-muted-foreground">Orçamento não confirmado</span>
                    </>
                  )}
                </div>

                {/* BANT - Timeline */}
                <div className="flex items-center gap-2">
                  {timelineConfirmed ? (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span className="text-green-600 dark:text-green-400">
                        Timeline confirmado (+20)
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      <span className="text-muted-foreground">Timeline não confirmado</span>
                    </>
                  )}
                </div>

                {/* BANT - Authority (Decision Maker) */}
                <div className="flex items-center gap-2">
                  {decisionMaker ? (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span className="text-green-600 dark:text-green-400">
                        Tomador de decisão identificado (+10)
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      <span className="text-muted-foreground">
                        Tomador de decisão não identificado
                      </span>
                    </>
                  )}
                </div>

                {/* Atividade recente */}
                {daysSinceActivity !== undefined && daysSinceActivity !== null && (
                  <div className="flex items-center gap-2">
                    {daysSinceActivity <= 3 ? (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-green-600 dark:text-green-400">
                          Atividade recente ({daysSinceActivity} dias atrás)
                        </span>
                      </>
                    ) : daysSinceActivity <= 7 ? (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                        <span className="text-yellow-600 dark:text-yellow-400">
                          Última atividade: {daysSinceActivity} dias atrás (-
                          {daysSinceActivity * 5})
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span className="text-red-600 dark:text-red-400">
                          Sem atividade há {daysSinceActivity} dias (-30)
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Dica de ação */}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                {score >= 70 ? (
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    💪 Negócio promissor! Continue engajando.
                  </span>
                ) : score >= 40 ? (
                  <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                    ⚠️ Precisa de atenção. Confirme BANT e mantenha contato.
                  </span>
                ) : (
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    🚨 Risco de perda! Ação urgente necessária.
                  </span>
                )}
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Versão compacta para uso em cards
export const DealTemperatureIcon = ({
  temperature,
  className,
}: {
  temperature: 'cold' | 'warm' | 'hot' | null;
  className?: string;
}) => {
  const getConfig = () => {
    switch (temperature) {
      case 'hot':
        return {
          icon: Flame,
          color: 'text-red-500',
          title: 'Negócio quente',
        };
      case 'warm':
        return {
          icon: ThermometerSun,
          color: 'text-yellow-500',
          title: 'Negócio morno',
        };
      case 'cold':
      default:
        return {
          icon: Snowflake,
          color: 'text-blue-500',
          title: 'Negócio frio',
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Icon className={cn('w-4 h-4', config.color, className)} />
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{config.title}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
