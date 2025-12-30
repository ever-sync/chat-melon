import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface IngestRequest {
  documentId?: string; // If provided, update existing document
  companyId: string;
  title: string;
  content: string;
  categoryId?: string;
  sourceType?: 'manual' | 'pdf' | 'url' | 'faq_sync';
  sourceUrl?: string;
  metadata?: any;
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
      documentId,
      companyId,
      title,
      content,
      categoryId,
      sourceType = 'manual',
      sourceUrl,
      metadata = {},
    }: IngestRequest = await req.json();

    console.log(`Ingesting document: ${title}`);

    // Get KB config for chunking settings
    const { data: config } = await supabase
      .from("kb_configs")
      .select("*")
      .eq("company_id", companyId)
      .single();

    const chunkSize = config?.chunk_size || 1000;
    const chunkOverlap = config?.chunk_overlap || 200;

    // Get OpenAI API key from ai_settings table
    const { data: aiSettings } = await supabase
      .from("ai_settings")
      .select("openai_api_key")
      .eq("company_id", companyId)
      .single();

    // Fallback to environment variable if not in database
    const openaiApiKey = aiSettings?.openai_api_key || Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "OPENAI_API_KEY não configurada. Vá em Configurações > IA e configure sua chave da OpenAI.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Create or update document
    let docId = documentId;

    if (documentId) {
      // Update existing document
      const { error: updateError } = await supabase
        .from("kb_documents")
        .update({
          title,
          content,
          category_id: categoryId,
          source_type: sourceType,
          source_url: sourceUrl,
          metadata,
          updated_at: new Date().toISOString(),
        })
        .eq("id", documentId);

      if (updateError) throw updateError;

      // Delete old chunks
      await supabase.from("kb_chunks").delete().eq("document_id", documentId);
    } else {
      // Create new document
      const { data: doc, error: insertError } = await supabase
        .from("kb_documents")
        .insert({
          company_id: companyId,
          title,
          content,
          category_id: categoryId,
          source_type: sourceType,
          source_url: sourceUrl,
          metadata,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      docId = doc.id;
    }

    console.log(`Document created/updated: ${docId}`);

    // Chunk the content
    const chunks = chunkText(content, chunkSize, chunkOverlap);
    console.log(`Created ${chunks.length} chunks`);

    // Generate embeddings for each chunk
    const embeddings = await generateEmbeddings(chunks, config?.embedding_provider || 'openai', openaiApiKey);

    // Insert chunks with embeddings
    const chunksToInsert = chunks.map((chunk, index) => ({
      document_id: docId,
      content: chunk,
      embedding: embeddings[index],
      token_count: estimateTokens(chunk),
      position: index,
      metadata: {
        chunk_index: index,
        total_chunks: chunks.length,
      },
    }));

    const { error: chunksError } = await supabase
      .from("kb_chunks")
      .insert(chunksToInsert);

    if (chunksError) throw chunksError;

    console.log(`Inserted ${chunksToInsert.length} chunks with embeddings`);

    return new Response(
      JSON.stringify({
        success: true,
        documentId: docId,
        chunksCreated: chunks.length,
        message: "Document ingested successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Ingestion error:", error);

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

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    let chunk = text.slice(start, end);

    // Try to break at sentence boundary
    if (end < text.length) {
      const lastPeriod = chunk.lastIndexOf('.');
      const lastNewline = chunk.lastIndexOf('\n');
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > chunkSize * 0.5) {
        chunk = chunk.slice(0, breakPoint + 1);
      }
    }

    chunks.push(chunk.trim());
    start += chunkSize - overlap;
  }

  return chunks.filter(chunk => chunk.length >= 10);
}

async function generateEmbeddings(chunks: string[], provider: string = 'openai', apiKey: string): Promise<number[][]> {
  if (provider === 'openai') {
    return await generateOpenAIEmbeddings(chunks, apiKey);
  }
  // Add other providers here (Cohere, HuggingFace)
  throw new Error(`Unsupported embedding provider: ${provider}`);
}

async function generateOpenAIEmbeddings(chunks: string[], apiKey: string): Promise<number[][]> {
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não configurada. Configure na página de IA.");
  }

  // OpenAI allows batching up to 2048 inputs
  const batchSize = 100;
  const embeddings: number[][] = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);

    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: batch,
        model: "text-embedding-ada-002",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    const batchEmbeddings = result.data.map((item: any) => item.embedding);
    embeddings.push(...batchEmbeddings);
  }

  return embeddings;
}

function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}
