import { useEffect, useState } from 'react';
import { useCompany } from '@/contexts/CompanyContext';

interface TrialAccessInfo {
    hasAccess: boolean;
    isTrialActive: boolean;
    daysRemaining: number;
    isLoading: boolean;
    subscriptionStatus: string | null;
}

export function useTrialAccess(): TrialAccessInfo {
    const { currentCompany, loading: companyLoading } = useCompany();
    const [accessInfo, setAccessInfo] = useState<TrialAccessInfo>({
        hasAccess: false,
        isTrialActive: false,
        daysRemaining: 0,
        isLoading: true,
        subscriptionStatus: null,
    });

    useEffect(() => {
        if (companyLoading) {
            setAccessInfo(prev => ({ ...prev, isLoading: true }));
            return;
        }

        if (!currentCompany) {
            setAccessInfo({
                hasAccess: false,
                isTrialActive: false,
                daysRemaining: 0,
                isLoading: false,
                subscriptionStatus: null,
            });
            return;
        }

        const subscriptionStatus = currentCompany.subscription_status || null;

        // If has active subscription, always allow access
        if (subscriptionStatus === 'active') {
            setAccessInfo({
                hasAccess: true,
                isTrialActive: false,
                daysRemaining: 0,
                isLoading: false,
                subscriptionStatus,
            });
            return;
        }

        // Check trial status
        if (subscriptionStatus === 'trial' && currentCompany.trial_ends_at) {
            const now = new Date();
            const endsAt = new Date(currentCompany.trial_ends_at);
            const diffTime = endsAt.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const daysRemaining = Math.max(0, diffDays);
            const isTrialActive = diffDays > 0;

            setAccessInfo({
                hasAccess: isTrialActive,
                isTrialActive,
                daysRemaining,
                isLoading: false,
                subscriptionStatus,
            });
            return;
        }

        // No valid subscription or trial
        setAccessInfo({
            hasAccess: false,
            isTrialActive: false,
            daysRemaining: 0,
            isLoading: false,
            subscriptionStatus,
        });
    }, [currentCompany, companyLoading]);

    return accessInfo;
}
