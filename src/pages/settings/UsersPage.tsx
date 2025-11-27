import { useState, useEffect } from 'react';
import { toast } from 'sonner';
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UserPlus,
  MoreVertical,
  Search,
  Shield,
  Users,
  UserCog,
  Mail,
  Phone,
  Clock,
  Activity,
  Edit,
  Trash2,
  Key,
  RefreshCw,
} from 'lucide-react';

interface Member {
  id: string;
  user_id: string;
  role: string;
  display_name: string;
  email: string;
  phone: string;
  avatar_url: string;
  is_active: boolean;
  can_receive_chats: boolean;
  max_concurrent_chats: number;
  is_online: boolean;
  last_seen_at: string;
  current_status: string;
  team: { id: string; name: string } | null;
  created_at: string;
}

interface Team {
  id: string;
  name: string;
  color: string;
  member_count: number;
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  owner: { label: 'Proprietário', color: 'bg-purple-500' },
  admin: { label: 'Administrador', color: 'bg-red-500' },
  manager: { label: 'Gerente', color: 'bg-blue-500' },
  supervisor: { label: 'Supervisor', color: 'bg-orange-500' },
  seller: { label: 'Vendedor', color: 'bg-green-500' },
  viewer: { label: 'Visualizador', color: 'bg-gray-500' },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  online: { label: 'Online', color: 'bg-green-500' },
  away: { label: 'Ausente', color: 'bg-yellow-500' },
  busy: { label: 'Ocupado', color: 'bg-red-500' },
  offline: { label: 'Offline', color: 'bg-gray-400' },
};

export default function UsersPage() {
  const { currentCompany } = useCompany();
  const companyId = currentCompany?.id;
  const { can, isAtLeast } = usePermissions();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal states
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  
  // Form states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('seller');
  const [inviteTeam, setInviteTeam] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (companyId) {
      loadMembers();
      loadTeams();
    }
  }, [companyId]);

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('company_members')
        .select(`
          *,
          team:teams(id, name)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error('Erro ao carregar membros:', err);
      toast.error('Não foi possível carregar os usuários');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeams = async () => {
    const { data } = await supabase
      .from('teams')
      .select('id, name, color')
      .eq('company_id', companyId);
    setTeams((data || []).map(t => ({ ...t, member_count: 0 })));
  };

  const handleInvite = async () => {
    if (!inviteEmail) {
      toast.error('Digite o email');
      return;
    }

    setIsSubmitting(true);
    try {
      // Aqui você pode implementar o convite por email
      // Opção 1: Criar usuário direto (se já existe no auth)
      // Opção 2: Enviar email de convite

      // Por enquanto, vamos simular criando um registro pendente
      const { error } = await supabase.from('company_invites').insert([{
        company_id: companyId,
        email: inviteEmail,
        role: inviteRole as any,
        team_id: inviteTeam || null,
        status: 'pending',
      }]);

      if (error) throw error;

      toast.success(`Um email foi enviado para ${inviteEmail}`);

      setIsInviteOpen(false);
      setInviteEmail('');
      setInviteRole('seller');
      setInviteTeam('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao convidar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateMember = async (memberId: string, updates: Partial<Member>) => {
    try {
      const { error } = await supabase
        .from('company_members')
        .update(updates as any)
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Usuário atualizado!');
      loadMembers();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar');
    }
  };

  const handleDeactivate = async (member: Member) => {
    if (member.role === 'owner') {
      toast.error('Não é possível desativar o proprietário');
      return;
    }

    await handleUpdateMember(member.id, { is_active: !member.is_active });
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && member.is_active) ||
      (statusFilter === 'inactive' && !member.is_active) ||
      (statusFilter === 'online' && member.is_online);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: members.length,
    active: members.filter(m => m.is_active).length,
    online: members.filter(m => m.is_online).length,
    byRole: Object.entries(
      members.reduce((acc, m) => {
        acc[m.role] = (acc[m.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ),
  };

  return (
    <PermissionGate permission="settings.users" fallback={<AccessDenied />}>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Usuários</h1>
            <p className="text-muted-foreground">
              Gerencie os membros da sua equipe e suas permissões
            </p>
          </div>
          <Button onClick={() => setIsInviteOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Convidar Usuário
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total de Usuários</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-sm text-muted-foreground">Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-full">
                  <div className="h-6 w-6 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.online}</p>
                  <p className="text-sm text-muted-foreground">Online Agora</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{teams.length}</p>
                  <p className="text-sm text-muted-foreground">Equipes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os cargos</SelectItem>
                  {Object.entries(ROLE_LABELS).map(([role, { label }]) => (
                    <SelectItem key={role} value={role}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Equipe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última Atividade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id} className={!member.is_active ? 'opacity-50' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={member.avatar_url} />
                          <AvatarFallback>
                            {member.display_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        {member.is_online && (
                          <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{member.display_name || 'Sem nome'}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={ROLE_LABELS[member.role]?.color}>
                      {ROLE_LABELS[member.role]?.label}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    {member.team ? (
                      <Badge variant="outline">{member.team.name}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${
                        member.is_online 
                          ? STATUS_LABELS[member.current_status]?.color || 'bg-green-500'
                          : 'bg-gray-400'
                      }`} />
                      <span className="text-sm">
                        {member.is_online 
                          ? STATUS_LABELS[member.current_status]?.label || 'Online'
                          : 'Offline'}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {member.last_seen_at 
                        ? new Date(member.last_seen_at).toLocaleString('pt-BR')
                        : 'Nunca'}
                    </span>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedMember(member);
                          setIsEditOpen(true);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onClick={() => {
                          setSelectedMember(member);
                          setIsPermissionsOpen(true);
                        }}>
                          <Key className="h-4 w-4 mr-2" />
                          Permissões
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem 
                          onClick={() => handleDeactivate(member)}
                          disabled={member.role === 'owner'}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          {member.is_active ? 'Desativar' : 'Ativar'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              
              {filteredMembers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Modal de Convite */}
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar Usuário</DialogTitle>
              <DialogDescription>
                Envie um convite por email para adicionar um novo membro à equipe.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              
              <div>
                <Label>Cargo</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS)
                      .filter(([role]) => role !== 'owner')
                      .map(([role, { label }]) => (
                        <SelectItem key={role} value={role}>{label}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Equipe (opcional)</Label>
                <Select value={inviteTeam} onValueChange={setInviteTeam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma equipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleInvite} disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Enviar Convite'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Edição - implementar similar */}
        {/* Modal de Permissões - implementar com lista de permissões customizáveis */}
      </div>
    </PermissionGate>
  );
}

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <Shield className="h-16 w-16 text-muted-foreground mb-4" />
      <h2 className="text-2xl font-bold">Acesso Negado</h2>
      <p className="text-muted-foreground mt-2">
        Você não tem permissão para acessar esta página.
      </p>
    </div>
  );
}
