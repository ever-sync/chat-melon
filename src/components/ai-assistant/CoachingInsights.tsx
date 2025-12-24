import React from 'react';
import {
  Lightbulb,
  Trophy,
  TrendingUp,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useCoachingInsights, getCategoryIcon, getCategoryLabel } from '@/hooks/ai-assistant/useCoachingInsights';
import { useAuth } from '@/hooks/useAuth';
import { CoachingInsight, CoachingCategory } from '@/types/ai-assistant';

interface CoachingInsightsProps {
  companyId?: string;
}

export function CoachingInsights({ companyId }: CoachingInsightsProps) {
  const { user } = useAuth();

  const {
    insightsByCategory,
    isLoading,
    acknowledgeInsight,
  } = useCoachingInsights({
    agentId: user?.id,
    companyId,
    enabled: !!user?.id,
  });

  if (isLoading) {
    return <CoachingInsightsSkeleton />;
  }

  const hasAnyInsights =
    insightsByCategory.strength.length > 0 ||
    insightsByCategory.improvement_area.length > 0 ||
    insightsByCategory.achievement.length > 0;

  if (!hasAnyInsights) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Lightbulb className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          Nenhum insight disponível ainda
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Insights serão gerados com base no seu atendimento
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Pontos Fortes */}
      {insightsByCategory.strength.length > 0 && (
        <InsightSection
          title="Seus Pontos Fortes"
          icon={<Trophy className="h-4 w-4 text-yellow-500" />}
          insights={insightsByCategory.strength}
          variant="strength"
          onAcknowledge={acknowledgeInsight}
        />
      )}

      {/* Conquistas */}
      {insightsByCategory.achievement.length > 0 && (
        <InsightSection
          title="Conquistas Recentes"
          icon={<Sparkles className="h-4 w-4 text-purple-500" />}
          insights={insightsByCategory.achievement}
          variant="achievement"
          onAcknowledge={acknowledgeInsight}
        />
      )}

      {/* Oportunidades de Crescimento */}
      {insightsByCategory.improvement_area.length > 0 && (
        <InsightSection
          title="Oportunidades de Crescimento"
          icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
          insights={insightsByCategory.improvement_area}
          variant="improvement"
          onAcknowledge={acknowledgeInsight}
        />
      )}

      {/* Meta da Semana (placeholder - seria implementado com dados reais) */}
      <WeeklyGoalCard />
    </div>
  );
}

interface InsightSectionProps {
  title: string;
  icon: React.ReactNode;
  insights: CoachingInsight[];
  variant: 'strength' | 'achievement' | 'improvement' | 'concern';
  onAcknowledge: (id: string) => void;
}

function InsightSection({
  title,
  icon,
  insights,
  variant,
  onAcknowledge,
}: InsightSectionProps) {
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm flex items-center gap-2">
        {icon}
        {title}
      </h4>

      <div className="space-y-2">
        {insights.slice(0, 3).map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            variant={variant}
            onAcknowledge={onAcknowledge}
          />
        ))}
      </div>
    </div>
  );
}

interface InsightCardProps {
  insight: CoachingInsight;
  variant: 'strength' | 'achievement' | 'improvement' | 'concern';
  onAcknowledge: (id: string) => void;
}

function InsightCard({ insight, variant, onAcknowledge }: InsightCardProps) {
  const variantStyles = {
    strength: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    },
    achievement: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      icon: <Trophy className="h-4 w-4 text-purple-600" />,
    },
    improvement: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: <TrendingUp className="h-4 w-4 text-blue-600" />,
    },
    concern: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: <AlertCircle className="h-4 w-4 text-red-600" />,
    },
  };

  const styles = variantStyles[variant];

  return (
    <Card className={cn(styles.bg, styles.border)}>
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <div className="mt-0.5">{styles.icon}</div>
          <div className="flex-1 min-w-0">
            <h5 className="font-medium text-sm">{insight.title}</h5>
            {insight.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {insight.description}
              </p>
            )}

            {/* Ação recomendada */}
            {insight.recommended_action && (
              <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0 text-yellow-500" />
                <span>{insight.recommended_action}</span>
              </div>
            )}

            {/* Status badge para insights novos */}
            {insight.status === 'new' && (
              <Badge
                variant="secondary"
                className="mt-2 text-xs cursor-pointer hover:bg-secondary/80"
                onClick={() => onAcknowledge(insight.id)}
              >
                Marcar como visto
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WeeklyGoalCard() {
  // Dados simulados - seriam buscados de uma API real
  const goalProgress = 75;
  const goalDescription = 'Manter score de qualidade > 85';

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Meta da Semana</span>
        </div>

        <p className="text-xs text-muted-foreground mb-2">
          {goalDescription}
        </p>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span>Progresso</span>
            <span className="font-medium">{goalProgress}%</span>
          </div>
          <Progress value={goalProgress} className="h-2" />
        </div>

        {goalProgress >= 80 && (
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Continue assim! Você está quase lá!
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function CoachingInsightsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-28" />
    </div>
  );
}

export default CoachingInsights;
