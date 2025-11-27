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
    const { contact_id, cnpj } = await req.json();

    if (!contact_id && !cnpj) {
      return new Response(
        JSON.stringify({ error: "contact_id or cnpj is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get contact if contact_id provided
    let contact;
    if (contact_id) {
      const { data } = await supabaseClient
        .from("contacts")
        .select("*")
        .eq("id", contact_id)
        .single();
      contact = data;
    }

    const cnpjToSearch = cnpj || contact?.company_cnpj;
    
    if (!cnpjToSearch) {
      return new Response(
        JSON.stringify({ error: "No CNPJ found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean CNPJ (remove non-numeric characters)
    const cleanCnpj = cnpjToSearch.replace(/\D/g, "");

    console.log("Enriching contact with CNPJ:", cleanCnpj);

    // TODO: Integration with N8N webhook or external API
    // For now, we'll create a placeholder response structure
    // In production, you would call:
    // const response = await fetch('YOUR_N8N_WEBHOOK_URL', {
    //   method: 'POST',
    //   body: JSON.stringify({ cnpj: cleanCnpj })
    // });
    // const companyData = await response.json();

    // Placeholder company data structure
    const companyData = {
      cnpj: cleanCnpj,
      razao_social: null,
      nome_fantasia: null,
      cnae_principal: null,
      cnae_descricao: null,
      endereco: null,
      cidade: null,
      uf: null,
      cep: null,
      capital_social: null,
      data_fundacao: null,
      situacao_cadastral: null,
      porte: null,
      // This will be filled by external API
      _status: "pending" // pending, found, not_found
    };

    // Update contact with enrichment data
    if (contact_id) {
      const { error: updateError } = await supabaseClient
        .from("contacts")
        .update({
          company_cnpj: cleanCnpj,
          company_data: companyData,
          enrichment_status: "pending", // Will be "enriched" when real data comes
          enrichment_data: {
            source: "manual",
            requested_at: new Date().toISOString()
          }
        })
        .eq("id", contact_id);

      if (updateError) {
        console.error("Error updating contact:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update contact" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        company_data: companyData,
        message: "Contact enrichment initiated. Integration with external API pending."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in enrich-contact:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
