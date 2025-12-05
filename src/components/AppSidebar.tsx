import { LayoutDashboard, MessageSquare, Users, Contact, BarChart3, Settings, MessageCircle, Building2, UsersRound, FileBarChart, Zap, Trophy, Package, GitMerge, Filter, Send, Shield, LogOut } from "lucide-react";
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
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { unreadCount } = useInsights();
  const { isPlatformAdmin } = usePlatformAdmin();
  const { isFeatureEnabled } = useFeatureFlags();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
    toast.success('Logout realizado com sucesso');
  };

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + '/');

  const visibleMenuItems = menuItems.filter((item) => {
    if (!item.featureKey) return true;
    return isFeatureEnabled(item.featureKey as any);
  });

  return (
    <Sidebar side="left" collapsible="icon" className="border-none bg-[#111111] text-gray-400 data-[state=collapsed]:w-[80px]">
      <div className="flex items-center justify-center h-20 bg-[#111111]">
        {state === "expanded" ? (
          <div className="flex items-center gap-3">
            <div>
              <img src="/icon-512.png" alt="Logo" className="w-8 h-8" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">CamalaChat</span>
          </div>
        ) : (
          <div>
            <img src="/icon-512.png" alt="Logo" className="w-8 h-8" />
          </div>
        )}
      </div>

      <SidebarContent className="px-3 py-4 bg-[#111111] scrollbar-none">
        <SidebarGroup className="mx-0 px-0">
          <SidebarGroupLabel className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 mb-4 group-data-[collapsible=icon]:hidden">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {visibleMenuItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={state === "collapsed" ? item.title : undefined}
                    className="
                      h-11
                      data-[active=true]:bg-white/10 
                      data-[active=true]:text-white 
                      data-[active=true]:font-medium 
                      hover:bg-white/5 
                      hover:text-white 
                      text-gray-400
                      rounded-2xl 
                      transition-all 
                      duration-300
                      group
                    "
                  >
                    <NavLink
                      to={item.url}
                      className={`flex items-center ${state === 'expanded' ? 'gap-4 px-3' : 'justify-center'}`}
                    >
                      <div className={`
                        p-1.5 rounded-lg transition-all duration-300
                        ${isActive(item.url) ? 'bg-white/10 text-emerald-400' : 'group-hover:text-emerald-400'}
                      `}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      {state === "expanded" && (
                        <span className="flex items-center gap-2 flex-1 text-[14px]">
                          {item.title}
                          {item.url === "/reports" && unreadCount > 0 && (
                            <Badge className="ml-auto bg-emerald-500 text-white px-2 py-0.5 text-[10px] rounded-full">
                              {unreadCount}
                            </Badge>
                          )}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isPlatformAdmin && (
          <SidebarGroup className="mx-0 px-0 mt-6">
            <SidebarGroupLabel className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 mb-4 group-data-[collapsible=icon]:hidden">
              Administração
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/super-admin")}
                    tooltip={state === "collapsed" ? "Painel Admin" : undefined}
                    className="
                      h-11
                      data-[active=true]:bg-white/10 
                      data-[active=true]:text-white 
                      data-[active=true]:font-medium 
                      hover:bg-white/5 
                      hover:text-white 
                      text-gray-400
                      rounded-2xl 
                      transition-all 
                      duration-300
                    "
                  >
                    <NavLink
                      to="/super-admin"
                      className={`flex items-center ${state === 'expanded' ? 'gap-4 px-3' : 'justify-center'}`}
                    >
                      <div className="p-1.5 rounded-lg group-hover:text-purple-400 transition-colors">
                        <Shield className="h-5 w-5" />
                      </div>
                      {state === "expanded" && (
                        <span className="text-[14px]">Painel Admin</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="bg-[#111111] p-4 group-data-[collapsible=icon]:p-2">
        <div className={`
          rounded-2xl transition-all duration-300
          ${state === 'expanded' ? 'bg-white/5 p-2 space-y-1' : 'bg-transparent p-0 space-y-2'}
        `}>
          <SidebarMenuButton
            asChild
            isActive={isActive("/settings")}
            tooltip={state === "collapsed" ? "Configurações" : undefined}
            className="
              h-10
              hover:bg-white/10 
              hover:text-white 
              text-gray-400
              rounded-xl
              transition-all 
              duration-200
              data-[state=open]:bg-white/10
              data-[state=open]:text-white
            "
          >
            <NavLink
              to="/settings"
              className={`flex items-center ${state === 'expanded' ? 'gap-3 px-2' : 'justify-center w-full'}`}
            >
              <Settings className="h-4 w-4" />
              {state === "expanded" && <span className="text-sm">Configurações</span>}
            </NavLink>
          </SidebarMenuButton>

          <SidebarMenuButton
            onClick={handleLogout}
            tooltip={state === "collapsed" ? "Sair" : undefined}
            className="
              h-10
              hover:bg-red-500/10 
              hover:text-red-400 
              text-gray-400
              rounded-xl
              transition-all 
              duration-200
            "
          >
            <div className={`flex items-center ${state === 'expanded' ? 'gap-3 px-2 w-full' : 'justify-center w-full'}`}>
              <LogOut className="h-4 w-4" />
              {state === "expanded" && <span className="text-sm">Sair</span>}
            </div>
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}