import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useTrialAccess } from '@/hooks/useTrialAccess';

interface TrialProtectedRouteProps {
    children: ReactNode;
}

export function TrialProtectedRoute({ children }: TrialProtectedRouteProps) {
    const { hasAccess, isLoading } = useTrialAccess();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!hasAccess) {
        return <Navigate to="/pricing" replace />;
    }

    return <>{children}</>;
}
