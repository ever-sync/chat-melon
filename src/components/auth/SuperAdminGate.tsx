import { ReactNode } from 'react';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { Navigate } from 'react-router-dom';

interface SuperAdminGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

export function SuperAdminGate({
  children,
  fallback,
  redirectTo = '/dashboard',
}: SuperAdminGateProps) {
  const { isPlatformAdmin, isLoading } = usePlatformAdmin();

  console.log('SuperAdminGate - isLoading:', isLoading);
  console.log('SuperAdminGate - isPlatformAdmin:', isPlatformAdmin);

  if (isLoading) {
    console.log('SuperAdminGate - Mostrando loading...');
    return null;
  }

  if (!isPlatformAdmin) {
    console.log('SuperAdminGate - Redirecionando para:', redirectTo);
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to={redirectTo} replace />;
  }

  console.log('SuperAdminGate - Renderizando children (usuário é admin)');
  return <>{children}</>;
}
