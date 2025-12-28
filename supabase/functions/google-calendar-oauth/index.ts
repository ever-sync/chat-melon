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

    // Handle OAuth callback from Google (GET request with code and state)
    const url = new URL(req.url);
    const callbackCode = url.searchParams.get('code');
    const callbackState = url.searchParams.get('state'); // Format: userId:companyId

    if (req.method === 'GET' && callbackCode && callbackState) {
      const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
      const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
      const REDIRECT_URI = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-calendar-oauth`;

      // Parse state to get userId and companyId
      const [userId, companyId] = callbackState.split(':');

      if (!userId || !companyId) {
        return new Response(
          `<html><body><p>Erro: State inválido (userId ou companyId ausente)</p></body></html>`,
          { headers: { 'Content-Type': 'text/html' } }
        );
      }

      console.log('🔐 OAuth callback received:', { userId, companyId });

      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: callbackCode,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      });

      const tokens = await tokenResponse.json();

      if (tokens.error) {
        return new Response(
          `<html><body><p>Erro: ${tokens.error_description || tokens.error}</p></body></html>`,
          { headers: { 'Content-Type': 'text/html' } }
        );
      }

      // Get user email from Google
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        { headers: { Authorization: `Bearer ${tokens.access_token}` } }
      );
      const userInfo = await userInfoResponse.json();

      console.log('📧 User info from Google:', userInfo);

      const userEmail = userInfo.email || 'connected';

      // 🔥 IMPORTANTE: Salvar na nova tabela google_calendar_tokens (isolado por empresa)
      const { error: upsertError } = await supabase
        .from('google_calendar_tokens')
        .upsert({
          user_id: userId,
          company_id: companyId,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          google_email: userEmail,
          connected_at: new Date().toISOString(),
        }, {
          onConflict: 'company_id,user_id' // Atualiza se já existir
        });

      if (upsertError) {
        console.error('❌ Erro ao salvar token:', upsertError);
        return new Response(
          `<html><body><p>Erro ao salvar conexão: ${upsertError.message}</p></body></html>`,
          { headers: { 'Content-Type': 'text/html' } }
        );
      }

      console.log('✅ Token salvo com sucesso para empresa:', companyId);

      // Return HTML that closes popup and notifies parent window
      return new Response(
        `<html><body>
          <script>
            window.opener && window.opener.postMessage({type: 'oauth-success', email: '${userEmail}'}, '*');
            setTimeout(() => window.close(), 1000);
          </script>
          <p style="text-align: center; margin-top: 50px; font-family: sans-serif;">
            ✅ Conectado com sucesso!<br><br>
            ${userEmail !== 'connected' ? `Email: ${userEmail}<br><br>` : ''}
            Esta janela será fechada automaticamente...
          </p>
        </body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    const { action, code, userId, companyId } = await req.json();

    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
    const REDIRECT_URI = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-calendar-oauth`;

    if (action === 'get_auth_url') {
      // Valida que companyId foi fornecido
      if (!companyId) {
        throw new Error('companyId é obrigatório');
      }

      console.log('📅 Generating auth URL:', { userId, companyId });

      // Gera URL de autorização com userId:companyId no state
      const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
      ].join(' ');

      // 🔥 IMPORTANTE: State agora inclui userId E companyId
      const state = `${userId}:${companyId}`;

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${encodeURIComponent(state)}`;

      return new Response(
        JSON.stringify({ authUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'exchange_code') {
      // Troca o código pelo token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      });

      const tokens = await tokenResponse.json();

      if (tokens.error) {
        throw new Error(tokens.error_description || tokens.error);
      }

      // Busca email do usuário do Google
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        }
      );
      const userInfo = await userInfoResponse.json();

      // Salva tokens no perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          google_calendar_token: {
            access_token: tokens.access_token,
            expires_at: Date.now() + tokens.expires_in * 1000,
          },
          google_calendar_refresh_token: tokens.refresh_token,
          google_calendar_connected: true,
          google_calendar_email: userInfo.email,
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true, email: userInfo.email }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'refresh_token') {
      // Valida que companyId foi fornecido
      if (!companyId) {
        throw new Error('companyId é obrigatório');
      }

      console.log('🔄 Refreshing token:', { userId, companyId });

      // 🔥 IMPORTANTE: Buscar refresh token da nova tabela (isolado por empresa)
      const { data: tokenData } = await supabase
        .from('google_calendar_tokens')
        .select('refresh_token')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .maybeSingle();

      if (!tokenData?.refresh_token) {
        throw new Error('No refresh token found for this user and company');
      }

      // Atualiza o token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          refresh_token: tokenData.refresh_token,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          grant_type: 'refresh_token',
        }),
      });

      const tokens = await tokenResponse.json();

      if (tokens.error) {
        throw new Error(tokens.error_description || tokens.error);
      }

      // 🔥 IMPORTANTE: Atualizar access token na nova tabela
      await supabase
        .from('google_calendar_tokens')
        .update({
          access_token: tokens.access_token,
          token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          last_sync_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('company_id', companyId);

      console.log('✅ Token refreshed successfully');

      return new Response(
        JSON.stringify({ access_token: tokens.access_token }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'disconnect') {
      // Valida que companyId foi fornecido
      if (!companyId) {
        throw new Error('companyId é obrigatório');
      }

      console.log('🔌 Disconnecting Google Calendar:', { userId, companyId });

      // 🔥 IMPORTANTE: Deletar da tabela google_calendar_tokens (isolado por empresa)
      const { error: deleteError } = await supabase
        .from('google_calendar_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('company_id', companyId);

      if (deleteError) {
        console.error('❌ Erro ao desconectar:', deleteError);
        throw deleteError;
      }

      console.log('✅ Google Calendar desconectado com sucesso');

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Google Calendar OAuth error:', error);
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