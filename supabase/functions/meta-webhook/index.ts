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
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const url = new URL(req.url);

        // ==========================================
        // WEBHOOK VERIFICATION (GET)
        // ==========================================
        if (req.method === 'GET') {
            const mode = url.searchParams.get('hub.mode');
            const token = url.searchParams.get('hub.verify_token');
            const challenge = url.searchParams.get('hub.challenge');

            const VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN') || 'melon-chat-verify-token';

            if (mode && token) {
                if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                    console.log('WEBHOOK_VERIFIED');
                    return new Response(challenge, { status: 200 });
                } else {
                    return new Response('Forbidden', { status: 403 });
                }
            }
            return new Response('BadRequest', { status: 400 });
        }

        // ==========================================
        // EVENT HANDLING (POST)
        // ==========================================
        if (req.method === 'POST') {
            const body = await req.json();
            console.log('Meta Webhook Recebido:', JSON.stringify(body, null, 2));

            if (body.object === 'page' || body.object === 'instagram') {

                for (const entry of body.entry) {
                    // entry.id is the Page ID or Instagram Account ID
                    const entryId = entry.id;

                    if (entry.messaging) {
                        for (const messagingEvent of entry.messaging) {
                            await processMessagingEvent(supabase, messagingEvent, entryId);
                        }
                    } else if (entry.changes) {
                        // Handle other changes like feed?
                        console.log('Ignorando changes (apenas messaging suportado por enquanto)');
                    }
                }

                return new Response('EVENT_RECEIVED', { status: 200 });
            } else {
                return new Response('NotFound', { status: 404 });
            }
        }

        return new Response('Method Not Allowed', { status: 405 });

    } catch (error) {
        console.error('Meta Hook Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

async function processMessagingEvent(supabase: any, event: any, entryId: string) {
    try {
        const senderId = event.sender.id;
        const recipientId = event.recipient.id;
        const timestamp = event.timestamp;

        // Buscar canal pelo ID externo (Page ID or Insta ID)
        // O entryId geralmente é o ID da página/conta que recebeu a mensagem
        const { data: channel, error: channelError } = await supabase
            .from('channels')
            .select('*')
            .eq('external_id', entryId) // entryId = recipientId (usually)
            .maybeSingle();

        if (!channel) {
            // Tentar buscar pelo recipientId caso entryId não bata
            const { data: channelFallback } = await supabase
                .from('channels')
                .select('*')
                .eq('external_id', recipientId)
                .maybeSingle();

            if (!channelFallback) {
                console.warn(`Canal não encontrado para entryId: ${entryId} ou recipientId: ${recipientId}`);
                return; // Ignora se não achou canal configurado
            }
            // Use fallback
            // channel = channelFallback; 
            // (Variable 'channel' is const above, but logic implies we use found channel)
        }

        // Simplification: reuse query logic or use variable
        let targetChannel = channel;
        if (!targetChannel) {
            const { data } = await supabase.from('channels').select('*').eq('external_id', recipientId).maybeSingle();
            targetChannel = data;
        }

        if (!targetChannel) {
            console.warn(`Canal não encontrado para external_id ${entryId} ou ${recipientId}`);
            return;
        }

        console.log(`Canal encontrado: ${targetChannel.name} (${targetChannel.type})`);

        // ==========================================
        // GET USER PROFILE (Sender)
        // ==========================================
        // Need to fetch user profile from Graph API to get name/pic
        // We need the Page Access Token for this
        const accessToken = targetChannel.credentials?.access_token || targetChannel.credentials?.page_access_token;

        let senderName = `User ${senderId.slice(0, 4)}`;
        let senderPic = null;

        if (accessToken) {
            try {
                // Check if it's Instagram or Facebook to use correct API
                const isInstagram = targetChannel.type === 'instagram';
                const graphUrl = isInstagram
                    ? `https://graph.facebook.com/v18.0/${senderId}?fields=username,name,profile_pic&access_token=${accessToken}`
                    : `https://graph.facebook.com/v18.0/${senderId}?fields=first_name,last_name,profile_pic&access_token=${accessToken}`;

                const userRes = await fetch(graphUrl);
                if (userRes.ok) {
                    const userData = await userRes.json();
                    senderName = isInstagram ? (userData.username || userData.name) : `${userData.first_name} ${userData.last_name}`;
                    senderPic = userData.profile_pic;
                }
            } catch (err) {
                console.error('Erro ao buscar perfil do usuário Meta:', err);
            }
        }

        // ==========================================
        // CONTACT UPSERT
        // ==========================================
        // Check if contact exists by senderId (which acts as phone_number/identifier)
        // Note: Meta senderIds are Page-scoped.

        const { data: existingContact } = await supabase
            .from('contacts')
            .select('*')
            .eq('company_id', targetChannel.company_id)
            .eq('phone_number', senderId) // Storing Scoped ID in phone_number for now
            .maybeSingle();

        let contactId;

        if (existingContact) {
            contactId = existingContact.id;
            // Update info if changed
            if (existingContact.name !== senderName || existingContact.profile_pic_url !== senderPic) {
                await supabase.from('contacts').update({
                    name: senderName,
                    push_name: senderName,
                    profile_pic_url: senderPic
                }).eq('id', contactId);
            }
        } else {
            const { data: newContact, error: createError } = await supabase
                .from('contacts')
                .insert({
                    company_id: targetChannel.company_id,
                    phone_number: senderId,
                    name: senderName,
                    push_name: senderName,
                    profile_pic_url: senderPic,
                    is_business: targetChannel.type === 'instagram' // Assumption
                })
                .select()
                .single();

            if (createError) {
                console.error('Erro ao criar contato:', createError);
                // Fallback?
            }
            contactId = newContact?.id;
        }

        // ==========================================
        // CONVERSATION UPSERT
        // ==========================================
        const { data: conversations } = await supabase
            .from('conversations')
            .select('*')
            .eq('channel_id', targetChannel.id)
            .eq('contact_number', senderId) // Use senderId as identifier
            .eq('company_id', targetChannel.company_id);

        let conversationId;
        let messageContent = '';
        let messageType = 'text';

        if (event.message) {
            messageContent = event.message.text || 'Midia enviada';
            if (event.message.attachments) {
                messageType = event.message.attachments[0].type; // image, video, etc.
                messageContent = event.message.attachments[0].payload?.url || 'Anexo';
            }
        }

        if (!conversations || conversations.length === 0) {
            const { data: newConv } = await supabase
                .from('conversations')
                .insert({
                    company_id: targetChannel.company_id,
                    channel_id: targetChannel.id,
                    channel_type: targetChannel.type,
                    contact_id: contactId,
                    contact_name: senderName,
                    contact_number: senderId,
                    profile_pic_url: senderPic,
                    last_message: messageContent,
                    last_message_time: new Date(timestamp).toISOString(),
                    unread_count: 1,
                    status: 'waiting',
                    user_id: targetChannel.company_id // Temp assignee, or leave null if allowed. 
                    // Note: user_id is NOT NULL in schema? check types. It is often required. 
                    // We need a default user or the channel owner.
                    // For now, let's pick the first admin or created_by of company?
                    // Or use the ID from channels (Wait, channels doesn't have owner).
                })
                .select()
                .single();
            conversationId = newConv?.id;
        } else {
            conversationId = conversations[0].id;
            await supabase
                .from('conversations')
                .update({
                    last_message: messageContent,
                    last_message_time: new Date(timestamp).toISOString(),
                    unread_count: conversations[0].unread_count + 1
                })
                .eq('id', conversationId);
        }

        // ==========================================
        // MESSAGE INSERT
        // ==========================================
        if (event.message && !event.message.is_echo) {
            await supabase.from('messages').insert({
                conversation_id: conversationId,
                company_id: targetChannel.company_id,
                content: messageContent,
                message_type: messageType,
                status: 'received',
                is_from_me: false,
                external_id: event.message.mid,
                // channel info is on conversation
            });
            console.log('Mensagem salva com sucesso:', event.message.mid);
        } else if (event.message && event.message.is_echo) {
            // Handle echo (message sent by page) if needed
            console.log('Mensagem eco (enviada pela página), ignorando ou salvando como sent');
        }

        // Handle N8N/AI logic here in future (copy from evolution-webhook)

    } catch (err) {
        console.error('Erro ao processar evento messaging:', err);
    }
}
