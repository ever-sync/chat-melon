
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

        const { conversationId, content, messageType = 'text' } = await req.json();

        console.log('📨 Recebido pedido para enviar mensagem:', { conversationId, content, messageType });

        // Buscar dados da conversa e empresa
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .select('contact_number, company_id, companies!inner(evolution_instance_name)')
            .eq('id', conversationId)
            .single();

        console.log('🔍 Resultado da busca da conversa:', { conversation, convError });

        if (convError || !conversation) {
            console.error('❌ Conversa não encontrada:', convError);
            throw new Error('Conversa não encontrada');
        }

        const instanceName = (conversation.companies as any)?.evolution_instance_name;
        console.log('🏢 Nome da instância:', instanceName);

        if (!instanceName) {
            console.error('❌ Instância Evolution não configurada');
            throw new Error('Instância Evolution não configurada para esta empresa');
        }

        const phone = conversation.contact_number;

        // Enviar mensagem via Evolution API
        const response = await fetch(`${evolutionApiUrl}/message/sendText/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': evolutionApiKey,
            },
            body: JSON.stringify({
                number: phone,
                text: content,
            }),
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
            JSON.stringify({ success: false, error: error.message }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});
