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
        return false;
      }

      const { data, error } = await supabase.rpc('is_platform_admin', {
        _user_id: user.id,
      });

      if (error) {
        return false;
      }

      return data || false;
    },
    enabled: !!user?.id,
  });

  return {
    isPlatformAdmin,
    isLoading: authLoading || queryLoading,
  };
};
