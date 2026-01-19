import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  company_id: string | null;
  message_color?: string | null;
  current_session_id?: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    // 1. Fetch profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, phone, current_session_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return null;
    }

    // 2. Fetch company_id (default or first one)
    const { data: companyData, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (companyError) {
        console.error('Error fetching company:', companyError);
    }

    return {
      ...profileData,
      company_id: companyData?.company_id || null,
      message_color: null // Placeholder or fetch if needed
    } as Profile;
  };

  useEffect(() => {
    let subscription: any;

    const setupSession = async (session: any) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const userProfile = await fetchProfile(currentUser.id);
        setProfile(userProfile);

        // Check for session ID and generate if missing or mismatched
        let localSessionId = localStorage.getItem('perinia_session_id');
        
        if (!userProfile?.current_session_id) {
          // No session in DB, generate new one
          const newSessionId = uuidv4();
          localStorage.setItem('perinia_session_id', newSessionId);
          await supabase
            .from('profiles')
            .update({ current_session_id: newSessionId })
            .eq('id', currentUser.id);
        } else if (!localSessionId || userProfile.current_session_id !== localSessionId) {
          // Mismatch or no local session - could be a new login elsewhere or fresh login here
          // If we just signed in (e.g. redirected from Auth), we should have set it.
          // If it's mismatched, it means another session is active.
          
          // Allow the current tab to "take over" the session if it's a fresh load with no local ID
          if (!localSessionId) {
            const newSessionId = uuidv4();
            localStorage.setItem('perinia_session_id', newSessionId);
            await supabase
              .from('profiles')
              .update({ current_session_id: newSessionId })
              .eq('id', currentUser.id);
          } else {
            // Truly mismatched local ID - someone else logged in
            console.warn('Concurrent login detected. Logging out...');
            await supabase.auth.signOut();
            localStorage.removeItem('perinia_session_id');
            return;
          }
        }

        // Subscribe to profile changes for the current user
        subscription = supabase
          .channel(`profile_${currentUser.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${currentUser.id}`,
            },
            async (payload) => {
              const newSessionId = payload.new.current_session_id;
              const localId = localStorage.getItem('perinia_session_id');
              
              if (newSessionId && localId && newSessionId !== localId) {
                console.warn('New session detected on another device. Logging out...');
                await supabase.auth.signOut();
                localStorage.removeItem('perinia_session_id');
                window.location.href = '/auth';
              }
            }
          )
          .subscribe();
      } else {
        setProfile(null);
      }
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setupSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
      await setupSession(session);
      setLoading(false);
    });

    return () => {
      authSubscription.unsubscribe();
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  return { user, profile, loading };
}
