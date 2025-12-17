import { Card, CardContent } from '@/components/ui/card';
import { Send, CheckCheck, Eye, MessageCircle, XCircle } from 'lucide-react';

interface CampaignMetricsCardsProps {
  campaign: any;
}

export function CampaignMetricsCards({ campaign }: CampaignMetricsCardsProps) {
  const deliveredRate =
    campaign.sent_count > 0
      ? ((campaign.delivered_count / campaign.sent_count) * 100).toFixed(1)
      : '0';

  const readRate =
    campaign.delivered_count > 0
      ? ((campaign.read_count / campaign.delivered_count) * 100).toFixed(1)
      : '0';

  const replyRate =
    campaign.read_count > 0 ? ((campaign.reply_count / campaign.read_count) * 100).toFixed(1) : '0';

  const failRate =
    campaign.total_contacts > 0
      ? ((campaign.failed_count / campaign.total_contacts) * 100).toFixed(1)
      : '0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Sent */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Enviadas</div>
            <Send className="h-5 w-5 text-primary" />
          </div>
          <div className="text-3xl font-bold">{campaign.sent_count}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {((campaign.sent_count / campaign.total_contacts) * 100).toFixed(0)}% do total
          </div>
        </CardContent>
      </Card>

      {/* Delivered */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Entregues</div>
            <CheckCheck className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold">{campaign.delivered_count}</div>
          <div className="text-xs text-muted-foreground mt-1">{deliveredRate}% das enviadas</div>
        </CardContent>
      </Card>

      {/* Read */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Lidas</div>
            <Eye className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold">{campaign.read_count}</div>
          <div className="text-xs text-muted-foreground mt-1">{readRate}% das entregues</div>
        </CardContent>
      </Card>

      {/* Replies */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Respostas</div>
            <MessageCircle className="h-5 w-5 text-purple-500" />
          </div>
          <div className="text-3xl font-bold">{campaign.reply_count}</div>
          <div className="text-xs text-muted-foreground mt-1">{replyRate}% das lidas</div>
        </CardContent>
      </Card>
    </div>
  );
}
