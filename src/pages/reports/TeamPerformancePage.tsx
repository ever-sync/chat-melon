import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGate } from '@/components/auth/PermissionGate';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Trophy,
  Clock,
  MessageSquare,
  DollarSign,
  Target,
  Users,
  Star,
  Download,
  Calendar,
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface SellerMetrics {
  member_id: string;
  display_name: string;
  avatar_url: string;
  role: string;
  team_name: string;
  
  // Chat
  conversations_total: number;
  conversations_resolved: number;
  messages_sent: number;
  avg_first_response_time: number;
  avg_response_time: number;
  resolution_rate: number;
  
  // CRM
  deals_created: number;
  deals_won: number;
  deals_lost: number;
  deals_value_won: number;
  conversion_rate: number;
  avg_ticket: number;
  
  // Satisfaction
  csat_avg: number;
  nps_score: number;
  
  // Goals
  goal_progress: number;
  goal_value: number;
  current_value: number;
}

interface TeamSummary {
  total_conversations: number;
  total_deals_won: number;
  total_value: number;
  avg_response_time: number;
  avg_csat: number;
  avg_conversion: number;
}

export default function TeamPerformancePage() {
  const { currentCompany } = useCompany();
  const companyId = currentCompany?.id;
  const { can } = usePermissions();
  
  const [period, setPeriod] = useState('month');
  const [teamFilter, setTeamFilter] = useState('all');
  const [sellers, setSellers] = useState<SellerMetrics[]>([]);
  const [summary, setSummary] = useState<TeamSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (companyId) {
      loadMetrics();
      loadTeams();
    }
  }, [companyId, period, teamFilter]);

  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case 'today':
        return { start: format(now, 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') };
      case 'week':
        return { start: format(subDays(now, 7), 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') };
      case 'month':
        return { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd') };
      default:
        return { start: format(subDays(now, 30), 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') };
    }
  };

  const loadMetrics = async () => {
    setIsLoading(true);
    const { start, end } = getDateRange();

    try {
      // Buscar membros
      const { data: members } = await supabase
        .from('company_members')
        .select(`
          id,
          display_name,
          avatar_url,
          role,
          team_id
        `)
        .eq('company_id', companyId)
        .eq('is_active', true);

      if (!members) {
        setSellers([]);
        setIsLoading(false);
        return;
      }

      // Buscar deals por membro
      const { data: deals } = await supabase
        .from('deals')
        .select('assigned_to, status, value, created_at, won_at, lost_at')
        .eq('company_id', companyId)
        .gte('created_at', start)
        .lte('created_at', end);

      // Buscar conversas por membro  
      const { data: conversations } = await supabase
        .from('conversations')
        .select('assigned_to, status, created_at, updated_at')
        .eq('company_id', companyId)
        .gte('created_at', start)
        .lte('created_at', end);

      // Agregar métricas por vendedor
      const aggregated = members.map(m => {
        const memberDeals = deals?.filter(d => d.assigned_to === m.id) || [];
        const memberConvs = conversations?.filter(c => c.assigned_to === m.id) || [];
        
        const dealsWon = memberDeals.filter(d => d.status === 'won').length;
        const dealsLost = memberDeals.filter(d => d.status === 'lost').length;
        const totalDeals = dealsWon + dealsLost;
        const valueWon = memberDeals
          .filter(d => d.status === 'won')
          .reduce((sum, d) => sum + Number(d.value || 0), 0);
        
        const convsResolved = memberConvs.filter(c => c.status === 'closed').length;

        return {
          member_id: m.id,
          display_name: m.display_name || 'Sem nome',
          avatar_url: m.avatar_url || '',
          role: m.role,
          team_name: '-',
          
          conversations_total: memberConvs.length,
          conversations_resolved: convsResolved,
          messages_sent: 0,
          avg_first_response_time: 0,
          avg_response_time: 0,
          resolution_rate: memberConvs.length > 0 
            ? Math.round((convsResolved / memberConvs.length) * 100) 
            : 0,
          
          deals_created: memberDeals.length,
          deals_won: dealsWon,
          deals_lost: dealsLost,
          deals_value_won: valueWon,
          conversion_rate: totalDeals > 0 
            ? Math.round((dealsWon / totalDeals) * 100) 
            : 0,
          avg_ticket: dealsWon > 0 ? valueWon / dealsWon : 0,
          
          csat_avg: 0,
          nps_score: 0,
          
          goal_progress: 0,
          goal_value: 0,
          current_value: 0,
        };
      });

      // Filtrar por equipe se necessário
      const filtered = teamFilter === 'all' 
        ? aggregated 
        : aggregated.filter(s => s.team_name === teamFilter);

      // Ordenar por valor vendido
      filtered.sort((a, b) => b.deals_value_won - a.deals_value_won);

      setSellers(filtered);

      // Calcular resumo
      const summaryData: TeamSummary = {
        total_conversations: filtered.reduce((acc, s) => acc + s.conversations_total, 0),
        total_deals_won: filtered.reduce((acc, s) => acc + s.deals_won, 0),
        total_value: filtered.reduce((acc, s) => acc + s.deals_value_won, 0),
        avg_response_time: filtered.length > 0 
          ? Math.round(filtered.reduce((acc, s) => acc + s.avg_response_time, 0) / filtered.length)
          : 0,
        avg_csat: filtered.length > 0
          ? Number((filtered.reduce((acc, s) => acc + Number(s.csat_avg), 0) / filtered.length).toFixed(1))
          : 0,
        avg_conversion: filtered.length > 0
          ? Math.round(filtered.reduce((acc, s) => acc + s.conversion_rate, 0) / filtered.length)
          : 0,
      };

      setSummary(summaryData);
    } catch (err) {
      console.error('Erro ao carregar métricas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeams = async () => {
    const { data } = await supabase
      .from('teams')
      .select('id, name')
      .eq('company_id', companyId);
    setTeams(data || []);
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Preparar dados para gráficos
  const chartData = sellers.slice(0, 10).map(s => ({
    name: s.display_name.split(' ')[0],
    vendas: s.deals_value_won,
    conversas: s.conversations_total,
    conversao: s.conversion_rate,
  }));

  return (
    <PermissionGate 
      permissions={['reports.view_all', 'reports.view_team', 'reports.view_own']}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Performance da Equipe</h2>
            <p className="text-muted-foreground">
              Acompanhe as métricas e resultados dos vendedores
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[150px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Última Semana</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-[150px]">
                <Users className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Equipes</SelectItem>
                {teams.map(t => (
                  <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <PermissionGate permission="reports.export">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <MessageSquare className="h-8 w-8 text-blue-500" />
                <Badge variant="outline">Chat</Badge>
              </div>
              <p className="text-2xl font-bold mt-2">{summary?.total_conversations || 0}</p>
              <p className="text-sm text-muted-foreground">Conversas</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Clock className="h-8 w-8 text-orange-500" />
                <Badge variant="outline">Tempo</Badge>
              </div>
              <p className="text-2xl font-bold mt-2">{formatTime(summary?.avg_response_time || 0)}</p>
              <p className="text-sm text-muted-foreground">Tempo Resposta</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Trophy className="h-8 w-8 text-yellow-500" />
                <Badge variant="outline">Vendas</Badge>
              </div>
              <p className="text-2xl font-bold mt-2">{summary?.total_deals_won || 0}</p>
              <p className="text-sm text-muted-foreground">Deals Ganhos</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <DollarSign className="h-8 w-8 text-green-500" />
                <Badge variant="outline">Receita</Badge>
              </div>
              <p className="text-2xl font-bold mt-2">{formatCurrency(summary?.total_value || 0)}</p>
              <p className="text-sm text-muted-foreground">Valor Total</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Target className="h-8 w-8 text-purple-500" />
                <Badge variant="outline">Taxa</Badge>
              </div>
              <p className="text-2xl font-bold mt-2">{summary?.avg_conversion || 0}%</p>
              <p className="text-sm text-muted-foreground">Conversão Média</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Star className="h-8 w-8 text-amber-500" />
                <Badge variant="outline">CSAT</Badge>
              </div>
              <p className="text-2xl font-bold mt-2">{summary?.avg_csat || 0}</p>
              <p className="text-sm text-muted-foreground">Satisfação</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendas por Vendedor</CardTitle>
              <CardDescription>Top 10 vendedores por valor vendido</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="vendas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Taxa de Conversão</CardTitle>
              <CardDescription>Conversão por vendedor</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `${value}%`} />
                  <Bar dataKey="conversao" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Ranking Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Ranking de Vendedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead className="text-center">Conversas</TableHead>
                  <TableHead className="text-center">Tempo Resp.</TableHead>
                  <TableHead className="text-center">Deals</TableHead>
                  <TableHead className="text-center">Conversão</TableHead>
                  <TableHead className="text-right">Valor Vendido</TableHead>
                  <TableHead className="text-center">CSAT</TableHead>
                  <TableHead className="text-center">Meta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellers.map((seller, index) => (
                  <TableRow key={seller.member_id}>
                    <TableCell>
                      {index === 0 && <span className="text-2xl">🥇</span>}
                      {index === 1 && <span className="text-2xl">🥈</span>}
                      {index === 2 && <span className="text-2xl">🥉</span>}
                      {index > 2 && <span className="text-muted-foreground">{index + 1}</span>}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={seller.avatar_url} />
                          <AvatarFallback>{seller.display_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{seller.display_name}</p>
                          <p className="text-xs text-muted-foreground">{seller.team_name}</p>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div>
                        <p className="font-medium">{seller.conversations_total}</p>
                        <p className="text-xs text-muted-foreground">
                          {seller.resolution_rate}% resolvidas
                        </p>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <Badge variant={seller.avg_response_time < 300 ? 'default' : 'secondary'}>
                        {formatTime(seller.avg_response_time)}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div>
                        <span className="text-green-600 font-medium">{seller.deals_won}</span>
                        <span className="text-muted-foreground mx-1">/</span>
                        <span className="text-red-600">{seller.deals_lost}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <Badge variant={seller.conversion_rate >= 50 ? 'default' : 'secondary'}>
                        {seller.conversion_rate}%
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-right font-medium">
                      {formatCurrency(seller.deals_value_won)}
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span>{seller.csat_avg}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="w-24">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>{seller.goal_progress}%</span>
                        </div>
                        <Progress 
                          value={Math.min(seller.goal_progress, 100)} 
                          className="h-2"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
}
