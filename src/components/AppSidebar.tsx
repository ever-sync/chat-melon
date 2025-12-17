import { LayoutDashboard, MessageSquare, Users, Contact, BarChart3, Settings, MessageCircle, Building2, UsersRound, FileBarChart, Zap, Trophy, Package, GitMerge, Filter, Send, Shield, LogOut, FileText, HelpCircle, User, Briefcase, Star, Heart, ShoppingBag, Bot, BookOpen } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useInsights } from "@/hooks/useInsights";
import { usePlatformAdmin } from "@/hooks/usePlatformAdmin";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { Badge } from "@/components/ui/badge";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useContactSettings } from "@/hooks/useContactSettings";
import { useProductSettings } from "@/hooks/useProductSettings";

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { unreadCount } = useInsights();
  const { isPlatformAdmin } = usePlatformAdmin();
  const { isFeatureEnabled, features } = useFeatureFlags();

  const { settings: contactSettings } = useContactSettings();
  const { settings: productSettings } = useProductSettings();

  const getIcon = (iconName: string, DefaultIcon: any) => {
    switch (iconName) {
      case 'User': return User;
      case 'Briefcase': return Briefcase;
      case 'Star': return Star;
      case 'Heart': return Heart;
      case 'Zap': return Zap;
      case 'ShoppingBag': return ShoppingBag;
      case 'Package': return Package;
      default: return DefaultIcon;
    }
  };

  const menuItems = [{
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard
  }, {
    title: "Conversas",
    url: "/chat",
    icon: MessageSquare,
    featureKey: "chat"
  }, {
    title: "Grupos",
    url: "/groups",
    icon: UsersRound,
    featureKey: "groups"
  }, {
    title: "CRM",
    url: "/crm",
    icon: Users,
    featureKey: "deals_pipeline"
  }, {
    title: "Propostas",
    url: "/proposals",
    icon: FileBarChart,
    featureKey: "proposals"
  }, {
    title: "Automações",
    url: "/automation",
    icon: Zap,
    featureKey: "workflows"
  }, {
    title: "Campanhas",
    url: "/campaigns",
    icon: Send,
    featureKey: "campaigns"
  }, {
    title: contactSettings?.entity_name_plural || "Contatos",
    url: "/contacts",
    icon: contactSettings?.entity_icon ? getIcon(contactSettings.entity_icon, Contact) : Contact,
    featureKey: "contacts"
  }, {
    title: productSettings?.entity_name_plural || "Produtos",
    url: "/products",
    icon: productSettings?.entity_icon ? getIcon(productSettings.entity_icon, Package) : Package,
    featureKey: "products"
  }, {
    title: "Relatórios",
    url: "/reports",
    icon: BarChart3,
    featureKey: "reports_basic"
  }, {
    title: "Gamificação",
    url: "/gamification",
    icon: Trophy,
    featureKey: "gamification"
  }, {
    title: "FAQ",
    url: "/faq",
    icon: HelpCircle,
    featureKey: "faq"
  }, {
    title: "Documentos",
    url: "/documents",
    icon: FileText,
    featureKey: "documents"
  }, {
    title: "Knowledge Base",
    url: "/knowledge-base",
    icon: BookOpen,
    featureKey: "knowledge_base"
  }, {
    title: "Chatbots",
    url: "/chatbots",
    icon: Bot,
    featureKey: "chatbots"
  }, {
    title: "Cadences",
    url: "/cadences",
    icon: GitMerge,
    featureKey: "cadences"
  }, {
    title: "Pedidos",
    url: "/orders",
    icon: ShoppingBag,
    featureKey: "orders"
  }, {
    title: "Integrações",
    url: "/integrations",
    icon: Zap,
    featureKey: "integrations",
    comingSoon: true
  }, {
    title: "Segurança",
    url: "/security",
    icon: Shield,
    featureKey: "security"
  }, {
    title: "Canais",
    url: "/channels",
    icon: MessageCircle,
    featureKey: "channels",
    comingSoon: true
  }];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
    toast.success('Logout realizado com sucesso');
  };

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + '/');

  // Show all items if features are still loading or not configured
  // Only hide items if the feature is explicitly disabled
  const visibleMenuItems = menuItems.filter((item) => {
    // Items without a feature key are always visible
    if (!item.featureKey) return true;

    // If no features loaded yet, show all items by default
    if (features.length === 0) return true;

    // Check if this specific feature is enabled
    return isFeatureEnabled(item.featureKey as any);
  });

  return (
    <Sidebar
      side="left"
      collapsible="icon"
      className="border-r border-white/5 bg-[#0A0A0A] text-gray-400 data-[state=collapsed]:w-[80px] transition-all duration-300"
    >
      <div className="flex items-center justify-center h-20 mb-2">
        {state === "expanded" ? (
          <div className="flex items-center gap-3 px-4 w-full">
            <div className="w-8 h-8 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/10">
              <div className="w-4 h-4 rounded-full border-2 border-white"></div>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Nucleus</span>
          </div>
        ) : (
          <div className="w-9 h-9 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/10">
            <div className="w-4 h-4 rounded-full border-2 border-white"></div>
          </div>
        )}
      </div>


      <SidebarContent className="px-3 pb-4 scrollbar-none gap-6">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-4 mb-2 group-data-[collapsible=icon]:hidden">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5">
              {visibleMenuItems.map(item => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={state === "collapsed" ? item.title : undefined}
                      className={`
                        h-10 relative overflow-hidden group
                        transition-all duration-300 ease-out
                        hover:bg-white/5
                        ${active
                          ? 'bg-gradient-to-r from-indigo-500/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#6366f1]'
                          : 'text-gray-400 hover:text-gray-200'
                        }
                        rounded-lg
                        mx-1
                      `}
                    >
                      <NavLink
                        to={item.url}
                        className={`flex items-center w-full ${state === "expanded" ? "gap-3 px-3" : "justify-center"}`}
                      >
                        <item.icon
                          className={`
                            h-[18px] w-[18px] transition-colors duration-300
                            ${active ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-300'}
                          `}
                        />
                        {state === "expanded" && (
                          <span className="flex items-center flex-1 text-[13.5px] tracking-wide">
                            {item.title}
                            {item.url === "/reports" && unreadCount > 0 && (
                              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                            )}
                            {item.comingSoon && (
                              <Badge variant="outline" className="ml-auto border-amber-500/30 text-amber-500 px-1.5 py-0 text-[9px] h-4 leading-none rounded-md bg-amber-500/5">
                                SOON
                              </Badge>
                            )}
                          </span>
                        )}
                        {/* Active glow effect */}
                        {active && (
                          <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isPlatformAdmin && (
          <SidebarGroup className="p-0">
            <SidebarGroupLabel className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-4 mb-2 group-data-[collapsible=icon]:hidden">
              Sistema
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1.5">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/super-admin")}
                    tooltip={state === "collapsed" ? "Painel Admin" : undefined}
                    className={`
                      h-10 mx-1 rounded-lg transition-all duration-300
                      ${isActive("/super-admin")
                        ? 'bg-gradient-to-r from-purple-500/10 to-transparent text-white shadow-[inset_3px_0_0_0_#a855f7]'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                      }
                    `}
                  >
                    <NavLink
                      to="/super-admin"
                      className={`flex items-center w-full ${state === "expanded" ? "gap-3 px-3" : "justify-center"}`}
                    >
                      <Shield className={`h-[18px] w-[18px] ${isActive("/super-admin") ? "text-purple-400" : "text-gray-500"}`} />
                      {state === "expanded" && <span className="text-[13.5px]">Painel Admin</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3 bg-black/20 backdrop-blur-sm border-t border-white/5">
        <div className="flex flex-col gap-1">
          <SidebarMenuButton
            asChild
            isActive={isActive("/companies")}
            tooltip={state === "collapsed" ? "Empresas" : undefined}
            className="h-9 rounded-md hover:bg-white/5 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <NavLink to="/companies" className={`flex items-center w-full ${state === "expanded" ? "gap-3 px-2" : "justify-center"}`}>
              <Building2 className="h-4 w-4 opacity-70" />
              {state === "expanded" && <span className="text-xs font-medium">Empresas</span>}
            </NavLink>
          </SidebarMenuButton>

          <SidebarMenuButton
            asChild
            isActive={isActive("/settings")}
            tooltip={state === "collapsed" ? "Configurações" : undefined}
            className="h-9 rounded-md hover:bg-white/5 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <NavLink to="/settings" className={`flex items-center w-full ${state === "expanded" ? "gap-3 px-2" : "justify-center"}`}>
              <Settings className="h-4 w-4 opacity-70" />
              {state === "expanded" && <span className="text-xs font-medium">Configurações</span>}
            </NavLink>
          </SidebarMenuButton>

          <SidebarMenuButton
            onClick={handleLogout}
            tooltip={state === "collapsed" ? "Sair" : undefined}
            className="h-9 rounded-md hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors mt-1"
          >
            <div className={`flex items-center w-full ${state === "expanded" ? "gap-3 px-2" : "justify-center"}`}>
              <LogOut className="h-4 w-4 opacity-70" />
              {state === "expanded" && <span className="text-xs font-medium">Sair</span>}
            </div>
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}