
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LiveFeedEvent } from '@/types/gamification';
import { toast } from 'sonner';

export const useLiveEvents = (companyId?: string) => {
  const [events, setEvents] = useState<LiveFeedEvent[]>([]);

  useEffect(() => {
    if (!companyId) return;

    // Load initial recent events
    const fetchRecentEvents = async () => {
      // Note: This is a simple query, in production you might want to join with profiles
      // or rely on a view. For now, we fetch raw events.
      const { data, error } = await supabase
        .from('gamification_events')
        .select(`
            *,
            profiles:user_id (
                first_name,
                last_name,
                avatar_url
            )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data && !error) {
        const formattedEvents: LiveFeedEvent[] = data.map((e: any) => ({
          type: e.event_type as any,
          user: { 
            id: e.user_id, 
            name: e.profiles ? `${e.profiles.first_name || ''} ${e.profiles.last_name || ''}`.trim() : 'Unknown User', 
            avatar_url: e.profiles?.avatar_url || null 
          },
          timestamp: new Date(e.created_at),
          data: e.event_data
        }));
        setEvents(formattedEvents);
      }
    };
    
    fetchRecentEvents();

    const channel = supabase
      .channel('gamification_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gamification_events',
          filter: `company_id=eq.${companyId}`
        },
        async (payload) => {
           const newEventRecord = payload.new as any;
           
           // Fetch user profile for the new event
           const { data: userData } = await supabase
             .from('profiles')
             .select('first_name, last_name, avatar_url')
             .eq('id', newEventRecord.user_id)
             .single();
           
           const userName = userData ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim() : 'User';
           
           const newEvent: LiveFeedEvent = {
               type: newEventRecord.event_type as any,
               user: { 
                   id: newEventRecord.user_id, 
                   name: userName, 
                   avatar_url: userData?.avatar_url || null
               },
               timestamp: new Date(newEventRecord.created_at),
               data: newEventRecord.event_data
           };
           
           setEvents((prev) => [newEvent, ...prev].slice(0, 50));
           
           // Toast notification for important events
           toast(newEvent.data.title || 'New Event', {
               description: newEvent.data.description,
           });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  return { events };
};
