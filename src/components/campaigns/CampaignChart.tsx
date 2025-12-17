import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';

interface CampaignChartProps {
  campaignId: string;
}

export function CampaignChart({ campaignId }: CampaignChartProps) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch campaign status snapshots (we'll need to track these over time)
      // For now, create a simple mock based on current state
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (!campaign) return;

      // Generate simple time-series data based on progress
      const points = 10;
      const mockData = Array.from({ length: points }, (_, i) => {
        const progress = (i + 1) / points;
        return {
          time: `${i * 10}min`,
          enviadas: Math.floor(campaign.sent_count * progress),
          entregues: Math.floor(campaign.delivered_count * progress),
          lidas: Math.floor(campaign.read_count * progress),
        };
      });

      setData(mockData);
    };

    fetchData();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`campaign_chart_${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'campaigns',
          filter: `id=eq.${campaignId}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>📈 Métricas em Tempo Real</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="enviadas"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              name="Enviadas"
            />
            <Line
              type="monotone"
              dataKey="entregues"
              stroke="hsl(142, 76%, 36%)"
              strokeWidth={2}
              name="Entregues"
            />
            <Line
              type="monotone"
              dataKey="lidas"
              stroke="hsl(221, 83%, 53%)"
              strokeWidth={2}
              name="Lidas"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
