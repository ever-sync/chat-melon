import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Building2, Users, MessageSquare, TrendingUp } from "lucide-react";

export function PlatformMetrics() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["platform-metrics"],
    queryFn: async () => {
      const [companiesRes, usersRes, conversationsRes, dealsRes] = await Promise.all([
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("conversations").select("id", { count: "exact", head: true }),
        supabase.from("deals").select("id, value, status"),
      ]);

      const totalRevenue = (dealsRes.data || [])
        .filter((d) => d.status === "won")
        .reduce((sum, d) => sum + (d.value || 0), 0);

      return {
        totalCompanies: companiesRes.count || 0,
        totalUsers: usersRes.count || 0,
        totalConversations: conversationsRes.count || 0,
        totalRevenue,
      };
    },
  });

  if (isLoading) {
    return <div>Carregando métricas...</div>;
  }

  const cards = [
    {
      title: "Total de Empresas",
      value: metrics?.totalCompanies || 0,
      icon: Building2,
      color: "text-blue-500",
    },
    {
      title: "Total de Usuários",
      value: metrics?.totalUsers || 0,
      icon: Users,
      color: "text-green-500",
    },
    {
      title: "Total de Conversas",
      value: metrics?.totalConversations || 0,
      icon: MessageSquare,
      color: "text-purple-500",
    },
    {
      title: "Receita Total",
      value: `R$ ${((metrics?.totalRevenue || 0) / 1000).toFixed(1)}k`,
      icon: TrendingUp,
      color: "text-emerald-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <p className="text-2xl font-bold mt-1">{card.value}</p>
            </div>
            <div className={`p-3 rounded-lg bg-primary/10 ${card.color}`}>
              <card.icon className="h-6 w-6" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
