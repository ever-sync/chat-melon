import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Levenshtein distance algorithm
function levenshteinDistance(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  const matrix: number[][] = [];
  
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[s2.length][s1.length];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { company_id } = await req.json();

    if (!company_id) {
      return new Response(
        JSON.stringify({ error: "company_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🔍 Detectando duplicados para company_id: ${company_id}`);

    // Buscar todos os contatos ativos da empresa
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select("*")
      .eq("company_id", company_id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (contactsError) {
      console.error("Erro ao buscar contatos:", contactsError);
      throw contactsError;
    }

    console.log(`📊 Encontrados ${contacts?.length || 0} contatos ativos`);

    const duplicates: any[] = [];
    const processed = new Set<string>();

    // Comparar cada par de contatos
    for (let i = 0; i < (contacts?.length || 0); i++) {
      for (let j = i + 1; j < (contacts?.length || 0); j++) {
        const contact1 = contacts![i];
        const contact2 = contacts![j];
        
        const pairKey = [contact1.id, contact2.id].sort().join("-");
        if (processed.has(pairKey)) continue;
        
        const reasons: string[] = [];
        let similarityScore = 0;

        // 1. Mesmo telefone (match exato)
        if (contact1.phone_number && contact2.phone_number) {
          const phone1 = contact1.phone_number.replace(/\D/g, "");
          const phone2 = contact2.phone_number.replace(/\D/g, "");
          
          if (phone1 === phone2) {
            reasons.push("phone");
            similarityScore = 1.0;
          }
        }

        // 2. Mesmo email (se existir)
        if (contact1.email && contact2.email) {
          if (contact1.email.toLowerCase() === contact2.email.toLowerCase()) {
            reasons.push("email");
            similarityScore = Math.max(similarityScore, 1.0);
          }
        }

        // 3. Nome similar (Levenshtein < 3)
        if (contact1.name && contact2.name) {
          const distance = levenshteinDistance(contact1.name, contact2.name);
          const maxLength = Math.max(contact1.name.length, contact2.name.length);
          const nameSimilarity = 1 - (distance / maxLength);
          
          if (distance <= 3 && distance > 0) {
            reasons.push("name");
            similarityScore = Math.max(similarityScore, nameSimilarity);
          }
        }

        // Se encontrou alguma similaridade, adiciona
        if (reasons.length > 0) {
          duplicates.push({
            company_id,
            contact_id_1: contact1.id,
            contact_id_2: contact2.id,
            match_reason: reasons.length > 1 ? "multiple" : reasons[0],
            similarity_score: similarityScore,
            status: "pending",
          });
          
          processed.add(pairKey);
          console.log(`✅ Duplicado encontrado: ${contact1.name} ↔ ${contact2.name} (${reasons.join(", ")})`);
        }
      }
    }

    console.log(`📋 Total de duplicados detectados: ${duplicates.length}`);

    // Inserir duplicados encontrados (apenas novos)
    if (duplicates.length > 0) {
      // Primeiro, buscar duplicados existentes
      const { data: existing } = await supabase
        .from("contact_duplicates")
        .select("contact_id_1, contact_id_2")
        .eq("company_id", company_id)
        .in("status", ["pending", "ignored"]);

      const existingPairs = new Set(
        (existing || []).map(d => [d.contact_id_1, d.contact_id_2].sort().join("-"))
      );

      // Filtrar apenas novos
      const newDuplicates = duplicates.filter(d => {
        const pairKey = [d.contact_id_1, d.contact_id_2].sort().join("-");
        return !existingPairs.has(pairKey);
      });

      if (newDuplicates.length > 0) {
        const { error: insertError } = await supabase
          .from("contact_duplicates")
          .insert(newDuplicates);

        if (insertError) {
          console.error("Erro ao inserir duplicados:", insertError);
          throw insertError;
        }

        console.log(`✨ ${newDuplicates.length} novos duplicados inseridos`);
      } else {
        console.log("ℹ️ Nenhum duplicado novo encontrado");
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_contacts: contacts?.length || 0,
        duplicates_found: duplicates.length,
        message: `Detecção concluída. ${duplicates.length} duplicados encontrados.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Erro:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});