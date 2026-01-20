import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { OnboardingGuide } from './onboarding/OnboardingGuide';
import { PageLoadingSkeleton } from './LoadingFallback';
import { SubscriptionBarrier } from './subscription/SubscriptionBarrier';

interface RequireCompanyProps {
  children: React.ReactNode;
}

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  '/',
  '/auth',
  '/signup',
  '/pricing',
  '/set-password',
  '/privacy-policy',
  '/terms-of-service',
  '/p/', // Public proposals
  '/educacao',
  '/imobiliarias',
  '/concessionarias',
  '/politica-privacidade',
  '/termos-uso',
];

// Check if a path is public
const isPathPublic = (pathname: string): boolean => {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path));
};

export function RequireCompany({ children }: RequireCompanyProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const hasCheckedAuth = useRef(false);

  const checkCompany = useCallback(async (forceCheck = false) => {
    // Se já verificou e não é forceCheck, não verificar novamente
    if (hasCheckedAuth.current && !forceCheck) {
      return;
    }

    const currentPath = location.pathname;
    const isPublicPath = isPathPublic(currentPath);

    try {
      // Check if user is authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();

      hasCheckedAuth.current = true;

      if (!user) {
        setIsAuthenticated(false);
        setLoading(false);

        // If trying to access protected route without auth, redirect to login
        if (!isPublicPath) {
          console.log('🔒 Acesso negado - redirecionando para login:', currentPath);
          navigate('/auth', { replace: true, state: { from: currentPath } });
        }
        return;
      }

      setIsAuthenticated(true);
      setShowOnboarding(false);
      setLoading(false);
    } catch (error) {
      console.error('Error checking company:', error);
      setLoading(false);
      hasCheckedAuth.current = true;

      // On error, if not public path, redirect to login
      if (!isPublicPath) {
        navigate('/auth', { replace: true });
      }
    }
  }, [navigate, location.pathname]);

  // Verificar autenticação apenas uma vez na montagem inicial
  useEffect(() => {
    checkCompany();
  }, []);

  // Verificar redirecionamento quando a rota muda (mas sem loading)
  useEffect(() => {
    if (!hasCheckedAuth.current) return;

    const currentPath = location.pathname;
    const isPublicPath = isPathPublic(currentPath);

    // Se não está autenticado e tenta acessar rota protegida
    if (!isAuthenticated && !isPublicPath) {
      navigate('/auth', { replace: true, state: { from: currentPath } });
    }
  }, [location.pathname, isAuthenticated, navigate]);

  // Escutar mudanças de autenticação
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        hasCheckedAuth.current = false;
        checkCompany(true);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        hasCheckedAuth.current = true;
        navigate('/auth', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [checkCompany, navigate]);

  const handleOnboardingComplete = async () => {
    console.log('🎉 Onboarding completado!');
    setShowOnboarding(false);
    window.location.reload();
  };

  // While checking auth, show loading
  if (loading) {
    return <PageLoadingSkeleton />;
  }

  const currentPath = location.pathname;
  const isPublicPath = isPathPublic(currentPath);

  // If not authenticated
  if (!isAuthenticated) {
    // Allow access only to public paths
    if (isPublicPath) {
      return <>{children}</>;
    }
    // For protected paths, show loading (redirect should happen in checkCompany)
    return <PageLoadingSkeleton />;
  }

  // User is authenticated - allow access
  // Check for onboarding on protected paths
  const protectedPaths = [
    '/dashboard',
    '/chat',
    '/crm',
    '/tasks',
    '/templates',
    '/proposals',
    '/automation',
    '/gamification',
    '/contacts',
    '/duplicates',
    '/segments',
    '/settings',
    '/campaigns',
    '/products',
    '/reports',
    '/groups',
    '/chatbots',
    '/faq',
    '/documents',
    '/knowledge-base',
    '/integrations',
    '/security',
    '/channels',
    '/orders',
    '/cadences',
    '/ai-insights',
    '/instance-setup',
    '/companies',
    '/super-admin',
    '/upgrade',
    '/docs',
  ];

  const isProtectedPath = protectedPaths.some((path) => currentPath.startsWith(path));

  if (isProtectedPath && showOnboarding) {
    return <OnboardingGuide isOpen={showOnboarding} onComplete={handleOnboardingComplete} />;
  }

  return (
    <>
      {children}
      <SubscriptionBarrier />
    </>
  );
}
