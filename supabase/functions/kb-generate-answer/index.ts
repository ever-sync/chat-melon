import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { createHash } from "https://deno.land/std@0.168.0/hash/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface GenerateAnswerRequest {
  query: string;
  companyId: string;
  conversationId?: string;
  context?: string; // Additional context from conversation
  aiProvider?: 'openai' | 'groq' | 'anthropic';
  model?: string;
  useCache?: boolean;
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
      context = '',
      aiProvider = 'openai',
      model,
      useCache = true,
    }: GenerateAnswerRequest = await req.json();

    console.log(`Generating answer for: "${query}"`);

    // Get KB config
    const { data: config } = await supabase
      .from("kb_configs")
      .select("*")
      .eq("company_id", companyId)
      .single();

    // Check cache first
    if (useCache && config?.use_cache) {
      const queryHash = generateQueryHash(query, companyId);
      const { data: cached } = await supabase
        .from("kb_answer_cache")
        .select("*")
        .eq("query_hash", queryHash)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (cached) {
        console.log("Answer found in cache");

        await supabase
          .from("kb_answer_cache")
          .update({ hit_count: cached.hit_count + 1 })
          .eq("id", cached.id);

        return new Response(
          JSON.stringify({
            success: true,
            answer: cached.answer,
            sources: cached.source_chunks,
            confidence: cached.confidence_score,
            cached: true,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
    }

    // Step 1: Semantic search to get relevant chunks
    const searchResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/kb-semantic-search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({
          query,
          companyId,
          conversationId,
          useCache: false, // Don't use cache in search step
        }),
      }
    );

    const searchResult = await searchResponse.json();

    if (!searchResult.success || !searchResult.results?.length) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No relevant information found in knowledge base",
          answer: null,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const relevantChunks = searchResult.results;
    console.log(`Using ${relevantChunks.length} chunks for context`);

    // Step 2: Build context from chunks
    const contextText = relevantChunks
      .map((chunk: any, index: number) => {
        return `[Fonte ${index + 1}: ${chunk.document_title}]\n${chunk.content}\n`;
      })
      .join("\n---\n\n");

    // Step 3: Generate answer using AI
    const prompt = buildRAGPrompt(query, contextText, context);
    const answer = await generateAIResponse(prompt, aiProvider, model);

    // Calculate confidence based on similarity scores
    const avgSimilarity = relevantChunks.reduce((sum: number, chunk: any) => sum + chunk.similarity, 0) / relevantChunks.length;

    // Step 4: Save to cache
    if (config?.use_cache) {
      const queryHash = generateQueryHash(query, companyId);
      const sourceChunkIds = relevantChunks.map((chunk: any) => chunk.chunk_id);

      await supabase.from("kb_answer_cache").insert({
        company_id: companyId,
        query_hash: queryHash,
        answer,
        source_chunks: sourceChunkIds,
        confidence_score: avgSimilarity,
        hit_count: 0,
      });
    }

    // Step 5: Log query with response
    await supabase
      .from("kb_queries")
      .insert({
        company_id: companyId,
        query,
        conversation_id: conversationId,
        results: relevantChunks,
        response_generated: answer,
        confidence_score: avgSimilarity,
      });

    return new Response(
      JSON.stringify({
        success: true,
        answer,
        sources: relevantChunks.map((chunk: any) => ({
          documentTitle: chunk.document_title,
          content: chunk.content.substring(0, 200) + '...',
          similarity: chunk.similarity,
        })),
        confidence: avgSimilarity,
        cached: false,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Answer generation error:", error);

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

function buildRAGPrompt(query: string, kbContext: string, conversationContext: string): string {
  return `Você é um assistente de atendimento ao cliente. Use as informações da base de conhecimento da empresa para responder à pergunta do cliente de forma precisa e útil.

CONTEXTO DA BASE DE CONHECIMENTO:
${kbContext}

${conversationContext ? `CONTEXTO DA CONVERSA:\n${conversationContext}\n` : ''}

PERGUNTA DO CLIENTE:
${query}

INSTRUÇÕES:
1. Responda SOMENTE com base nas informações fornecidas acima
2. Se a informação não estiver disponível, diga educadamente que você não tem essa informação
3. Seja claro, objetivo e profissional
4. Cite as fontes quando relevante (ex: "De acordo com nosso FAQ...")
5. Não invente ou assuma informações que não estão no contexto
6. Use um tom amigável e prestativo

RESPOSTA:`;
}

async function generateAIResponse(prompt: string, provider: string, model?: string): Promise<string> {
  switch (provider) {
    case 'openai':
      return await generateOpenAIResponse(prompt, model || 'gpt-4o-mini');
    case 'groq':
      return await generateGroqResponse(prompt, model || 'llama-3.3-70b-versatile');
    case 'anthropic':
      return await generateAnthropicResponse(prompt, model || 'claude-3-5-sonnet-20241022');
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

async function generateOpenAIResponse(prompt: string, model: string): Promise<string> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3, // Lower temperature for more factual responses
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

async function generateGroqResponse(prompt: string, model: string): Promise<string> {
  const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY not configured");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

async function generateAnthropicResponse(prompt: string, model: string): Promise<string> {
  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  const result = await response.json();
  return result.content[0].text;
}

function generateQueryHash(query: string, companyId: string): string {
  const normalized = query.toLowerCase().trim();
  const hash = createHash("md5");
  hash.update(`${companyId}:${normalized}`);
  return hash.toString();
}
