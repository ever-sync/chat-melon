import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-widget-company-id, x-widget-session-id',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    // Supabase adds function name to path, so action is the last segment
    // URL pattern: /widget-api/config or /widget-api/start etc.
    const action = pathParts[pathParts.length - 1] || pathParts[0];

    // Get company ID from header or query
    const companyId = req.headers.get('x-widget-company-id') || url.searchParams.get('companyId');
    const sessionId = req.headers.get('x-widget-session-id') || url.searchParams.get('sessionId');

    if (!companyId) {
      return new Response(
        JSON.stringify({ error: 'Company ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'config':
        return await getWidgetConfig(supabase, companyId);

      case 'start':
        return await startConversation(supabase, req, companyId, sessionId);

      case 'message':
        return await sendMessage(supabase, req, companyId, sessionId);

      case 'messages':
        return await getMessages(supabase, req, companyId, sessionId);

      case 'close':
        return await closeConversation(supabase, req, companyId, sessionId);

      case 'typing':
        return await handleTyping(supabase, req, companyId, sessionId);

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Widget API Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Get widget configuration
async function getWidgetConfig(supabase: any, companyId: string): Promise<Response> {
  const { data: settings, error } = await supabase
    .from('widget_settings')
    .select(`
      enabled,
      primary_color,
      secondary_color,
      position,
      button_size,
      border_radius,
      show_branding,
      logo_url,
      company_name,
      greeting_title,
      greeting_message,
      offline_message,
      input_placeholder,
      require_name,
      require_email,
      require_phone,
      custom_fields,
      show_agent_photo,
      show_agent_name,
      play_sound,
      show_typing_indicator,
      business_hours_only,
      business_hours,
      timezone
    `)
    .eq('company_id', companyId)
    .single();

  if (error || !settings) {
    return new Response(
      JSON.stringify({ error: 'Widget not configured' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!settings.enabled) {
    return new Response(
      JSON.stringify({ error: 'Widget disabled' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check business hours if enabled
  if (settings.business_hours_only) {
    const isOpen = checkBusinessHours(settings.business_hours, settings.timezone);
    if (!isOpen) {
      return new Response(
        JSON.stringify({
          ...settings,
          is_offline: true,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response(
    JSON.stringify(settings),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Check if within business hours
function checkBusinessHours(businessHours: any, timezone: string): boolean {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const weekday = parts.find(p => p.type === 'weekday')?.value?.toLowerCase();
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
    const currentTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    const dayHours = businessHours[weekday];
    if (!dayHours) return false;

    return currentTime >= dayHours.start && currentTime <= dayHours.end;
  } catch {
    return true; // Default to open if error
  }
}

// Start a new conversation
async function startConversation(
  supabase: any,
  req: Request,
  companyId: string,
  sessionId: string | null
): Promise<Response> {
  const body = await req.json();
  const { name, email, phone, metadata = {} } = body;

  // Generate session ID if not provided
  const visitorSessionId = sessionId || crypto.randomUUID();

  // Create or update visitor
  const { data: visitor, error: visitorError } = await supabase
    .from('widget_visitors')
    .upsert({
      company_id: companyId,
      session_id: visitorSessionId,
      name,
      email,
      phone,
      metadata,
      last_seen_at: new Date().toISOString(),
      user_agent: req.headers.get('user-agent'),
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
      referrer: req.headers.get('referer'),
    }, {
      onConflict: 'company_id,session_id',
    })
    .select()
    .single();

  if (visitorError) {
    console.error('Visitor error:', visitorError);
    return new Response(
      JSON.stringify({ error: 'Failed to create visitor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check for existing active widget conversation
  const { data: existingWidgetConv } = await supabase
    .from('widget_conversations')
    .select('id, main_conversation_id')
    .eq('visitor_id', visitor.id)
    .eq('status', 'active')
    .single();

  if (existingWidgetConv) {
    return new Response(
      JSON.stringify({
        conversation_id: existingWidgetConv.id,
        main_conversation_id: existingWidgetConv.main_conversation_id,
        session_id: visitorSessionId,
        visitor_id: visitor.id,
        resumed: true,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Create or find contact in main contacts table for chat integration
  let contactId = null;
  const contactIdentifier = phone || email || `widget_${visitorSessionId}`;
  
  // Try to find existing contact by phone or email
  let existingContact = null;
  if (phone) {
    const { data } = await supabase
      .from('contacts')
      .select('id')
      .eq('company_id', companyId)
      .eq('phone', phone)
      .single();
    existingContact = data;
  }
  
  if (!existingContact && email) {
    const { data } = await supabase
      .from('contacts')
      .select('id')
      .eq('company_id', companyId)
      .eq('email', email)
      .single();
    existingContact = data;
  }

  if (existingContact) {
    contactId = existingContact.id;
    // Update contact with latest info
    await supabase
      .from('contacts')
      .update({ 
        name: name || undefined,
        phone: phone || undefined,
        email: email || undefined,
        last_seen_at: new Date().toISOString()
      })
      .eq('id', contactId);
  } else {
    // Create new contact
    const { data: newContact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        company_id: companyId,
        name: name || 'Visitante Web',
        phone: phone || null,
        email: email || null,
        source: 'webchat',
        metadata: {
          ...metadata,
          widget_session_id: visitorSessionId,
          widget_visitor_id: visitor.id
        }
      })
      .select('id')
      .single();

    if (!contactError && newContact) {
      contactId = newContact.id;
    }
  }

  // Create main conversation for chat integration
  let mainConversationId = null;
  if (contactId) {
    const { data: mainConv, error: mainConvError } = await supabase
      .from('conversations')
      .insert({
        company_id: companyId,
        contact_id: contactId,
        channel: 'webchat',
        status: 'open',
        last_message_at: new Date().toISOString(),
        metadata: {
          widget_session_id: visitorSessionId,
          widget_visitor_id: visitor.id,
          source_url: metadata.page_url || null,
          source_title: metadata.page_title || null
        }
      })
      .select('id')
      .single();

    if (!mainConvError && mainConv) {
      mainConversationId = mainConv.id;
    } else {
      console.error('Main conversation error:', mainConvError);
    }
  }

  // Create widget conversation
  const widgetConvData: Record<string, unknown> = {
    company_id: companyId,
    visitor_id: visitor.id,
    status: 'active',
    first_message_at: new Date().toISOString(),
  };

  // Add main_conversation_id if it was created
  if (mainConversationId) {
    widgetConvData.main_conversation_id = mainConversationId;
  }

  const { data: conversation, error: convError } = await supabase
    .from('widget_conversations')
    .insert(widgetConvData)
    .select()
    .single();

  if (convError) {
    console.error('Widget conversation error:', convError);
    return new Response(
      JSON.stringify({ error: 'Failed to create conversation' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Note: Stats update removed - would need RPC function for atomic increment

  return new Response(
    JSON.stringify({
      conversation_id: conversation.id,
      main_conversation_id: mainConversationId,
      session_id: visitorSessionId,
      visitor_id: visitor.id,
      created: true,
    }),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Send a message
async function sendMessage(
  supabase: any,
  req: Request,
  companyId: string,
  sessionId: string | null
): Promise<Response> {
  if (!sessionId) {
    return new Response(
      JSON.stringify({ error: 'Session ID required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const body = await req.json();
  const { conversation_id, content, message_type = 'text' } = body;

  if (!conversation_id || !content) {
    return new Response(
      JSON.stringify({ error: 'Conversation ID and content required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Verify visitor owns the conversation
  const { data: visitor } = await supabase
    .from('widget_visitors')
    .select('id')
    .eq('company_id', companyId)
    .eq('session_id', sessionId)
    .single();

  if (!visitor) {
    return new Response(
      JSON.stringify({ error: 'Invalid session' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get the widget conversation to find main_conversation_id
  const { data: widgetConv } = await supabase
    .from('widget_conversations')
    .select('main_conversation_id')
    .eq('id', conversation_id)
    .single();

  // Create widget message
  const { data: message, error: msgError } = await supabase
    .from('widget_messages')
    .insert({
      conversation_id,
      company_id: companyId,
      sender_type: 'visitor',
      sender_id: visitor.id,
      content,
      message_type,
    })
    .select()
    .single();

  if (msgError) {
    console.error('Widget message error:', msgError);
    return new Response(
      JSON.stringify({ error: 'Failed to send message' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Also create message in main messages table for chat integration
  if (widgetConv?.main_conversation_id) {
    const { error: mainMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: widgetConv.main_conversation_id,
        direction: 'inbound',
        content,
        message_type,
        sender_type: 'contact',
        metadata: {
          widget_message_id: message.id,
          widget_conversation_id: conversation_id,
          widget_visitor_id: visitor.id
        }
      });

    if (mainMsgError) {
      console.error('Main message error:', mainMsgError);
    } else {
      // Update main conversation last_message fields
      await supabase
        .from('conversations')
        .update({ 
          last_message_at: new Date().toISOString(),
          last_message: content
        })
        .eq('id', widgetConv.main_conversation_id);
    }
  }

  // Update widget conversation
  await supabase
    .from('widget_conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversation_id);

  // Update visitor
  await supabase
    .from('widget_visitors')
    .update({
      last_seen_at: new Date().toISOString(),
    })
    .eq('id', visitor.id);

  // Note: Stats update removed - would need RPC function for atomic increment

  return new Response(
    JSON.stringify({
      id: message.id,
      created_at: message.created_at,
    }),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Get messages for a conversation
async function getMessages(
  supabase: any,
  req: Request,
  companyId: string,
  sessionId: string | null
): Promise<Response> {
  if (!sessionId) {
    return new Response(
      JSON.stringify({ error: 'Session ID required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const url = new URL(req.url);
  const conversationId = url.searchParams.get('conversation_id');
  const after = url.searchParams.get('after'); // For polling

  if (!conversationId) {
    return new Response(
      JSON.stringify({ error: 'Conversation ID required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Verify visitor owns the conversation
  const { data: visitor } = await supabase
    .from('widget_visitors')
    .select('id')
    .eq('company_id', companyId)
    .eq('session_id', sessionId)
    .single();

  if (!visitor) {
    return new Response(
      JSON.stringify({ error: 'Invalid session' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let query = supabase
    .from('widget_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (after) {
    query = query.gt('created_at', after);
  }

  const { data: messages, error } = await query;

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to get messages' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ messages }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Close conversation
async function closeConversation(
  supabase: any,
  req: Request,
  companyId: string,
  sessionId: string | null
): Promise<Response> {
  if (!sessionId) {
    return new Response(
      JSON.stringify({ error: 'Session ID required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const body = await req.json();
  const { conversation_id, rating, feedback } = body;

  // Update conversation
  const { error } = await supabase
    .from('widget_conversations')
    .update({
      status: 'closed',
      closed_at: new Date().toISOString(),
      rating,
      feedback,
    })
    .eq('id', conversation_id);

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to close conversation' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handle typing indicator
async function handleTyping(
  supabase: any,
  req: Request,
  companyId: string,
  sessionId: string | null
): Promise<Response> {
  const body = await req.json();
  const { conversation_id, is_typing } = body;

  // Broadcast to realtime channel
  const channel = supabase.channel(`widget:${conversation_id}`);
  await channel.send({
    type: 'broadcast',
    event: 'typing',
    payload: { is_typing, from: 'visitor' },
  });

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
