import { Flame, Thermometer, Snowflake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LeadScoreBadgeProps {
  score: number;
  breakdown?: Record<string, number>;
}

export const LeadScoreBadge = ({ score, breakdown }: LeadScoreBadgeProps) => {
  const getScoreConfig = (score: number) => {
    if (score >= 80) {
      return {
        icon: Flame,
        label: 'Hot',
        color: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
        iconColor: 'text-red-500',
      };
    } else if (score >= 60) {
      return {
        icon: Flame,
        label: 'Warm',
        color: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20',
        iconColor: 'text-orange-500',
      };
    } else if (score >= 40) {
      return {
        icon: Thermometer,
        label: 'Cool',
        color: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
        iconColor: 'text-yellow-500',
      };
    } else {
      return {
        icon: Snowflake,
        label: 'Cold',
        color: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
        iconColor: 'text-blue-500',
      };
    }
  };

  const config = getScoreConfig(score);
  const Icon = config.icon;

  const breakdownText = breakdown && Object.keys(breakdown).length > 0 ? (
    <div className="space-y-1">
      {Object.entries(breakdown).map(([key, value]) => (
        <div key={key} className="text-xs flex justify-between gap-4">
          <span>{key}</span>
          <span className="font-medium">{value > 0 ? '+' : ''}{value}</span>
        </div>
      ))}
      <div className="border-t pt-1 mt-2 flex justify-between gap-4 font-semibold">
        <span>Total</span>
        <span>{score} pontos</span>
      </div>
    </div>
  ) : (
    <div className="text-xs">
      <p>Score: {score} pontos</p>
      <p className="text-muted-foreground mt-1">
        Nenhuma regra aplicada ainda
      </p>
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className={`${config.color} gap-1 cursor-help`}>
            <Icon className={`h-3 w-3 ${config.iconColor}`} />
            {score}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          {breakdownText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};