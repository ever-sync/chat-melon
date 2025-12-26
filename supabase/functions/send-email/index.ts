import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("Não autenticado");
    }

    const { 
      to_email, 
      subject, 
      body, 
      contact_id, 
      deal_id, 
      template_id,
      company_id 
    } = await req.json();

    console.log("Enviando email para:", to_email);

    // Buscar configuração de email da empresa (se houver)
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    const fromEmail = profile?.email || "noreply@resend.dev";
    const fromName = profile?.full_name || "CRM System";

    // Adicionar pixel de tracking no final do HTML
    const trackingPixelId = crypto.randomUUID();
    const bodyWithTracking = body + `<img src="${Deno.env.get("SUPABASE_URL")}/functions/v1/track-email-open?id=${trackingPixelId}" width="1" height="1" style="display:none" />`;

    // Enviar email via Resend
    const emailResponse = await resend.emails.send({
      from: `${fromName} <noreply@eversync.space>`,
      to: [to_email],
      subject: subject,
      html: bodyWithTracking,
    });

    console.log("Email enviado com sucesso:", emailResponse);

    // Registrar no log
    const { error: logError } = await supabaseClient
      .from("email_logs")
      .insert({
        company_id,
        contact_id,
        deal_id,
        template_id,
        subject,
        body,
        to_email,
        status: "sent",
        metadata: {
          resend_response: emailResponse,
          tracking_pixel_id: trackingPixelId,
        },
      });

    if (logError) {
      console.error("Erro ao criar log de email:", logError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      email_response: emailResponse 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erro ao enviar email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});