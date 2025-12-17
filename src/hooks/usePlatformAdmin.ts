import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const usePlatformAdmin = () => {
  const { user, loading: authLoading } = useAuth();

  const { data: isPlatformAdmin = false, isLoading: queryLoading } = useQuery({
    queryKey: ['platform-admin', user?.id],
    queryFn: async () => {
      console.log('usePlatformAdmin - Verificando admin para user:', user?.id);

      if (!user?.id) {
        console.log('usePlatformAdmin - Sem user ID, retornando false');
        return false;
      }

      const { data, error } = await supabase.rpc('is_platform_admin', {
        _user_id: user.id,
      });

      if (error) {
        console.error('usePlatformAdmin - Error checking platform admin:', error);
        return false;
      }

      console.log('usePlatformAdmin - Resultado da função RPC:', data);
      return data || false;
    },
    enabled: !!user?.id,
  });

  console.log('usePlatformAdmin - Estado atual:', {
    isPlatformAdmin,
    isLoading: authLoading || queryLoading,
    userId: user?.id,
  });

  return {
    isPlatformAdmin,
    isLoading: authLoading || queryLoading,
  };
};
