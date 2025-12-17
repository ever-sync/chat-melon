import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SatisfactionBadgeProps {
  score: number;
  surveyType: 'csat' | 'nps';
}

export const SatisfactionBadge = ({ score, surveyType }: SatisfactionBadgeProps) => {
  const getVariant = () => {
    if (surveyType === 'csat') {
      if (score >= 4) return 'default';
      if (score >= 3) return 'secondary';
      return 'destructive';
    } else {
      if (score >= 9) return 'default';
      if (score >= 7) return 'secondary';
      return 'destructive';
    }
  };

  const renderStars = () => {
    const maxStars = surveyType === 'csat' ? 5 : 10;

    if (surveyType === 'nps') {
      return <span className="font-bold">{score}/10</span>;
    }

    return (
      <div className="flex items-center gap-0.5">
        {[...Array(maxStars)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${i < score ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-1 text-xs font-medium">({score})</span>
      </div>
    );
  };

  return (
    <Badge variant={getVariant()} className="flex items-center gap-1">
      {renderStars()}
    </Badge>
  );
};
