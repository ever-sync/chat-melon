import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Users, MessageSquare, TrendingUp, Settings } from "lucide-react";
import { GroupActions } from "./GroupManager";

interface Group {
  id: string;
  name: string;
  description: string;
  group_id: string;
  profile_pic_url: string | null;
  created_at: string;
}

export function GroupDashboard() {
  const { currentCompany } = useCompany();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!currentCompany) return;

    const fetchGroups = async () => {
      const { data } = await supabase
        .from('groups')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false });

      if (data) {
        setGroups(data);
        
        // Buscar estatísticas para cada grupo
        const groupStats: Record<string, any> = {};
        for (const group of data) {
          const { count: participantCount } = await supabase
            .from('group_participants')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          const { count: messageCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', group.id);

          groupStats[group.id] = {
            participants: participantCount || 0,
            messages: messageCount || 0
          };
        }
        setStats(groupStats);
      }
    };

    fetchGroups();

    // Realtime subscription
    const channel = supabase
      .channel('groups-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'groups',
          filter: `company_id=eq.${currentCompany.id}`
        },
        () => fetchGroups()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentCompany]);

  if (!currentCompany) {
    return <div className="text-center py-8 text-muted-foreground">Selecione uma empresa</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Grupos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participantes Totais</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(stats).reduce((acc: number, s: any) => acc + (s.participants || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensagens em Grupos</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(stats).reduce((acc: number, s: any) => acc + (s.messages || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {groups.map((group) => (
          <Card key={group.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {group.profile_pic_url ? (
                    <img src={group.profile_pic_url} alt={group.name} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <CardTitle>{group.name}</CardTitle>
                    {group.description && (
                      <p className="text-sm text-muted-foreground">{group.description}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedGroup(selectedGroup === group.id ? null : group.id)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Badge variant="secondary">
                  {stats[group.id]?.participants || 0} participantes
                </Badge>
                <Badge variant="secondary">
                  {stats[group.id]?.messages || 0} mensagens
                </Badge>
              </div>

              {selectedGroup === group.id && (
                <GroupActions groupId={group.group_id} companyId={currentCompany.id} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {groups.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum grupo criado ainda</p>
        </div>
      )}
    </div>
  );
}