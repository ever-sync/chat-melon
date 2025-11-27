import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { action, taskId, userId, companyId } = await req.json();

    // Busca token do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('google_calendar_token, google_calendar_refresh_token, google_calendar_connected')
      .eq('id', userId)
      .single();

    if (!profile?.google_calendar_connected) {
      throw new Error('Google Calendar not connected');
    }

    // Verifica se token expirou
    let accessToken = profile.google_calendar_token?.access_token;
    const expiresAt = profile.google_calendar_token?.expires_at;

    if (expiresAt && Date.now() > expiresAt) {
      // Refresh token
      const refreshResponse = await supabase.functions.invoke('google-calendar-oauth', {
        body: { action: 'refresh_token', userId },
      });
      accessToken = refreshResponse.data.access_token;
    }

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    if (action === 'create_event') {
      // Busca tarefa
      const { data: task } = await supabase
        .from('tasks')
        .select('*, contacts(*)')
        .eq('id', taskId)
        .single();

      if (!task) throw new Error('Task not found');

      // Cria evento no Google Calendar
      const event = {
        summary: task.title,
        description: task.description || '',
        start: {
          dateTime: new Date(task.due_date).toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: new Date(new Date(task.due_date).getTime() + 60 * 60 * 1000).toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 30 },
          ],
        },
      };

      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers,
          body: JSON.stringify(event),
        }
      );

      const googleEvent = await response.json();

      if (googleEvent.error) {
        throw new Error(googleEvent.error.message);
      }

      // Salva sincronização
      await supabase.from('calendar_sync').insert({
        company_id: companyId,
        user_id: userId,
        task_id: taskId,
        google_event_id: googleEvent.id,
        sync_direction: 'bidirectional',
      });

      console.log('Event created:', googleEvent.id);

      return new Response(
        JSON.stringify({ success: true, eventId: googleEvent.id, eventLink: googleEvent.htmlLink }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update_event') {
      // Busca sincronização existente
      const { data: sync } = await supabase
        .from('calendar_sync')
        .select('*')
        .eq('task_id', taskId)
        .single();

      if (!sync) {
        throw new Error('No sync record found');
      }

      // Busca tarefa atualizada
      const { data: task } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      // Atualiza evento
      const event = {
        summary: task.title,
        description: task.description || '',
        start: {
          dateTime: new Date(task.due_date).toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: new Date(new Date(task.due_date).getTime() + 60 * 60 * 1000).toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
      };

      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${sync.google_event_id}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(event),
        }
      );

      // Atualiza timestamp de sincronização
      await supabase
        .from('calendar_sync')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', sync.id);

      console.log('Event updated:', sync.google_event_id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete_event') {
      // Busca sincronização
      const { data: sync } = await supabase
        .from('calendar_sync')
        .select('*')
        .eq('task_id', taskId)
        .single();

      if (sync) {
        // Deleta evento do Google Calendar
        await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${sync.google_event_id}`,
          {
            method: 'DELETE',
            headers,
          }
        );

        // Remove sincronização
        await supabase
          .from('calendar_sync')
          .delete()
          .eq('id', sync.id);

        console.log('Event deleted:', sync.google_event_id);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'list_events') {
      // Lista eventos do dia
      const timeMin = new Date();
      timeMin.setHours(0, 0, 0, 0);
      
      const timeMax = new Date();
      timeMax.setHours(23, 59, 59, 999);

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        `timeMin=${timeMin.toISOString()}&` +
        `timeMax=${timeMax.toISOString()}&` +
        `singleEvents=true&` +
        `orderBy=startTime&` +
        `maxResults=10`,
        { headers }
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      return new Response(
        JSON.stringify({ events: data.items || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'check_availability') {
      // Verifica disponibilidade para uma data
      const { date } = await req.json();
      
      const timeMin = new Date(date);
      const timeMax = new Date(date);
      timeMax.setHours(23, 59, 59, 999);

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        `timeMin=${timeMin.toISOString()}&` +
        `timeMax=${timeMax.toISOString()}&` +
        `singleEvents=true&` +
        `orderBy=startTime`,
        { headers }
      );

      const data = await response.json();

      // Encontra slots disponíveis
      const events = data.items || [];
      const slots = [];
      
      // Horário comercial: 9h às 18h
      for (let hour = 9; hour < 18; hour++) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, 0, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setHours(hour + 1);

        // Verifica se há conflito
        const hasConflict = events.some((event: any) => {
          const eventStart = new Date(event.start.dateTime || event.start.date);
          const eventEnd = new Date(event.end.dateTime || event.end.date);
          return slotStart < eventEnd && slotEnd > eventStart;
        });

        if (!hasConflict) {
          slots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            label: `${hour}:00 - ${hour + 1}:00`,
          });
        }
      }

      return new Response(
        JSON.stringify({ slots }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in google-calendar-sync:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});