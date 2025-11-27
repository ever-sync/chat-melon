import { LayoutDashboard, MessageSquare, Users, Contact, BarChart3, Settings, MessageCircle, Building2, UsersRound, FileBarChart, Zap, Trophy, Package, GitMerge, Filter, Send, Shield, Bot, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useInsights } from "@/hooks/useInsights";
import { usePlatformAdmin } from "@/hooks/usePlatformAdmin";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { Badge } from "@/components/ui/badge";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
const menuItems = [{
  title: "Dashboard",
  url: "/dashboard",
  icon: LayoutDashboard
}, {
  title: "Conversas",
  url: "/chat",
  icon: MessageSquare
}, {
  title: "Grupos",
  url: "/groups",
  icon: UsersRound,
  featureKey: "groups"
}, {
  title: "CRM",
  url: "/crm",
  icon: Users
}, {
  title: "Propostas",
  url: "/proposals",
  icon: FileBarChart,
  featureKey: "proposals"
}, {
  title: "Automações",
  url: "/automation",
  icon: Zap,
  featureKey: "automation"
}, {
  title: "Campanhas",
  url: "/campaigns",
  icon: Send,
  featureKey: "campaigns"
}, {
  title: "Contatos",
  url: "/contacts",
  icon: Contact
}, {
  title: "Segmentos",
  url: "/segments",
  icon: Filter,
  featureKey: "segments"
}, {
  title: "Duplicados",
  url: "/duplicates",
  icon: GitMerge,
  featureKey: "duplicates"
}, {
  title: "Produtos",
  url: "/products",
  icon: Package,
  featureKey: "products"
}, {
  title: "Relatórios",
  url: "/reports",
  icon: BarChart3
}, {
  title: "Gamificação",
  url: "/gamification",
  icon: Trophy,
  featureKey: "gamification"
}, {
  title: "Empresas",
  url: "/companies",
  icon: Building2
}];
export function AppSidebar() {
  const {
    state
  } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const {
    unreadCount
  } = useInsights();
  const { isPlatformAdmin } = usePlatformAdmin();
  const { isFeatureEnabled } = useFeatureFlags();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
    toast.success('Logout realizado com sucesso');
  };
  
  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + '/');
  
  // Filtrar menu items baseado em feature flags
  const visibleMenuItems = menuItems.filter((item) => {
    if (!item.featureKey) return true;
    return isFeatureEnabled(item.featureKey as any);
  });
  return <Sidebar side="left" collapsible="icon">
      <div className="flex items-center justify-center h-16 border-b border-border/30 bg-sidebar">
        {state === "expanded" ? <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-semibold text-foreground">CRM</span>
          </div> : <div className="p-1.5 rounded-lg bg-primary/10">
            <MessageCircle className="h-5 w-5 text-primary" />
          </div>}
      </div>
      
      <SidebarContent className="px-2 py-4 bg-sidebar">
        <SidebarGroup className="mx-0 px-0">
          <SidebarGroupLabel className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest px-3 mb-2">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {visibleMenuItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={state === "collapsed" ? item.title : undefined} className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-medium data-[active=true]:border-l-2 data-[active=true]:border-primary hover:bg-muted/50 hover:text-foreground rounded-lg transition-all duration-200">
                    <NavLink to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                      <div className="relative">
                        <item.icon className="h-4.5 w-4.5 flex-shrink-0" />
                      </div>
                      {state === "expanded" && <span className="flex items-center gap-2 flex-1 text-sm font-normal">
                          {item.title}
                          {item.url === "/reports" && unreadCount > 0 && <Badge variant="default" className="ml-auto bg-primary text-primary-foreground px-1.5 py-0 text-[10px] rounded-full h-4 min-w-4 flex items-center justify-center">
                              {unreadCount}
                            </Badge>}
                        </span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isPlatformAdmin && (
          <SidebarGroup className="mx-0 px-0 mt-4">
            <SidebarGroupLabel className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest px-3 mb-2">
              Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/super-admin")} tooltip={state === "collapsed" ? "Painel Admin" : undefined} className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-medium data-[active=true]:border-l-2 data-[active=true]:border-primary hover:bg-muted/50 hover:text-foreground rounded-lg transition-all duration-200">
                    <NavLink to="/super-admin" className="flex items-center gap-3 px-3 py-2.5">
                      <div className="relative">
                        <Shield className="h-4.5 w-4.5 flex-shrink-0" />
                      </div>
                      {state === "expanded" && <span className="flex items-center gap-2 flex-1 text-sm font-normal">
                          Painel Admin
                        </span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/30 bg-sidebar p-2">
        <SidebarMenu className="space-y-0.5">
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/settings")} tooltip={state === "collapsed" ? "Configurações" : undefined} className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-medium data-[active=true]:border-l-2 data-[active=true]:border-primary hover:bg-muted/50 hover:text-foreground rounded-lg transition-all duration-200">
              <NavLink to="/settings" className="flex items-center gap-3 px-3 py-2.5">
                <div className="relative">
                  <Settings className="h-4.5 w-4.5 flex-shrink-0" />
                </div>
                {state === "expanded" && <span className="text-sm font-normal">
                  Configurações
                </span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip={state === "collapsed" ? "Sair" : undefined} className="hover:bg-destructive/10 hover:text-destructive rounded-lg transition-all duration-200">
              <div className="flex items-center gap-3 px-3 py-2.5 w-full">
                <div className="relative">
                  <LogOut className="h-4.5 w-4.5 flex-shrink-0" />
                </div>
                {state === "expanded" && <span className="text-sm font-normal">
                  Sair
                </span>}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>;
}