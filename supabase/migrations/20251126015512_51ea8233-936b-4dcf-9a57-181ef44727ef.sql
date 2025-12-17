
-- Habilitar extensão vector se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS vector;

-- Criar tabela de embeddings para busca semântica (RAG)
CREATE TABLE IF NOT EXISTS conversation_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 dimensions
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca por embedding (similaridade)
CREATE INDEX IF NOT EXISTS idx_conversation_embeddings_vector 
ON conversation_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Índice para busca por conversa
CREATE INDEX IF NOT EXISTS idx_conversation_embeddings_conversation 
ON conversation_embeddings(conversation_id);

-- RLS policies
ALTER TABLE conversation_embeddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Embeddings por empresa" ON conversation_embeddings;
CREATE POLICY "Embeddings por empresa" ON conversation_embeddings
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
      )
    )
  );

-- Função para buscar conversas similares (RAG)
CREATE OR REPLACE FUNCTION match_conversations(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  conversation_id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.id,
    ce.conversation_id,
    ce.content,
    1 - (ce.embedding <=> query_embedding) as similarity
  FROM conversation_embeddings ce
  WHERE 1 - (ce.embedding <=> query_embedding) > match_threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON TABLE conversation_embeddings IS 'Armazena embeddings de conversas para busca semântica (RAG)';
COMMENT ON FUNCTION match_conversations IS 'Busca conversas similares usando embeddings vetoriais';