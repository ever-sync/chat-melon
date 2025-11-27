import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    // Generate password reset link
    const appUrl = Deno.env.get("APP_URL") || "https://your-app-url.com";
    const loginUrl = `${appUrl}/set-password?token=${userId}`;

    const emailResponse = await resend.emails.send({
      from: "ChatHub <onboarding@resend.dev>",
      to: [email],
      subject: "Bem-vindo ao ChatHub! 🎉",
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
              .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .features { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
              .feature { padding: 10px 0; border-bottom: 1px solid #eee; }
              .footer { text-align: center; color: #999; margin-top: 30px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Bem-vindo ao ChatHub!</h1>
                <p>Seu pagamento foi confirmado com sucesso</p>
              </div>
              
              <div class="content">
                <p>Olá,</p>
                
                <p>Estamos muito felizes em ter você conosco! Sua assinatura do ChatHub foi ativada e você já pode começar a transformar seu atendimento.</p>
                
                <p><strong>Para começar, crie sua senha:</strong></p>
                
                <a href="${loginUrl}" class="button">Criar Senha e Acessar</a>
                
                <div class="features">
                  <h3>O que você pode fazer agora:</h3>
                  <div class="feature">✅ Cadastrar suas empresas</div>
                  <div class="feature">✅ Configurar a Evolution API para WhatsApp</div>
                  <div class="feature">✅ Começar a atender seus clientes</div>
                  <div class="feature">✅ Acessar relatórios e analytics</div>
                  <div class="feature">✅ Gerenciar seu time e setores</div>
                </div>
                
                <p>Se você tiver qualquer dúvida, nossa equipe está pronta para ajudar!</p>
                
                <p>Atenciosamente,<br><strong>Equipe ChatHub</strong></p>
              </div>
              
              <div class="footer">
                <p>© 2025 ChatHub. Todos os direitos reservados.</p>
                <p>Este é um email automático, por favor não responda.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});