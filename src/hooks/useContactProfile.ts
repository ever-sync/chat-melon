import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useContactProfile(contactId: string, phone: string, companyId: string) {
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!contactId || !phone || !companyId) return;

      setIsLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase.functions.invoke('evolution-fetch-contact-profile', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: { contactId, phone, companyId },
        });

        if (data?.profilePictureUrl) {
          setProfileUrl(data.profilePictureUrl);
        }
      } catch (err) {
        console.error('Erro ao buscar foto:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [contactId, phone, companyId]);

  return { profileUrl, isLoading };
}
