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

    const { action, taskId, userId, companyId, event: eventData } = await req.json();

    // 🔥 IMPORTANTE: Busca token da nova tabela (isolado por empresa)
    if (!companyId) {
      throw new Error('companyId é obrigatório');
    }

    console.log('🔍 Buscando token do Google Calendar:', { userId, companyId });

    const { data: tokenData } = await supabase
      .from('google_calendar_tokens')
      .select('access_token, refresh_token, token_expiry, google_email')
      .eq('user_id', userId)
      .eq('company_id', companyId)  // 👈 Filtrar por empresa
      .maybeSingle();

    if (!tokenData) {
      throw new Error('Google Calendar not connected for this company');
    }

    console.log('✅ Token encontrado para:', tokenData.google_email);

    // Verifica se token expirou
    let accessToken = tokenData.access_token;
    const expiresAt = tokenData.token_expiry ? new Date(tokenData.token_expiry).getTime() : 0;

    if (expiresAt && Date.now() > expiresAt) {
      console.log('🔄 Token expirado, renovando...');
      // Refresh token COM companyId
      const refreshResponse = await supabase.functions.invoke('google-calendar-oauth', {
        body: {
          action: 'refresh_token',
          userId,
          companyId,  // 👈 Passar companyId
        },
      });
      accessToken = refreshResponse.data.access_token;
      console.log('✅ Token renovado');
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

    if (action === 'list_month_events') {
      // Lista eventos do mês inteiro
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth(), 1);
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      console.log('Fetching calendar events for:', {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        userId,
      });

      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        `timeMin=${timeMin.toISOString()}&` +
        `timeMax=${timeMax.toISOString()}&` +
        `singleEvents=true&` +
        `orderBy=startTime&` +
        `maxResults=100`;

      console.log('Calendar API URL:', url);

      const response = await fetch(url, { headers });

      const data = await response.json();

      console.log('Calendar API response:', {
        status: response.status,
        itemsCount: data.items?.length || 0,
        hasError: !!data.error,
      });

      if (data.error) {
        console.error('Calendar API error:', data.error);
        throw new Error(data.error.message);
      }

      console.log('Returning events:', data.items?.length || 0);

      return new Response(
        JSON.stringify({ events: data.items || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'create_direct_event') {
      // Cria evento diretamente no Google Calendar sem vincular a tarefa
      if (!eventData) throw new Error('Event data is required');

      // Se tem conferenceData, precisa adicionar o parâmetro conferenceDataVersion
      const url = eventData.conferenceData
        ? 'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1'
        : 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

      console.log('Creating event with conferenceData:', !!eventData.conferenceData);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(eventData),
      });

      const googleEvent = await response.json();

      if (googleEvent.error) {
        console.error('Error creating event:', googleEvent.error);
        throw new Error(googleEvent.error.message);
      }

      console.log('Direct event created:', {
        id: googleEvent.id,
        hasMeet: !!googleEvent.conferenceData,
        meetLink: googleEvent.conferenceData?.entryPoints?.[0]?.uri,
      });

      return new Response(
        JSON.stringify({
          success: true,
          eventId: googleEvent.id,
          eventLink: googleEvent.htmlLink,
          meetLink: googleEvent.conferenceData?.entryPoints?.[0]?.uri,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update_google_event') {
      // Atualiza evento diretamente no Google Calendar
      if (!eventData || !eventData.eventId) throw new Error('Event data and eventId are required');

      const eventId = eventData.eventId;
      delete eventData.eventId; // Remove eventId do body

      console.log('Updating Google Calendar event:', eventId);

      // Se tem conferenceData, precisa adicionar o parâmetro conferenceDataVersion
      const url = eventData.conferenceData
        ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?conferenceDataVersion=1`
        : `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(eventData),
      });

      const googleEvent = await response.json();

      if (googleEvent.error) {
        console.error('Error updating event:', googleEvent.error);
        throw new Error(googleEvent.error.message);
      }

      console.log('Event updated successfully:', googleEvent.id);

      return new Response(
        JSON.stringify({
          success: true,
          event: googleEvent,
          meetLink: googleEvent.conferenceData?.entryPoints?.[0]?.uri,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete_google_event') {
      // Deleta evento diretamente do Google Calendar
      if (!eventData?.eventId) throw new Error('Event ID is required');

      const eventId = eventData.eventId;

      console.log('Deleting Google Calendar event:', eventId);

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'DELETE',
          headers,
        }
      );

      if (response.status === 204) {
        console.log('Event deleted successfully');
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const errorData = await response.json();
      if (errorData.error) {
        console.error('Error deleting event:', errorData.error);
        throw new Error(errorData.error.message);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'check_availability') {
      // Verifica disponibilidade para uma data
      if (!eventData?.date) throw new Error('Date is required');

      const timeMin = new Date(eventData.date);
      const timeMax = new Date(eventData.date);
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