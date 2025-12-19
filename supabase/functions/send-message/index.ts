
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL')!;
        const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY')!;

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { conversationId, content, messageType = 'text', media, mediaType: fileType, caption, audio } = await req.json();

        console.log('📨 Recebido pedido para enviar mensagem:', { conversationId, messageType });

        // Buscar dados da conversa com informações do canal
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .select('contact_number, company_id, channel_id, channel_type')
            .eq('id', conversationId)
            .single();

        console.log('🔍 Resultado da busca da conversa:', { conversation, convError });

        if (convError || !conversation) {
            console.error('❌ Conversa não encontrada:', convError);
            throw new Error('Conversa não encontrada');
        }

        const { channel_type, contact_number: recipientId } = conversation;

        // ==========================================
        // ROUTING LOGIC
        // ==========================================

        // 1. WhatsApp (via Evolution API)
        if (!channel_type || channel_type === 'whatsapp') {
            // Buscar dados da instância (compatibilidade com tabela antiga evolution_settings ou nova channels)
            let instanceName;
            let evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY')!; // Default env key

            // Tenta buscar no channels primeiro (novo modelo)
            if (conversation.channel_id) {
                const { data: channel } = await supabase
                    .from('channels')
                    .select('credentials')
                    .eq('id', conversation.channel_id)
                    .single();
                if (channel?.credentials?.instance_name) {
                    instanceName = channel.credentials.instance_name;
                    // Se tiver api_key especifica no canal, use-a
                    if (channel.credentials.api_key) evolutionApiKey = channel.credentials.api_key;
                }
            }

            // Fallback para evolution_settings (modelo antigo)
            if (!instanceName) {
                const { data: settings } = await supabase
                    .from('evolution_settings')
                    .select('instance_name')
                    .eq('company_id', conversation.company_id)
                    .single();
                instanceName = settings?.instance_name;
            }

            if (!instanceName) {
                throw new Error('Instância WhatsApp não configurada');
            }

            let endpoint = '/message/sendText/';
            const body: any = { number: recipientId };

            switch (messageType) {
                case 'text':
                    endpoint = '/message/sendText/';
                    body.text = content;
                    break;
                case 'media':
                    endpoint = '/message/sendMedia/';
                    body.mediatype = fileType;
                    body.media = media;
                    body.caption = caption;
                    body.fileName = content;
                    break;
                case 'audio':
                    endpoint = '/message/sendWhatsAppAudio/';
                    // Evolution API espera o base64 com o prefixo data:audio/ogg;base64,
                    body.audio = audio.startsWith('data:') ? audio : `data:audio/ogg;base64,${audio}`;
                    break;
                default:
                    throw new Error(`Tipo de mensagem não suportado para WhatsApp`);
            }

            const response = await fetch(`${Deno.env.get('EVOLUTION_API_URL')!}${endpoint}${instanceName}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': evolutionApiKey },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Evolution API error: ${errorText}`);
            }
            return new Response(JSON.stringify({ success: true, data: await response.json() }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 2. Meta (Instagram / Messenger)
        if (channel_type === 'instagram' || channel_type === 'messenger') {
            if (!content && messageType === 'text') throw new Error('Conteúdo da mensagem vazio');

            // Buscar credenciais do canal
            const { data: channel } = await supabase
                .from('channels')
                .select('credentials')
                .eq('id', conversation.channel_id)
                .single();

            if (!channel?.credentials?.page_access_token) {
                throw new Error(`Credenciais do canal ${channel_type} não encontradas`);
            }

            const accessToken = channel.credentials.page_access_token;
            const graphUrl = `https://graph.facebook.com/v18.0/me/messages?access_token=${accessToken}`;

            const body: any = {
                recipient: { id: recipientId },
                messaging_type: 'RESPONSE'
            };

            if (messageType === 'text') {
                body.message = { text: content };
            } else if (messageType === 'media' && media) {
                // Upload media logic is complex for Meta (requires attachment_id or URL). 
                // Assuming URL is passed in 'media' if it's not base64, or simplified attachment flow.
                // For now, text only support or simplified URL attachment.
                if (media.startsWith('http')) {
                    // It's a URL
                    const type = fileType === 'image' ? 'image' : 'file';
                    body.message = {
                        attachment: {
                            type: type,
                            payload: { url: media, is_reusable: true }
                        }
                    };
                } else {
                    throw new Error('Envio de mídia BLOB/Base64 para Meta não implementado neste endpoint (use URL)');
                }
            }

            const response = await fetch(graphUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const result = await response.json();
            if (result.error) {
                throw new Error(`Meta API Error: ${result.error.message}`);
            }

            return new Response(JSON.stringify({ success: true, data: result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        throw new Error(`Canal não suportado: ${channel_type}`);

    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        return new Response(
            JSON.stringify({ success: false, error: (error as Error).message }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});
