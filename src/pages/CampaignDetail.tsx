import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pause, Play, X, Download, FileText } from "lucide-react";
import { useCampaigns } from "@/hooks/useCampaigns";
import { supabase } from "@/integrations/supabase/client";
import { CampaignMetricsCards } from "@/components/campaigns/CampaignMetricsCards";
import { CampaignProgress } from "@/components/campaigns/CampaignProgress";
import { CampaignChart } from "@/components/campaigns/CampaignChart";
import { CampaignContactsList } from "@/components/campaigns/CampaignContactsList";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { campaigns, pauseCampaign, resumeCampaign, updateCampaign } = useCampaigns();
  const [campaign, setCampaign] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCampaign = () => {
      const found = campaigns.find(c => c.id === id);
      if (found) {
        setCampaign(found);
        setIsLoading(false);
      }
    };

    loadCampaign();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`campaign_${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'campaigns',
          filter: `id=eq.${id}`
        },
        (payload) => {
          setCampaign(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, campaigns]);

  const handlePause = async () => {
    if (!campaign) return;
    try {
      await pauseCampaign.mutateAsync(campaign.id);
      toast.success("Campanha pausada");
    } catch (error) {
      toast.error("Erro ao pausar campanha");
    }
  };

  const handleResume = async () => {
    if (!campaign) return;
    try {
      await resumeCampaign.mutateAsync(campaign.id);
      toast.success("Campanha retomada");
    } catch (error) {
      toast.error("Erro ao retomar campanha");
    }
  };

  const handleCancel = async () => {
    if (!campaign) return;
    if (!confirm("Tem certeza que deseja cancelar esta campanha?")) return;
    
    try {
      await updateCampaign.mutateAsync({
        id: campaign.id,
        status: 'cancelled'
      });
      toast.success("Campanha cancelada");
      navigate('/campaigns');
    } catch (error) {
      toast.error("Erro ao cancelar campanha");
    }
  };

  const handleExportCSV = async () => {
    if (!campaign) return;

    const { data: contacts } = await supabase
      .from('campaign_contacts')
      .select('*, contacts(name, phone_number)')
      .eq('campaign_id', campaign.id);

    if (!contacts) return;

    const csv = [
      ['Nome', 'Telefone', 'Status', 'Enviada em', 'Entregue em', 'Lida em', 'Respondeu em', 'Erro'],
      ...contacts.map(c => [
        c.contacts?.name || '',
        c.contacts?.phone_number || '',
        c.status || '',
        c.sent_at ? new Date(c.sent_at).toLocaleString('pt-BR') : '',
        c.delivered_at ? new Date(c.delivered_at).toLocaleString('pt-BR') : '',
        c.read_at ? new Date(c.read_at).toLocaleString('pt-BR') : '',
        c.replied_at ? new Date(c.replied_at).toLocaleString('pt-BR') : '',
        c.error_message || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campanha_${campaign.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast.success("CSV exportado com sucesso");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: string }> = {
      draft: { variant: 'secondary', label: 'Rascunho', icon: '📝' },
      scheduled: { variant: 'default', label: 'Agendada', icon: '📅' },
      running: { variant: 'default', label: 'Enviando', icon: '▶️' },
      paused: { variant: 'outline', label: 'Pausada', icon: '⏸️' },
      completed: { variant: 'default', label: 'Concluída', icon: '✅' },
      cancelled: { variant: 'destructive', label: 'Cancelada', icon: '❌' },
    };
    
    const config = variants[status] || variants.draft;
    return (
      <Badge variant={config.variant}>
        {config.icon} {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!campaign) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="text-4xl mb-4">❌</div>
              <h3 className="text-lg font-semibold mb-2">Campanha não encontrada</h3>
              <Button onClick={() => navigate('/campaigns')} className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Campanhas
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/campaigns')}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl">📊 {campaign.name}</CardTitle>
                    {getStatusBadge(campaign.status)}
                  </div>
                  {campaign.description && (
                    <p className="text-sm text-muted-foreground mt-1">{campaign.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {campaign.status === 'running' && (
                  <Button variant="outline" onClick={handlePause}>
                    <Pause className="h-4 w-4 mr-2" />
                    Pausar
                  </Button>
                )}
                {campaign.status === 'paused' && (
                  <Button onClick={handleResume}>
                    <Play className="h-4 w-4 mr-2" />
                    Retomar
                  </Button>
                )}
                {(campaign.status === 'running' || campaign.status === 'paused') && (
                  <Button variant="destructive" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                )}
                <Button variant="outline" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Metrics Cards */}
        <CampaignMetricsCards campaign={campaign} />

        {/* Progress Bar */}
        <CampaignProgress campaign={campaign} />

        {/* Real-time Chart */}
        <CampaignChart campaignId={campaign.id} />

        {/* Contacts List */}
        <CampaignContactsList campaignId={campaign.id} />
      </div>
    </MainLayout>
  );
}
