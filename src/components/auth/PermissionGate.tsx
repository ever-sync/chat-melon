import { ReactNode } from 'react';
import { usePermissions, Permission, UserRole } from '@/hooks/usePermissions';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface PermissionGateProps {
  children: ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean; // Se true, requer TODAS as permissões
  roles?: AppRole[];
  minRole?: UserRole;
  fallback?: ReactNode;
}

export function PermissionGate({
  children,
  permission,
  permissions,
  requireAll = false,
  roles,
  minRole,
  fallback = null,
}: PermissionGateProps) {
  const { can, canAny, canAll, isRole, isAtLeast, isLoading } = usePermissions();

  if (isLoading) {
    return null; // ou um skeleton
  }

  // Verificar role mínimo
  if (minRole && !isAtLeast(minRole)) {
    return <>{fallback}</>;
  }

  // Verificar roles específicos
  if (roles && roles.length > 0 && !isRole(roles)) {
    return <>{fallback}</>;
  }

  // Verificar permissão única
  if (permission && !can(permission)) {
    return <>{fallback}</>;
  }

  // Verificar múltiplas permissões
  if (permissions && permissions.length > 0) {
    const hasPermission = requireAll ? canAll(permissions) : canAny(permissions);
    if (!hasPermission) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

// HOC para proteger componentes inteiros
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  permission: Permission,
  FallbackComponent?: React.ComponentType
) {
  return function WithPermissionComponent(props: P) {
    return (
      <PermissionGate
        permission={permission}
        fallback={FallbackComponent ? <FallbackComponent /> : null}
      >
        <WrappedComponent {...props} />
      </PermissionGate>
    );
  };
}
