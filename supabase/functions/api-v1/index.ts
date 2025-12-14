import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

interface ApiKeyInfo {
  company_id: string;
  api_key_id: string;
  permissions: string[];
  scopes: string[];
  rate_limit_per_minute: number;
}

// Hash API key for lookup
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Validate API key and get company info
async function validateApiKey(supabase: any, apiKey: string): Promise<ApiKeyInfo | null> {
  const keyHash = await hashApiKey(apiKey);

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, company_id, permissions, scopes, rate_limit_per_minute, is_active, expires_at, revoked_at')
    .eq('key_hash', keyHash)
    .single();

  if (error || !data) return null;
  if (!data.is_active) return null;
  if (data.revoked_at) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;

  // Update last used
  await supabase
    .from('api_keys')
    .update({
      last_used_at: new Date().toISOString(),
      total_requests: supabase.sql`total_requests + 1`,
    })
    .eq('id', data.id);

  return {
    company_id: data.company_id,
    api_key_id: data.id,
    permissions: data.permissions,
    scopes: data.scopes,
    rate_limit_per_minute: data.rate_limit_per_minute,
  };
}

// Check if user has permission
function hasPermission(keyInfo: ApiKeyInfo, requiredPermission: string): boolean {
  if (keyInfo.permissions.includes('admin')) return true;
  return keyInfo.permissions.includes(requiredPermission);
}

// Check if user has scope
function hasScope(keyInfo: ApiKeyInfo, requiredScope: string): boolean {
  if (keyInfo.scopes.includes('*')) return true;
  return keyInfo.scopes.includes(requiredScope);
}

// Log API request
async function logRequest(
  supabase: any,
  keyInfo: ApiKeyInfo,
  req: Request,
  statusCode: number,
  responseBody?: any,
  errorMessage?: string,
  startTime?: number
) {
  try {
    const url = new URL(req.url);
    await supabase.from('api_request_logs').insert({
      api_key_id: keyInfo.api_key_id,
      company_id: keyInfo.company_id,
      method: req.method,
      path: url.pathname,
      query_params: Object.fromEntries(url.searchParams),
      status_code: statusCode,
      response_body: responseBody,
      error_message: errorMessage,
      duration_ms: startTime ? Date.now() - startTime : null,
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
      user_agent: req.headers.get('user-agent'),
    });
  } catch (e) {
    console.error('Error logging request:', e);
  }
}

serve(async (req) => {
  const startTime = Date.now();

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get API key from header
    const apiKey = req.headers.get('x-api-key') ||
                   req.headers.get('authorization')?.replace('Bearer ', '');

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate API key
    const keyInfo = await validateApiKey(supabase, apiKey);
    if (!keyInfo) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse URL and route
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Expected: /api-v1/contacts, /api-v1/contacts/123, etc.
    const resource = pathParts[0]; // contacts, conversations, deals, etc.
    const resourceId = pathParts[1];
    const subResource = pathParts[2];

    let response: Response;

    // Route to handlers
    switch (resource) {
      case 'contacts':
        response = await handleContacts(supabase, req, keyInfo, resourceId);
        break;

      case 'conversations':
        response = await handleConversations(supabase, req, keyInfo, resourceId, subResource);
        break;

      case 'messages':
        response = await handleMessages(supabase, req, keyInfo, resourceId);
        break;

      case 'deals':
        response = await handleDeals(supabase, req, keyInfo, resourceId);
        break;

      case 'tasks':
        response = await handleTasks(supabase, req, keyInfo, resourceId);
        break;

      case 'webhooks':
        response = await handleWebhooks(supabase, req, keyInfo, resourceId);
        break;

      default:
        response = new Response(
          JSON.stringify({
            error: 'Not found',
            available_endpoints: [
              'GET /contacts',
              'POST /contacts',
              'GET /contacts/:id',
              'PUT /contacts/:id',
              'DELETE /contacts/:id',
              'GET /conversations',
              'GET /conversations/:id',
              'POST /conversations/:id/messages',
              'GET /deals',
              'POST /deals',
              'GET /deals/:id',
              'PUT /deals/:id',
              'PATCH /deals/:id/stage',
              'GET /tasks',
              'POST /tasks',
              'PUT /tasks/:id',
              'POST /messages/send',
            ],
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Log the request
    await logRequest(supabase, keyInfo, req, response.status, null, null, startTime);

    return response;

  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Contacts Handler
async function handleContacts(
  supabase: any,
  req: Request,
  keyInfo: ApiKeyInfo,
  contactId?: string
): Promise<Response> {
  if (!hasScope(keyInfo, 'contacts')) {
    return new Response(
      JSON.stringify({ error: 'Scope "contacts" required' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const url = new URL(req.url);

  switch (req.method) {
    case 'GET':
      if (contactId) {
        // Get single contact
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('id', contactId)
          .eq('company_id', keyInfo.company_id)
          .single();

        if (error || !data) {
          return new Response(
            JSON.stringify({ error: 'Contact not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ data }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // List contacts with pagination
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
        const offset = (page - 1) * limit;

        let query = supabase
          .from('contacts')
          .select('*', { count: 'exact' })
          .eq('company_id', keyInfo.company_id)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        // Apply filters
        const search = url.searchParams.get('search');
        if (search) {
          query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
        }

        const tag = url.searchParams.get('tag');
        if (tag) {
          query = query.contains('tags', [tag]);
        }

        const { data, error, count } = await query;

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            data,
            meta: {
              page,
              limit,
              total: count,
              total_pages: Math.ceil((count || 0) / limit),
            },
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

    case 'POST':
      if (!hasPermission(keyInfo, 'write')) {
        return new Response(
          JSON.stringify({ error: 'Write permission required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const createBody = await req.json();
      const { data: created, error: createError } = await supabase
        .from('contacts')
        .insert({
          ...createBody,
          company_id: keyInfo.company_id,
        })
        .select()
        .single();

      if (createError) {
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ data: created }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    case 'PUT':
      if (!contactId) {
        return new Response(
          JSON.stringify({ error: 'Contact ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!hasPermission(keyInfo, 'write')) {
        return new Response(
          JSON.stringify({ error: 'Write permission required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const updateBody = await req.json();
      const { data: updated, error: updateError } = await supabase
        .from('contacts')
        .update(updateBody)
        .eq('id', contactId)
        .eq('company_id', keyInfo.company_id)
        .select()
        .single();

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ data: updated }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    case 'DELETE':
      if (!contactId) {
        return new Response(
          JSON.stringify({ error: 'Contact ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!hasPermission(keyInfo, 'delete')) {
        return new Response(
          JSON.stringify({ error: 'Delete permission required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId)
        .eq('company_id', keyInfo.company_id);

      if (deleteError) {
        return new Response(
          JSON.stringify({ error: deleteError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    default:
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
  }
}

// Conversations Handler
async function handleConversations(
  supabase: any,
  req: Request,
  keyInfo: ApiKeyInfo,
  conversationId?: string,
  subResource?: string
): Promise<Response> {
  if (!hasScope(keyInfo, 'conversations')) {
    return new Response(
      JSON.stringify({ error: 'Scope "conversations" required' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const url = new URL(req.url);

  // Handle /conversations/:id/messages
  if (conversationId && subResource === 'messages') {
    if (req.method === 'POST') {
      if (!hasPermission(keyInfo, 'write') || !hasScope(keyInfo, 'messages')) {
        return new Response(
          JSON.stringify({ error: 'Write permission and messages scope required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { content, message_type = 'text' } = await req.json();

      // Get conversation to verify ownership
      const { data: conv } = await supabase
        .from('conversations')
        .select('id, contact_number')
        .eq('id', conversationId)
        .eq('company_id', keyInfo.company_id)
        .single();

      if (!conv) {
        return new Response(
          JSON.stringify({ error: 'Conversation not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Send message via send-message function
      const { data: sendResult, error: sendError } = await supabase.functions.invoke('send-message', {
        body: {
          conversationId,
          content,
          messageType: message_type,
        },
      });

      if (sendError || !sendResult?.success) {
        return new Response(
          JSON.stringify({ error: sendResult?.error || 'Failed to send message' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message_id: sendResult.messageId }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET messages for conversation
    if (req.method === 'GET') {
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
      const before = url.searchParams.get('before'); // cursor-based pagination

      let query = supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (before) {
        query = query.lt('timestamp', before);
      }

      const { data, error } = await query;

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ data: data?.reverse() }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  switch (req.method) {
    case 'GET':
      if (conversationId) {
        const { data, error } = await supabase
          .from('conversations')
          .select('*, contact:contacts(*)')
          .eq('id', conversationId)
          .eq('company_id', keyInfo.company_id)
          .single();

        if (error || !data) {
          return new Response(
            JSON.stringify({ error: 'Conversation not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ data }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
        const offset = (page - 1) * limit;
        const status = url.searchParams.get('status');

        let query = supabase
          .from('conversations')
          .select('*', { count: 'exact' })
          .eq('company_id', keyInfo.company_id)
          .order('last_message_time', { ascending: false })
          .range(offset, offset + limit - 1);

        if (status) {
          query = query.eq('status', status);
        }

        const { data, error, count } = await query;

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            data,
            meta: { page, limit, total: count, total_pages: Math.ceil((count || 0) / limit) },
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

    default:
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
  }
}

// Messages Handler
async function handleMessages(
  supabase: any,
  req: Request,
  keyInfo: ApiKeyInfo,
  action?: string
): Promise<Response> {
  if (!hasScope(keyInfo, 'messages')) {
    return new Response(
      JSON.stringify({ error: 'Scope "messages" required' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (action === 'send' && req.method === 'POST') {
    if (!hasPermission(keyInfo, 'write')) {
      return new Response(
        JSON.stringify({ error: 'Write permission required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { phone, content, message_type = 'text' } = await req.json();

    if (!phone || !content) {
      return new Response(
        JSON.stringify({ error: 'Phone and content are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find or create conversation
    let { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('company_id', keyInfo.company_id)
      .eq('contact_number', phone)
      .single();

    if (!conv) {
      // Create contact and conversation
      const { data: contact } = await supabase
        .from('contacts')
        .insert({
          company_id: keyInfo.company_id,
          phone,
          name: phone,
        })
        .select()
        .single();

      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          company_id: keyInfo.company_id,
          contact_id: contact?.id,
          contact_name: phone,
          contact_number: phone,
          status: 'active',
        })
        .select()
        .single();

      conv = newConv;
    }

    // Send message
    const { data: sendResult, error: sendError } = await supabase.functions.invoke('send-message', {
      body: {
        conversationId: conv.id,
        content,
        messageType: message_type,
      },
    });

    if (sendError || !sendResult?.success) {
      return new Response(
        JSON.stringify({ error: sendResult?.error || 'Failed to send message' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        conversation_id: conv.id,
        message_id: sendResult.messageId,
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ error: 'Not found' }),
    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Deals Handler
async function handleDeals(
  supabase: any,
  req: Request,
  keyInfo: ApiKeyInfo,
  dealId?: string
): Promise<Response> {
  if (!hasScope(keyInfo, 'deals')) {
    return new Response(
      JSON.stringify({ error: 'Scope "deals" required' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const url = new URL(req.url);

  switch (req.method) {
    case 'GET':
      if (dealId) {
        const { data, error } = await supabase
          .from('deals')
          .select('*, contact:contacts(*), stage:pipeline_stages(*)')
          .eq('id', dealId)
          .eq('company_id', keyInfo.company_id)
          .single();

        if (error || !data) {
          return new Response(
            JSON.stringify({ error: 'Deal not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ data }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
        const offset = (page - 1) * limit;
        const status = url.searchParams.get('status');
        const stageId = url.searchParams.get('stage_id');

        let query = supabase
          .from('deals')
          .select('*, contact:contacts(name, phone), stage:pipeline_stages(name)', { count: 'exact' })
          .eq('company_id', keyInfo.company_id)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (status) query = query.eq('status', status);
        if (stageId) query = query.eq('stage_id', stageId);

        const { data, error, count } = await query;

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            data,
            meta: { page, limit, total: count, total_pages: Math.ceil((count || 0) / limit) },
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

    case 'POST':
      if (!hasPermission(keyInfo, 'write')) {
        return new Response(
          JSON.stringify({ error: 'Write permission required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const createBody = await req.json();
      const { data: created, error: createError } = await supabase
        .from('deals')
        .insert({
          ...createBody,
          company_id: keyInfo.company_id,
        })
        .select()
        .single();

      if (createError) {
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ data: created }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    case 'PUT':
    case 'PATCH':
      if (!dealId) {
        return new Response(
          JSON.stringify({ error: 'Deal ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!hasPermission(keyInfo, 'write')) {
        return new Response(
          JSON.stringify({ error: 'Write permission required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const updateBody = await req.json();
      const { data: updated, error: updateError } = await supabase
        .from('deals')
        .update(updateBody)
        .eq('id', dealId)
        .eq('company_id', keyInfo.company_id)
        .select()
        .single();

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ data: updated }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    default:
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
  }
}

// Tasks Handler
async function handleTasks(
  supabase: any,
  req: Request,
  keyInfo: ApiKeyInfo,
  taskId?: string
): Promise<Response> {
  if (!hasScope(keyInfo, 'tasks')) {
    return new Response(
      JSON.stringify({ error: 'Scope "tasks" required' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const url = new URL(req.url);

  switch (req.method) {
    case 'GET':
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
      const offset = (page - 1) * limit;
      const status = url.searchParams.get('status');

      let query = supabase
        .from('tasks')
        .select('*', { count: 'exact' })
        .eq('company_id', keyInfo.company_id)
        .order('due_date', { ascending: true })
        .range(offset, offset + limit - 1);

      if (status) query = query.eq('status', status);

      const { data, error, count } = await query;

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          data,
          meta: { page, limit, total: count, total_pages: Math.ceil((count || 0) / limit) },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    case 'POST':
      if (!hasPermission(keyInfo, 'write')) {
        return new Response(
          JSON.stringify({ error: 'Write permission required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const createBody = await req.json();
      const { data: created, error: createError } = await supabase
        .from('tasks')
        .insert({
          ...createBody,
          company_id: keyInfo.company_id,
        })
        .select()
        .single();

      if (createError) {
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ data: created }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    case 'PUT':
      if (!taskId) {
        return new Response(
          JSON.stringify({ error: 'Task ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!hasPermission(keyInfo, 'write')) {
        return new Response(
          JSON.stringify({ error: 'Write permission required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const updateBody = await req.json();
      const { data: updated, error: updateError } = await supabase
        .from('tasks')
        .update(updateBody)
        .eq('id', taskId)
        .eq('company_id', keyInfo.company_id)
        .select()
        .single();

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ data: updated }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    default:
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
  }
}

// Webhooks Handler
async function handleWebhooks(
  supabase: any,
  req: Request,
  keyInfo: ApiKeyInfo,
  webhookId?: string
): Promise<Response> {
  if (!hasScope(keyInfo, 'webhooks')) {
    return new Response(
      JSON.stringify({ error: 'Scope "webhooks" required' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  switch (req.method) {
    case 'GET':
      const { data, error } = await supabase
        .from('webhook_endpoints')
        .select('id, name, url, events, enabled, created_at')
        .eq('company_id', keyInfo.company_id);

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    case 'DELETE':
      if (!webhookId) {
        return new Response(
          JSON.stringify({ error: 'Webhook ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!hasPermission(keyInfo, 'delete')) {
        return new Response(
          JSON.stringify({ error: 'Delete permission required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: deleteError } = await supabase
        .from('webhook_endpoints')
        .delete()
        .eq('id', webhookId)
        .eq('company_id', keyInfo.company_id);

      if (deleteError) {
        return new Response(
          JSON.stringify({ error: deleteError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    default:
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
  }
}
