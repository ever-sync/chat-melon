import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { companyId, action, settings: newSettings } = await req.json();

    // Usar segredos globais
    const apiUrl = Deno.env.get('EVOLUTION_API_URL');
    const apiKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!apiUrl || !apiKey) {
      throw new Error('Evolution API não configurada no backend');
    }

    // Buscar configurações da instância
    const { data: evolutionSettings } = await supabaseClient
      .from("evolution_settings")
      .select("*")
      .eq("company_id", companyId)
      .single();

    if (!evolutionSettings || !evolutionSettings.is_connected) {
      throw new Error("Instância não conectrada");
    }

    if (action === "get") {
      // Buscar configurações atuais
      const response = await fetch(
        `${apiUrl}/settings/find/${evolutionSettings.instance_name}`,
        {
          method: "GET",
          headers: {
            "apikey": apiKey,
          },
        }
      );

      const currentSettings = await response.json();
      return new Response(JSON.stringify(currentSettings), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "set") {
      // Atualizar configurações
      const response = await fetch(
        `${apiUrl}/settings/set/${evolutionSettings.instance_name}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": apiKey,
          },
          body: JSON.stringify(newSettings),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro ao salvar: ${error}`);
      }

      const result = await response.json();

      // Salvar no banco local também
      await supabaseClient
        .from("evolution_settings")
        .update({
          instance_settings: newSettings,
          updated_at: new Date().toISOString()
        })
        .eq("company_id", companyId);

      return new Response(JSON.stringify({ success: true, settings: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Ação inválida");

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
