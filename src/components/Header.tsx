import {
  User,
  LogOut,
  Settings as SettingsIcon,
  Building2,
  ChevronDown,
  MessageCircle,
  CheckSquare,
  FileText,
  Filter,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { GlobalSearch } from '@/components/GlobalSearch';
import { TrialBadge } from '@/components/TrialBadge';
import { InternalChatPanel } from '@/components/internal-chat/InternalChatPanel';

export const Header = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string | null } | null>(
    null
  );
  const { currentCompany, companies, switchCompany, loading } = useCompany();

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        let { data } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        // Create profile if doesn't exist
        if (!data) {
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              full_name: user.email?.split('@')[0] || 'User',
            })
            .select('full_name, avatar_url')
            .single();

          data = newProfile;
        }

        setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      console.log('Iniciando logout...');

      // Fazer signOut do Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Erro ao fazer logout:', error);
        throw error;
      }

      console.log('Logout realizado com sucesso');

      // Limpar localStorage
      localStorage.clear();

      // Limpar sessionStorage
      sessionStorage.clear();

      // Redirecionar para a página de login
      navigate('/auth', { replace: true });

      // Forçar reload da página para limpar todo o estado
      window.location.href = '/auth';
    } catch (error) {
      console.error('Erro no processo de logout:', error);
      // Mesmo com erro, redirecionar para auth
      window.location.href = '/auth';
    }
  };

  const initials =
    profile?.full_name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';

  return (
    <header className="sticky top-0 z-[60] w-full border-b border-border/50 bg-background/95 backdrop-blur-md">
      <div className="flex h-20 items-center gap-6 px-6">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

        <div className="flex-1 flex items-center gap-6">
          {/* Company Selector */}
          {!loading && companies.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="gap-2 min-w-[200px] justify-between rounded-xl border-0 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium truncate text-sm">
                      {currentCompany?.name || 'Selecione uma empresa'}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[250px] bg-background">
                <DropdownMenuLabel>Trocar Empresa</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {companies.map((company) => (
                  <DropdownMenuItem
                    key={company.id}
                    onClick={() => switchCompany(company.id)}
                    className={currentCompany?.id === company.id ? 'bg-accent' : ''}
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    <span>{company.name}</span>
                    {currentCompany?.id === company.id && (
                      <span className="ml-auto text-xs text-primary">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/companies')}>
                  <Building2 className="mr-2 h-4 w-4" />
                  Gerenciar Empresas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Search */}
          <GlobalSearch />

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/tasks')}
              className="gap-2 rounded-xl hover:bg-muted/50"
            >
              <CheckSquare className="h-5 w-5" />
              <span className="hidden md:inline">Tarefas</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/templates')}
              className="gap-2 rounded-xl hover:bg-muted/50"
            >
              <FileText className="h-5 w-5" />
              <span className="hidden md:inline">Templates</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/segments')}
              className="gap-2 rounded-xl hover:bg-muted/50"
            >
              <Filter className="h-5 w-5" />
              <span className="hidden md:inline">Segmentos</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TrialBadge />

          <InternalChatPanel />

          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 gap-3 px-3 rounded-xl hover:bg-muted/50"
              >
                <Avatar className="h-9 w-9 border-2 border-primary/10">
                  <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline-block font-medium text-sm">
                  {profile?.full_name || 'Usuário'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <SettingsIcon className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
