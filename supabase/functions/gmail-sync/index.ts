import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: Array<{ mimeType: string; body?: { data?: string } }>;
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, companyId, userId } = await req.json();

    if (!companyId || !userId) {
      throw new Error('companyId and userId are required');
    }

    // Buscar credenciais do Gmail
    const { data: credentials, error: credsError } = await supabaseClient
      .from('gmail_credentials')
      .select('*')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (credsError || !credentials) {
      throw new Error('Gmail credentials not found or inactive');
    }

    // Verificar se o token expirou
    let accessToken = credentials.access_token;
    const now = new Date();
    const expiry = new Date(credentials.token_expiry);

    if (expiry <= now) {
      // Renovar token
      console.log('Renovando access token...');
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
          refresh_token: credentials.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to refresh access token');
      }

      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token;

      // Atualizar no banco
      await supabaseClient
        .from('gmail_credentials')
        .update({
          access_token: accessToken,
          token_expiry: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        })
        .eq('id', credentials.id);
    }

    if (action === 'sync_messages') {
      // Buscar emails não lidos
      const gmailResponse = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=50',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!gmailResponse.ok) {
        throw new Error('Failed to fetch Gmail messages');
      }

      const gmailData = await gmailResponse.json();
      const messages = gmailData.messages || [];

      console.log(`Found ${messages.length} unread messages`);

      const processedMessages = [];

      // Processar cada mensagem
      for (const msg of messages) {
        const detailResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!detailResponse.ok) continue;

        const detail: GmailMessage = await detailResponse.json();

        // Extrair informações do email
        const headers = detail.payload.headers;
        const from = headers.find((h) => h.name.toLowerCase() === 'from')?.value || '';
        const subject = headers.find((h) => h.name.toLowerCase() === 'subject')?.value || '';
        const date = headers.find((h) => h.name.toLowerCase() === 'date')?.value || '';

        // Extrair email do remetente
        const emailMatch = from.match(/<(.+?)>/) || from.match(/([^\s<>]+@[^\s<>]+)/);
        const senderEmail = emailMatch ? emailMatch[1] || emailMatch[0] : from;

        // Extrair corpo do email
        let body = '';
        if (detail.payload.body?.data) {
          body = atob(detail.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        } else if (detail.payload.parts) {
          const textPart = detail.payload.parts.find(
            (p) => p.mimeType === 'text/plain' || p.mimeType === 'text/html'
          );
          if (textPart?.body?.data) {
            body = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
          }
        }

        // Buscar ou criar contato
        let contactId;
        const { data: existingContact } = await supabaseClient
          .from('contacts')
          .select('id')
          .eq('company_id', companyId)
          .eq('email', senderEmail)
          .single();

        if (existingContact) {
          contactId = existingContact.id;
        } else {
          // Criar novo contato
          const { data: newContact, error: contactError } = await supabaseClient
            .from('contacts')
            .insert({
              company_id: companyId,
              email: senderEmail,
              name: from.replace(/<.+?>/, '').trim() || senderEmail,
            })
            .select('id')
            .single();

          if (contactError) {
            console.error('Error creating contact:', contactError);
            continue;
          }
          contactId = newContact.id;
        }

        // Buscar canal de email
        const { data: channel } = await supabaseClient
          .from('channels')
          .select('id')
          .eq('company_id', companyId)
          .eq('type', 'email')
          .eq('is_active', true)
          .single();

        if (!channel) {
          console.error('No active email channel found');
          continue;
        }

        // Buscar ou criar conversa
        let conversationId;
        const { data: existingConv } = await supabaseClient
          .from('conversations')
          .select('id')
          .eq('channel_id', channel.id)
          .eq('contact_id', contactId)
          .eq('status', 'open')
          .single();

        if (existingConv) {
          conversationId = existingConv.id;
        } else {
          // Criar nova conversa
          const { data: newConv, error: convError } = await supabaseClient
            .from('conversations')
            .insert({
              company_id: companyId,
              channel_id: channel.id,
              contact_id: contactId,
              status: 'open',
              last_message_at: new Date(date).toISOString(),
            })
            .select('id')
            .single();

          if (convError) {
            console.error('Error creating conversation:', convError);
            continue;
          }
          conversationId = newConv.id;
        }

        // Criar mensagem
        const { error: msgError } = await supabaseClient.from('messages').insert({
          conversation_id: conversationId,
          contact_id: contactId,
          content: body || detail.snippet,
          message_type: 'text',
          direction: 'incoming',
          status: 'delivered',
          metadata: {
            gmail_message_id: detail.id,
            gmail_thread_id: detail.threadId,
            subject: subject,
            from: from,
          },
        });

        if (msgError) {
          console.error('Error creating message:', msgError);
          continue;
        }

        // Marcar email como lido
        await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/modify`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              removeLabelIds: ['UNREAD'],
            }),
          }
        );

        processedMessages.push({
          id: detail.id,
          from: senderEmail,
          subject: subject,
        });
      }

      // Atualizar last_sync_at
      await supabaseClient
        .from('gmail_credentials')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', credentials.id);

      return new Response(
        JSON.stringify({
          success: true,
          messages_processed: processedMessages.length,
          messages: processedMessages,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (action === 'send_email') {
      const { to, subject, body, threadId } = await req.json();

      const email = [
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `To: ${to}`,
        `Subject: ${subject}`,
        threadId ? `In-Reply-To: ${threadId}` : '',
        threadId ? `References: ${threadId}` : '',
        '',
        body,
      ]
        .filter(Boolean)
        .join('\r\n');

      const encodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: encodedEmail,
          threadId: threadId,
        }),
      });

      if (!sendResponse.ok) {
        const error = await sendResponse.text();
        throw new Error(`Failed to send email: ${error}`);
      }

      const sentMessage = await sendResponse.json();

      return new Response(
        JSON.stringify({
          success: true,
          message_id: sentMessage.id,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    throw new Error('Invalid action');
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
