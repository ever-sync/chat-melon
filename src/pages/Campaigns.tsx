import { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Play, Pause, Trash2, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCampaigns } from '@/hooks/useCampaigns';
import { CampaignBuilder } from '@/components/campaigns/CampaignBuilder';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Campaigns() {
  const [showBuilder, setShowBuilder] = useState(false);
  const { campaigns, isLoading, startCampaign, pauseCampaign, resumeCampaign, deleteCampaign } =
    useCampaigns();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      draft: { variant: 'secondary', label: 'Rascunho' },
      scheduled: { variant: 'default', label: 'Agendada' },
      running: { variant: 'default', label: 'Enviando' },
      paused: { variant: 'outline', label: 'Pausada' },
      completed: { variant: 'default', label: 'Concluída' },
      cancelled: { variant: 'destructive', label: 'Cancelada' },
    };

    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleAction = async (
    action: 'start' | 'pause' | 'resume' | 'delete',
    campaignId: string
  ) => {
    try {
      switch (action) {
        case 'start':
          await startCampaign.mutateAsync(campaignId);
          break;
        case 'pause':
          await pauseCampaign.mutateAsync(campaignId);
          break;
        case 'resume':
          await resumeCampaign.mutateAsync(campaignId);
          break;
        case 'delete':
          if (confirm('Tem certeza que deseja excluir esta campanha?')) {
            await deleteCampaign.mutateAsync(campaignId);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling campaign action:', error);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Campanhas em Massa</h1>
            <p className="text-muted-foreground">
              Envie mensagens para múltiplos contatos de forma organizada
            </p>
          </div>
          <Button onClick={() => setShowBuilder(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Campanha
          </Button>
        </div>

        {/* Campaigns List */}
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="text-4xl mb-4">📢</div>
              <h3 className="text-lg font-semibold mb-2">Nenhuma campanha criada</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Crie sua primeira campanha para começar a enviar mensagens em massa
              </p>
              <Button onClick={() => setShowBuilder(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Campanha
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {campaigns.map((campaign) => {
              const deliveryRate =
                campaign.total_contacts > 0
                  ? (campaign.sent_count / campaign.total_contacts) * 100
                  : 0;

              return (
                <Card
                  key={campaign.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => (window.location.href = `/campaigns/${campaign.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl">{campaign.name}</CardTitle>
                          {getStatusBadge(campaign.status)}
                        </div>
                        {campaign.description && (
                          <CardDescription>{campaign.description}</CardDescription>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Criada em{' '}
                          {format(new Date(campaign.created_at), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {campaign.status === 'draft' && (
                            <DropdownMenuItem onClick={() => handleAction('start', campaign.id)}>
                              <Play className="h-4 w-4 mr-2" />
                              Iniciar
                            </DropdownMenuItem>
                          )}
                          {campaign.status === 'running' && (
                            <DropdownMenuItem onClick={() => handleAction('pause', campaign.id)}>
                              <Pause className="h-4 w-4 mr-2" />
                              Pausar
                            </DropdownMenuItem>
                          )}
                          {campaign.status === 'paused' && (
                            <DropdownMenuItem onClick={() => handleAction('resume', campaign.id)}>
                              <Play className="h-4 w-4 mr-2" />
                              Retomar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleAction('delete', campaign.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progresso de Envio</span>
                        <span className="font-medium">
                          {campaign.sent_count} / {campaign.total_contacts}
                        </span>
                      </div>
                      <Progress value={deliveryRate} />
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <div className="text-2xl font-bold text-primary">{campaign.sent_count}</div>
                        <div className="text-xs text-muted-foreground">Enviadas</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          {campaign.delivered_count}
                        </div>
                        <div className="text-xs text-muted-foreground">Entregues</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">{campaign.read_count}</div>
                        <div className="text-xs text-muted-foreground">Lidas</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          {campaign.reply_count}
                        </div>
                        <div className="text-xs text-muted-foreground">Respostas</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-destructive">
                          {campaign.failed_count}
                        </div>
                        <div className="text-xs text-muted-foreground">Falhas</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Campaign Builder Dialog */}
        <CampaignBuilder open={showBuilder} onOpenChange={setShowBuilder} />
      </div>
    </MainLayout>
  );
}
