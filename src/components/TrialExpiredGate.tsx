import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCanAccessPlatform } from '@/hooks/useSubscriptionStatus';
import { Loader2 } from 'lucide-react';

interface TrialExpiredGateProps {
  children: ReactNode;
}

// Rotas que NÃO devem ser bloqueadas mesmo com trial expirado
const ALLOWED_ROUTES = [
  '/upgrade',
  '/auth',
  '/signup',
  '/set-password',
  '/pricing',
  '/',
  '/settings/billing',
];

/**
 * Gate que bloqueia acesso às páginas quando o trial expirou
 * Redireciona para /upgrade automaticamente
 */
export function TrialExpiredGate({ children }: TrialExpiredGateProps) {
  const location = useLocation();
  const { canAccessPlatform, isLoading } = useCanAccessPlatform();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Verifica se a rota atual é permitida
  const isAllowedRoute = ALLOWED_ROUTES.some((route) => location.pathname.startsWith(route));

  // Se não pode acessar E não está em rota permitida, redirect para /upgrade
  if (!canAccessPlatform && !isAllowedRoute) {
    return <Navigate to="/upgrade" replace />;
  }

  // Caso contrário, renderiza normalmente
  return <>{children}</>;
}
