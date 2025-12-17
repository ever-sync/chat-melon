import { ReactNode } from 'react';
import { useFeatureFlags, FeatureKey } from '@/hooks/useFeatureFlags';
import { Navigate } from 'react-router-dom';

interface FeatureGateProps {
  children: ReactNode;
  feature: FeatureKey;
  fallback?: ReactNode;
  redirectTo?: string;
}

export function FeatureGate({
  children,
  feature,
  fallback,
  redirectTo = '/dashboard',
}: FeatureGateProps) {
  const { isFeatureEnabled, isLoading } = useFeatureFlags();

  if (isLoading) {
    return null; // Or a loading skeleton
  }

  if (!isFeatureEnabled(feature)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
