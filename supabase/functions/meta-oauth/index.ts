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

        const FB_APP_ID = Deno.env.get('FACEBOOK_APP_ID')!;
        const FB_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET')!;
        const REDIRECT_URI = `${Deno.env.get('SUPABASE_URL')}/functions/v1/meta-oauth`;

        // Handle OAuth callback (GET request)
        const url = new URL(req.url);
        const callbackCode = url.searchParams.get('code');
        const callbackState = url.searchParams.get('state'); // company_id
        const error = url.searchParams.get('error');
        const errorReason = url.searchParams.get('error_reason');
        const errorDescription = url.searchParams.get('error_description');

        if (req.method === 'GET') {
            if (error || errorReason) {
                console.error("Facebook OAuth Error:", error, errorReason, errorDescription);
                return new Response(
                    `<html><body>
                       <h1>Erro de Conexão</h1>
                       <p>O Facebook retornou um erro: ${errorDescription || errorReason || error}</p>
                       <p>Feche esta janela e tente novamente.</p>
                    </body></html>`,
                    { headers: { 'Content-Type': 'text/html' } }
                );
            }

            if (callbackCode && callbackState) {
                // 1. Exchange code for User Token
                const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` +
                    `client_id=${FB_APP_ID}&` +
                    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
                    `client_secret=${FB_APP_SECRET}&` +
                    `code=${callbackCode}`;

                const tokenRes = await fetch(tokenUrl);
                const tokenData = await tokenRes.json();

                if (tokenData.error) {
                    console.error("❌ Token Exchange Error:", JSON.stringify(tokenData.error));
                    return new Response(`Error exchanging token: ${JSON.stringify(tokenData.error)}`, { headers: { 'Content-Type': 'text/html' } });
                }

                console.log("✅ User Access Token received");
                const userAccessToken = tokenData.access_token;

                // 2. Fetch Pages and Insta Accounts
                const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${userAccessToken}&fields=id,name,access_token,instagram_business_account{id,username,profile_picture_url},picture{url}`;
                const pagesRes = await fetch(pagesUrl);
                const pagesData = await pagesRes.json();

                console.log("📄 Pages fetch response:", JSON.stringify(pagesData));

                let connectedCount = 0;
                let message = "";

                if (pagesData.data && pagesData.data.length > 0) {
                    for (const page of pagesData.data) {
                        console.log(`Processing page: ${page.name} (${page.id})`);
                        
                        // 3a. Add Messenger Channel (Page)
                        const pageAccessToken = page.access_token;

                        // Connect Messenger
                        await supabase.from('channels').upsert({
                            company_id: callbackState,
                            type: 'messenger',
                            name: page.name,
                            external_id: page.id,
                            credentials: {
                                page_access_token: pageAccessToken,
                                page_id: page.id,
                                user_access_token: userAccessToken
                            },
                            status: 'connected',
                            created_at: new Date().toISOString()
                        }, { onConflict: 'company_id,type,external_id' });
                        
                        connectedCount++;
                        console.log(`✅ Messenger connected: ${page.name}`);

                        // Subscribe App to Page Webhooks
                        try {
                            const subRes = await fetch(`https://graph.facebook.com/v18.0/${page.id}/subscribed_apps?subscribed_fields=messages,messaging_postbacks,message_reads&access_token=${pageAccessToken}`, { method: 'POST' });
                            const subData = await subRes.json();
                            console.log(`Webhook subscription for ${page.name}:`, subData);
                        } catch (e) {
                            console.error(`Failed to subscribe webhook for ${page.name}:`, e);
                        }

                        // 3b. Add Instagram Channel (if linked)
                        if (page.instagram_business_account) {
                            const insta = page.instagram_business_account;
                            console.log(`📸 Found Instagram: ${insta.username} (${insta.id})`);

                            const instaCredentials = {
                                page_access_token: pageAccessToken,
                                page_id: page.id,
                                instagram_account_id: insta.id
                            };
                            console.log("🔒 Credentials to save:", JSON.stringify(instaCredentials));

                            if (!pageAccessToken || !insta.id) {
                                console.error("❌ CRITICAL: Missing token or ID for Instagram connection");
                                message = "❌ ERRO CRÍTICO: O Facebook não retornou o Token da Página ou ID do Instagram. Verifique as permissões 'Gerenciar Páginas' e 'Acessar Conversas'.";
                            } else {
                                const { error: upsertError } = await supabase.from('channels').upsert({
                                    company_id: callbackState,
                                    type: 'instagram',
                                    name: insta.username || `Instagram - ${page.name}`,
                                    external_id: insta.id,
                                    credentials: instaCredentials,
                                    status: 'connected',
                                    created_at: new Date().toISOString()
                                }, { onConflict: 'company_id,type,external_id' });

                                if (upsertError) {
                                    console.error("❌ Stats Upsert Error:", upsertError);
                                    message = "❌ Erro ao salvar no banco de dados: " + upsertError.message;
                                } else {
                                    connectedCount++;
                                }
                            }
                        } else {
                            console.log(`⚠️ No Instagram account linked to page ${page.name}`);
                        }
                    }
                    message = `✅ Conectado com sucesso! (${connectedCount} canais adicionados)`;
                } else {
                    console.warn("⚠️ No pages found for user");
                    message = "⚠️ Nenhuma página encontrada nesta conta do Facebook. Crie uma página ou verifique suas permissões.";
                }

                const htmlResponse = `
                  <html>
                    <head>
                      <meta charset="utf-8">
                      <title>Conectado!</title>
                    <style>
                        body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; }
                        .success { color: blue; font-size: 24px; margin-bottom: 20px; font-weight: bold; }
                        button { padding: 10px 20px; font-size: 16px; cursor: pointer; }
                      </style>
                    </head>
                    <body>
                      <div class="success">${message} (v2)</div>
                      <p>Você pode fechar esta janela agora.</p>
                      <button onclick="window.close()">Fechar Janela</button>
                      <script>
                        try {
                          if (window.opener) {
                            window.opener.postMessage({type: 'oauth-success', provider: 'meta'}, '*');
                          }
                        } catch (e) { console.error(e); }
                        
                        // Tentar fechar automaticamente
                        setTimeout(() => window.close(), 2000);
                      </script>
                    </body>
                  </html>
                `;

                return new Response(htmlResponse, {
                    headers: {
                        'Content-Type': 'text/html',
                        'Content-Security-Policy': "default-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'",
                    }
                });
            }

            // If GET but no code/error, it's invalid
            return new Response("Invalid request parameters", { status: 400 });
        }

        // POST: JSON API for getting Auth URL
        if (req.method === 'POST') {
            const { action, companyId } = await req.json();

            if (action === 'get_auth_url') {
                const scopes = [
                    'pages_show_list',
                    'pages_read_engagement',
                    'pages_manage_metadata',
                    'pages_messaging',
                    'instagram_basic',
                    'instagram_manage_messages'
                ].join(',');

                const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
                    `client_id=${FB_APP_ID}&` +
                    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
                    `state=${companyId}&` +
                    `scope=${scopes}&` +
                    `response_type=code`;

                return new Response(
                    JSON.stringify({ authUrl }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
        }

        throw new Error('Method not allowed or Invalid action');

    } catch (error) {
        console.error('Meta OAuth error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});
