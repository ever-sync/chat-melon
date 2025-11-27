import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface CampaignProgressProps {
  campaign: any;
}

export function CampaignProgress({ campaign }: CampaignProgressProps) {
  const progress = campaign.total_contacts > 0 
    ? (campaign.sent_count / campaign.total_contacts) * 100 
    : 0;

  // Calculate ETA based on sending rate
  const remainingContacts = campaign.total_contacts - campaign.sent_count;
  const etaMinutes = campaign.sending_rate > 0 
    ? Math.ceil(remainingContacts / campaign.sending_rate) 
    : 0;

  const formatETA = (minutes: number) => {
    if (minutes === 0) return "Concluído";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progresso de Envio</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso:</span>
            <span className="font-medium">
              {campaign.sent_count} / {campaign.total_contacts} ({progress.toFixed(1)}%)
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Velocidade:</div>
            <div className="font-medium">{campaign.sending_rate} msgs/min</div>
          </div>
          <div>
            <div className="text-muted-foreground">ETA:</div>
            <div className="font-medium">{formatETA(etaMinutes)}</div>
          </div>
        </div>

        {campaign.status === 'running' && progress < 100 && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>Enviando mensagens...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
