import { useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, Kanban, CheckSquare, Menu, Bell, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/ui/useNotifications';
import { useTasks } from '@/hooks/crm/useTasks';
import { cn } from '@/lib/utils';

export const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const { tasks } = useTasks();

  const pendingTasks = tasks?.filter((t) => t.status === 'pending').length || 0;

  const navItems = [
    {
      path: '/chat',
      icon: MessageSquare,
      label: 'Chat',
      badge: null,
    },
    {
      path: '/agenda',
      icon: Calendar,
      label: 'Agenda',
      badge: null,
    },
    {
      path: '/crm',
      icon: Kanban,
      label: 'CRM',
      badge: null,
    },
    {
      path: '/settings',
      icon: Menu,
      label: 'Menu',
      badge: unreadCount > 0 ? unreadCount : null,
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 relative transition-colors',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <Icon className={cn('h-5 w-5', active && 'scale-110')} />
                {item.badge && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className={cn('text-xs font-medium', active && 'font-semibold')}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
