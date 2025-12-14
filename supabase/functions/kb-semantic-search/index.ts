import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { createHash } from "https://deno.land/std@0.168.0/hash/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SearchRequest {
  query: string;
  companyId: string;
  conversationId?: string;
  topK?: number;
  similarityThreshold?: number;
  useCache?: boolean;
}

interface SearchResult {
  chunkId: string;
  documentId: string;
  content: string;
  similarity: number;
  metadata: any;
  documentTitle: string;
  documentSource: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const {
      query,
      companyId,
      conversationId,
      topK,
      similarityThreshold,
      useCache = true,
    }: SearchRequest = await req.json();

    console.log(`Searching KB for: "${query}"`);

    // Get KB config
    const { data: config } = await supabase
      .from("kb_configs")
      .select("*")
      .eq("company_id", companyId)
      .single();

    if (!config?.is_enabled) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Knowledge Base is not enabled for this company",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const k = topK || config.top_k || 5;
    const threshold = similarityThreshold || config.similarity_threshold || 0.7;

    // Check cache first
    if (useCache && config.use_cache) {
      const queryHash = generateQueryHash(query, companyId);
      const cachedResult = await checkCache(supabase, queryHash);

      if (cachedResult) {
        console.log("Cache hit!");

        // Increment hit count
        await supabase
          .from("kb_answer_cache")
          .update({ hit_count: cachedResult.hit_count + 1 })
          .eq("id", cachedResult.id);

        return new Response(
          JSON.stringify({
            success: true,
            results: [],
            cached: true,
            answer: cachedResult.answer,
            confidence: cachedResult.confidence_score,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
    }

    // Generate embedding for the query
    const queryEmbedding = await generateQueryEmbedding(
      query,
      config.embedding_provider || 'openai'
    );

    // Perform semantic search using the database function
    const { data: results, error: searchError } = await supabase.rpc(
      "search_kb_chunks",
      {
        query_embedding: queryEmbedding,
        match_count: k,
        filter_company_id: companyId,
        similarity_threshold: threshold,
      }
    );

    if (searchError) throw searchError;

    console.log(`Found ${results?.length || 0} relevant chunks`);

    // Log the query
    await supabase.from("kb_queries").insert({
      company_id: companyId,
      query,
      conversation_id: conversationId,
      results: results,
    });

    return new Response(
      JSON.stringify({
        success: true,
        results: results || [],
        cached: false,
        count: results?.length || 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Search error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

async function generateQueryEmbedding(query: string, provider: string): Promise<number[]> {
  if (provider === 'openai') {
    return await generateOpenAIEmbedding(query);
  }
  throw new Error(`Unsupported embedding provider: ${provider}`);
}

async function generateOpenAIEmbedding(text: string): Promise<number[]> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      input: text,
      model: "text-embedding-ada-002",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const result = await response.json();
  return result.data[0].embedding;
}

function generateQueryHash(query: string, companyId: string): string {
  const normalized = query.toLowerCase().trim();
  const hash = createHash("md5");
  hash.update(`${companyId}:${normalized}`);
  return hash.toString();
}

async function checkCache(supabase: any, queryHash: string) {
  const { data, error } = await supabase
    .from("kb_answer_cache")
    .select("*")
    .eq("query_hash", queryHash)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !data) return null;
  return data;
}
