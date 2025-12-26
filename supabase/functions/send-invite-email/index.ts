import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
});

interface InviteRequest {
  invite_id: string;
  email: string;
  role: string;
  company_name: string;
  invited_by_name?: string;
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    console.log("Authorization Header Present:", !!authHeader);

    if (!authHeader) {
      console.error("Missing Authorization header");
      return new Response(JSON.stringify({
        error: "Missing Authorization header",
        suggestion: "Verify if the client is authenticated before calling this function."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Initialize Supabase client with ANON key for user validation
    // Using Service Role Key here can cause issues with getUser() when validating a user token
    /* 
    Removed initial client creation to avoid duplicate variable error.
    We are decoding JWT manually now.
    */

    // Instead of auth.getUser() which is failing, we will decode the JWT manually
    // We will rely on Supabase Gateway to verify the JWT signature (deploy without --no-verify-jwt)
    const token = authHeader.replace(/^Bearer\s+/i, "");
    let userId = "";

    try {
      const [, payload] = token.split(".");
      if (payload) {
        // Fix base64 padding if needed
        const paddedPayload = payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, '=');
        const decodedPayload = atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'));
        const jwtData = JSON.parse(decodedPayload);
        userId = jwtData.sub;
        console.log("User ID extracted from token:", userId);
      }
    } catch (e) {
      console.error("Error decoding JWT:", e);
    }

    if (!userId) {
      console.error("Could not extract user ID from token");
      // Validar se conseguimos pegar o ID
      return new Response(JSON.stringify({
        error: "Token inválido ou malformado",
        details: "Could not extract user ID from JWT"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Initialize Supabase client (Service Role) specifically for database operations if needed like logging
    // But for sending email we use Resend directly
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        }
      }
    );
    const { invite_id, email, role, company_name, invited_by_name }: InviteRequest = await req.json();

    if (!invite_id || !email) {
      return new Response(JSON.stringify({ error: "Dados incompletos" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const appUrl = Deno.env.get("APP_URL") || "http://localhost:5173"; // Fallback para local se não configurado
    const inviteLink = `${appUrl}/signup?invite=${invite_id}`;

    console.log(`Enviando convite para ${email} (Invite ID: ${invite_id})`);

    const emailResponse = await resend.emails.send({
      from: "EverSync <noreply@eversync.space>",
      to: [email],
      subject: `Você foi convidado para participar da ${company_name} no ChatHub`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
              .footer { text-align: center; color: #999; margin-top: 30px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Convite para Colaborar</h1>
              </div>
              
              <div class="content">
                <p>Olá,</p>
                
                <p><strong>${invited_by_name || 'Um administrador'}</strong> convidou você para fazer parte da equipe <strong>${company_name}</strong> no ChatHub.</p>
                
                <p>Você terá acesso como: <strong>${role}</strong></p>
                
                <p>Para aceitar o convite e criar sua conta, clique no botão abaixo:</p>
                
                <div style="text-align: center;">
                  <a href="${inviteLink}" class="button">Aceitar Convite</a>
                </div>
                
                <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
                <p style="font-size: 12px; color: #666;">${inviteLink}</p>
                
                <p>Este convite expira em 7 dias.</p>
              </div>
              
              <div class="footer">
                <p>© 2025 ChatHub. Todos os direitos reservados.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email enviado:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Erro ao enviar convite:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
