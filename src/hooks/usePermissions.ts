import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/contexts/CompanyContext';
import { Database } from '@/integrations/supabase/types';

export type Permission = 
  | 'chat.view_all' | 'chat.view_team' | 'chat.view_own' 
  | 'chat.send_messages' | 'chat.transfer' | 'chat.take_over' 
  | 'chat.close' | 'chat.delete_messages'
  | 'contacts.view_all' | 'contacts.view_own' | 'contacts.create'
  | 'contacts.edit_all' | 'contacts.edit_own' | 'contacts.delete'
  | 'deals.view_all' | 'deals.view_own' | 'deals.create'
  | 'deals.edit_all' | 'deals.edit_own' | 'deals.delete' | 'deals.move_stage'
  | 'campaigns.view' | 'campaigns.create' | 'campaigns.edit'
  | 'campaigns.execute' | 'campaigns.delete'
  | 'reports.view_all' | 'reports.view_team' | 'reports.view_own' | 'reports.export'
  | 'settings.company' | 'settings.users' | 'settings.queues'
  | 'settings.labels' | 'settings.pipelines' | 'settings.integrations' | 'settings.audit_logs';

type AppRole = Database['public']['Enums']['app_role'];

export type UserRole = 'admin' | 'manager' | 'seller' | 'viewer';

interface MemberInfo {
  id: string;
  role: AppRole;
  isActive: boolean;
}

interface UsePermissionsReturn {
  permissions: Record<string, boolean>;
  role: AppRole | null;
  member: MemberInfo | null;
  isLoading: boolean;
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  canAll: (permissions: Permission[]) => boolean;
  isRole: (roles: AppRole | AppRole[]) => boolean;
  isAtLeast: (role: UserRole) => boolean;
  refetch: () => Promise<void>;
}

const ROLE_LEVELS: Record<string, number> = {
  admin: 90,
  manager: 70,
  seller: 40,
  viewer: 20,
};

// Permissões padrão por role (temporário até migração do banco)
const DEFAULT_PERMISSIONS: Record<string, Record<string, boolean>> = {
  admin: {
    'chat.view_all': true,
    'chat.view_team': true,
    'chat.view_own': true,
    'chat.send_messages': true,
    'chat.transfer': true,
    'chat.take_over': true,
    'chat.close': true,
    'chat.delete_messages': true,
    'contacts.view_all': true,
    'contacts.view_own': true,
    'contacts.create': true,
    'contacts.edit_all': true,
    'contacts.edit_own': true,
    'contacts.delete': true,
    'deals.view_all': true,
    'deals.view_own': true,
    'deals.create': true,
    'deals.edit_all': true,
    'deals.edit_own': true,
    'deals.delete': true,
    'deals.move_stage': true,
    'campaigns.view': true,
    'campaigns.create': true,
    'campaigns.edit': true,
    'campaigns.execute': true,
    'campaigns.delete': true,
    'reports.view_all': true,
    'reports.view_team': true,
    'reports.view_own': true,
    'reports.export': true,
    'settings.company': true,
    'settings.users': true,
    'settings.queues': true,
    'settings.labels': true,
    'settings.pipelines': true,
    'settings.integrations': true,
    'settings.audit_logs': true,
  },
  manager: {
    'chat.view_all': true,
    'chat.view_team': true,
    'chat.view_own': true,
    'chat.send_messages': true,
    'chat.transfer': true,
    'chat.take_over': true,
    'chat.close': true,
    'contacts.view_all': true,
    'contacts.view_own': true,
    'contacts.create': true,
    'contacts.edit_all': true,
    'contacts.edit_own': true,
    'deals.view_all': true,
    'deals.view_own': true,
    'deals.create': true,
    'deals.edit_all': true,
    'deals.edit_own': true,
    'deals.move_stage': true,
    'campaigns.view': true,
    'campaigns.create': true,
    'campaigns.edit': true,
    'campaigns.execute': true,
    'reports.view_all': true,
    'reports.view_team': true,
    'reports.view_own': true,
    'reports.export': true,
    'settings.queues': true,
    'settings.labels': true,
    'settings.pipelines': true,
  },
  seller: {
    'chat.view_own': true,
    'chat.send_messages': true,
    'chat.transfer': true,
    'chat.close': true,
    'contacts.view_own': true,
    'contacts.create': true,
    'contacts.edit_own': true,
    'deals.view_own': true,
    'deals.create': true,
    'deals.edit_own': true,
    'deals.move_stage': true,
    'campaigns.view': true,
    'reports.view_own': true,
  },
  viewer: {
    'chat.view_own': true,
    'contacts.view_own': true,
    'deals.view_own': true,
    'campaigns.view': true,
    'reports.view_own': true,
  },
};

export function usePermissions(): UsePermissionsReturn {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!user?.id || !currentCompany?.id) {
      setPermissions({});
      setMember(null);
      setIsLoading(false);
      return;
    }

    try {
      // Buscar role do usuário na empresa atual
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('company_id', currentCompany.id)
        .maybeSingle();

      if (userRole) {
        const role = userRole.role as AppRole;
        
        setMember({
          id: user.id,
          role,
          isActive: true,
        });

        // Usar permissões padrão baseadas no role
        setPermissions(DEFAULT_PERMISSIONS[role] || {});
      }
    } catch (err) {
      console.error('Erro ao buscar permissões:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, currentCompany?.id]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const can = useCallback((permission: Permission): boolean => {
    return permissions[permission] === true;
  }, [permissions]);

  const canAny = useCallback((perms: Permission[]): boolean => {
    return perms.some(p => permissions[p] === true);
  }, [permissions]);

  const canAll = useCallback((perms: Permission[]): boolean => {
    return perms.every(p => permissions[p] === true);
  }, [permissions]);

  const isRole = useCallback((roles: AppRole | AppRole[]): boolean => {
    if (!member?.role) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(member.role);
  }, [member?.role]);

  const isAtLeast = useCallback((role: UserRole): boolean => {
    if (!member?.role) return false;
    const memberLevel = ROLE_LEVELS[member.role] || 0;
    const requiredLevel = ROLE_LEVELS[role] || 0;
    return memberLevel >= requiredLevel;
  }, [member?.role]);

  return {
    permissions,
    role: member?.role || null,
    member,
    isLoading,
    can,
    canAny,
    canAll,
    isRole,
    isAtLeast,
    refetch: fetchPermissions,
  };
}
