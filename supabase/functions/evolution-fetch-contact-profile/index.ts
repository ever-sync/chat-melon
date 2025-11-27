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

    const { contactId, phone, companyId } = await req.json();

    if (!phone || !companyId) {
      throw new Error("phone and companyId são obrigatórios");
    }

    // Usar segredos globais
    const apiUrl = Deno.env.get('EVOLUTION_API_URL');
    const apiKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!apiUrl || !apiKey) {
      throw new Error('Evolution API não configurada no backend');
    }

    // Buscar configurações
    const { data: settings } = await supabaseClient
      .from("evolution_settings")
      .select("*")
      .eq("company_id", companyId)
      .maybeSingle();

    if (!settings || !settings.is_connected) {
      throw new Error("Instância não conectada");
    }

    const cleanPhone = phone.replace(/\D/g, "");

    // Buscar foto de perfil
    const response = await fetch(
      `${apiUrl}/chat/fetchProfilePictureUrl/${settings.instance_name}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": apiKey,
        },
        body: JSON.stringify({ number: cleanPhone }),
      }
    );

    if (!response.ok) {
      console.log("Foto de perfil não disponível");
      return new Response(JSON.stringify({ profilePictureUrl: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const profilePictureUrl = result.profilePictureUrl || null;

    // Atualizar contato com a foto
    if (contactId && profilePictureUrl) {
      await supabaseClient
        .from("contacts")
        .update({ 
          profile_pic_url: profilePictureUrl,
          profile_pic_updated_at: new Date().toISOString()
        })
        .eq("id", contactId);
    }

    return new Response(JSON.stringify({ profilePictureUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: errorMessage, profilePictureUrl: null }), {
      status: 200, // Retorna 200 mesmo com erro para não quebrar UI
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});