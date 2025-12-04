
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

        // Buscar dados da conversa
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .select('contact_number, company_id')
            .eq('id', conversationId)
            .single();

        console.log('🔍 Resultado da busca da conversa:', { conversation, convError });

        if (convError || !conversation) {
            console.error('❌ Conversa não encontrada:', convError);
            throw new Error('Conversa não encontrada');
        }

        // Buscar nome da instância na tabela evolution_settings
        const { data: settings } = await supabase
            .from('evolution_settings')
            .select('instance_name')
            .eq('company_id', conversation.company_id)
            .single();

        const instanceName = settings?.instance_name;
        console.log('🏢 Nome da instância (evolution_settings):', instanceName);

        if (!instanceName) {
            console.error('❌ Instância Evolution não configurada');
            throw new Error('Instância Evolution não configurada para esta empresa');
        }

        const phone = conversation.contact_number;
        let endpoint = '/message/sendText/';
        let body: any = { number: phone };

        switch (messageType) {
            case 'text':
                endpoint = '/message/sendText/';
                body.text = content;
                break;
            case 'media':
                endpoint = '/message/sendMedia/';
                body.mediatype = fileType; // image, video, document
                body.media = media; // base64
                body.caption = caption;
                body.fileName = content; // Usando content como nome do arquivo se disponível
                break;
            case 'audio':
                endpoint = '/message/sendWhatsAppAudio/';
                body.audio = audio; // base64
                break;
            default:
                throw new Error(`Tipo de mensagem não suportado: ${messageType}`);
        }

        // Enviar mensagem via Evolution API
        const response = await fetch(`${evolutionApiUrl}${endpoint}${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': evolutionApiKey,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Evolution API error: ${errorText}`);
        }

        const result = await response.json();

        return new Response(
            JSON.stringify({ success: true, data: result }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        return new Response(
            JSON.stringify({ success: false, error: (error as Error).message }),
            {
                status: 200, // Return 200 so the client can parse the error message
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});
