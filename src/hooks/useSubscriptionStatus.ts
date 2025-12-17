import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled' | 'suspended';

export interface SubscriptionStatusData {
  status: SubscriptionStatus;
  isTrialExpired: boolean;
  daysRemaining: number;
  canAccessPlatform: boolean;
  trialEndsAt: Date | null;
  subscriptionStartedAt: Date | null;
  planName: string;
  planSlug: string;
  isFreeForever: boolean;
  maxCompanies: number;
  currentCompaniesCount: number;
  canCreateMoreCompanies: boolean;
}

/**
 * Hook para gerenciar status de assinatura e trial
 *
 * @returns Informações completas sobre o status da assinatura
 *
 * @example
 * const { isTrialExpired, daysRemaining, canAccessPlatform } = useSubscriptionStatus();
 *
 * if (isTrialExpired) {
 *   return <Navigate to="/upgrade" />;
 * }
 */
export function useSubscriptionStatus() {
  const { company } = useCompany();

  const { data, isLoading } = useQuery({
    queryKey: ['subscription-status', company?.id],
    queryFn: async () => {
      if (!company?.id) return null;

      // Busca dados da empresa com o plano
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select(
          `
          subscription_status,
          trial_ends_at,
          subscription_started_at,
          parent_company_id,
          is_primary_company,
          subscription_plans (
            name,
            slug,
            is_free_plan,
            max_companies
          )
        `
        )
        .eq('id', company.id)
        .single();

      if (companyError) throw companyError;

      // Conta quantas empresas existem no grupo
      let companiesCount = 1;
      if (companyData.is_primary_company) {
        const { count } = await supabase
          .from('companies')
          .select('*', { count: 'exact', head: true })
          .or(`id.eq.${company.id},parent_company_id.eq.${company.id}`);

        companiesCount = count || 1;
      }

      return {
        ...companyData,
        companiesCount,
      };
    },
    enabled: !!company?.id,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });

  // Calcula informações derivadas
  const subscriptionInfo: SubscriptionStatusData = useMemo(() => {
    if (!data) {
      return {
        status: 'trial' as SubscriptionStatus,
        isTrialExpired: false,
        daysRemaining: 0,
        canAccessPlatform: false,
        trialEndsAt: null,
        subscriptionStartedAt: null,
        planName: 'Free',
        planSlug: 'free',
        isFreeForever: false,
        maxCompanies: 1,
        currentCompaniesCount: 0,
        canCreateMoreCompanies: false,
      };
    }

    const status = data.subscription_status as SubscriptionStatus;
    const trialEndsAt = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
    const subscriptionStartedAt = data.subscription_started_at
      ? new Date(data.subscription_started_at)
      : null;
    const now = new Date();

    // Verifica se trial expirou
    const isTrialExpired = status === 'trial' && trialEndsAt !== null && trialEndsAt < now;

    // Calcula dias restantes
    let daysRemaining = 0;
    if (trialEndsAt && status === 'trial') {
      const diffMs = trialEndsAt.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    // Verifica se pode acessar a plataforma
    const canAccessPlatform = status === 'active' || (status === 'trial' && !isTrialExpired);

    // Informações do plano
    const plan = data.subscription_plans as any;
    const planName = plan?.name || 'Free';
    const planSlug = plan?.slug || 'free';
    const isFreeForever = plan?.is_free_plan || false;
    const maxCompanies = plan?.max_companies || 1;
    const currentCompaniesCount = data.companiesCount || 1;
    const canCreateMoreCompanies = currentCompaniesCount < maxCompanies;

    return {
      status,
      isTrialExpired,
      daysRemaining,
      canAccessPlatform,
      trialEndsAt,
      subscriptionStartedAt,
      planName,
      planSlug,
      isFreeForever,
      maxCompanies,
      currentCompaniesCount,
      canCreateMoreCompanies,
    };
  }, [data]);

  return {
    ...subscriptionInfo,
    isLoading,
    refetch: () => {
      // Trigger refetch via query invalidation
    },
  };
}

/**
 * Hook helper para verificar rapidamente se usuário pode acessar
 */
export function useCanAccessPlatform() {
  const { canAccessPlatform, isLoading } = useSubscriptionStatus();
  return { canAccessPlatform, isLoading };
}

/**
 * Hook helper para pegar badge de status
 */
export function useSubscriptionBadge() {
  const { status, daysRemaining, planName, isTrialExpired, isFreeForever } =
    useSubscriptionStatus();

  // Define cor e texto do badge
  let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
  let badgeText = planName;

  if (status === 'trial') {
    if (isTrialExpired) {
      badgeVariant = 'destructive';
      badgeText = 'Trial Expirado';
    } else if (daysRemaining <= 1) {
      badgeVariant = 'destructive';
      badgeText = `${planName} • ${daysRemaining}d`;
    } else if (daysRemaining <= 3) {
      badgeVariant = 'secondary';
      badgeText = `${planName} • ${daysRemaining}d`;
    } else {
      badgeVariant = 'outline';
      badgeText = `${planName} • Trial`;
    }
  } else if (isFreeForever) {
    badgeVariant = 'secondary';
    badgeText = 'Free';
  }

  return {
    badgeVariant,
    badgeText,
    status,
    daysRemaining,
    isTrialExpired,
  };
}
