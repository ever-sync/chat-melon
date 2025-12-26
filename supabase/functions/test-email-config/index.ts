import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
});

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    // Verificar variáveis de ambiente
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const appUrl = Deno.env.get("APP_URL");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const config = {
      RESEND_API_KEY: resendKey ? {
        configured: true,
        starts_with: resendKey.substring(0, 5) + "...",
        length: resendKey.length
      } : {
        configured: false
      },
      APP_URL: appUrl || "NÃO CONFIGURADO",
      SUPABASE_URL: supabaseUrl ? "CONFIGURADO" : "NÃO CONFIGURADO",
      SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey ? "CONFIGURADO" : "NÃO CONFIGURADO",
    };

    console.log("Configuração das variáveis:", config);

    return new Response(JSON.stringify({
      success: true,
      message: "Teste de configuração",
      config
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Erro:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
