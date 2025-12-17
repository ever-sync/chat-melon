-- Migration: Knowledge Base + RAG (Retrieval-Augmented Generation)
-- Implements semantic search for AI-powered contextual responses

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge Base Documents
CREATE TABLE IF NOT EXISTS kb_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category_id UUID REFERENCES faq_categories(id) ON DELETE SET NULL,
  source_type TEXT DEFAULT 'manual' CHECK (source_type IN ('manual', 'pdf', 'url', 'faq_sync')),
  source_url TEXT,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT kb_documents_content_length CHECK (char_length(content) >= 10)
);

-- Document chunks for embeddings (better retrieval with smaller chunks)
CREATE TABLE IF NOT EXISTS kb_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES kb_documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 dimension (1536)
  token_count INTEGER,
  position INTEGER NOT NULL DEFAULT 0, -- Order in document
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT kb_chunks_content_length CHECK (char_length(content) >= 10)
);

-- Create index for vector similarity search using ivfflat
-- This dramatically speeds up similarity searches
CREATE INDEX IF NOT EXISTS kb_chunks_embedding_idx
ON kb_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Regular index for document_id lookups
CREATE INDEX IF NOT EXISTS kb_chunks_document_id_idx ON kb_chunks(document_id);

-- Index for position ordering
CREATE INDEX IF NOT EXISTS kb_chunks_position_idx ON kb_chunks(document_id, position);

-- Query history for analytics
CREATE TABLE IF NOT EXISTS kb_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  results JSONB, -- Top K chunks returned
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  response_generated TEXT,
  confidence_score FLOAT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for analytics
CREATE INDEX IF NOT EXISTS kb_queries_company_created_idx ON kb_queries(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS kb_queries_conversation_idx ON kb_queries(conversation_id);

-- Answer cache to avoid regenerating same responses
CREATE TABLE IF NOT EXISTS kb_answer_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  query_hash TEXT UNIQUE NOT NULL, -- MD5 hash of normalized query
  answer TEXT NOT NULL,
  source_chunks UUID[] NOT NULL, -- Array of chunk IDs used
  confidence_score FLOAT,
  hit_count INTEGER DEFAULT 0, -- How many times this cache was hit
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days')
);

-- Index for cache lookups
CREATE INDEX IF NOT EXISTS kb_answer_cache_query_hash_idx ON kb_answer_cache(query_hash);
CREATE INDEX IF NOT EXISTS kb_answer_cache_company_idx ON kb_answer_cache(company_id);
CREATE INDEX IF NOT EXISTS kb_answer_cache_expires_idx ON kb_answer_cache(expires_at);

-- Knowledge Base configuration per company
CREATE TABLE IF NOT EXISTS kb_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  is_enabled BOOLEAN DEFAULT true,
  embedding_provider TEXT DEFAULT 'openai' CHECK (embedding_provider IN ('openai', 'cohere', 'huggingface')),
  embedding_model TEXT DEFAULT 'text-embedding-ada-002',
  chunk_size INTEGER DEFAULT 1000, -- Characters per chunk
  chunk_overlap INTEGER DEFAULT 200, -- Overlap between chunks
  top_k INTEGER DEFAULT 5, -- Number of chunks to retrieve
  similarity_threshold FLOAT DEFAULT 0.7, -- Minimum similarity score (0-1)
  use_cache BOOLEAN DEFAULT true,
  auto_sync_faqs BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE kb_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_answer_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for kb_documents
DROP POLICY IF EXISTS "Users can view documents from their company" ON kb_documents;
CREATE POLICY "Users can view documents from their company"
ON kb_documents FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM company_users WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage documents" ON kb_documents;
CREATE POLICY "Admins can manage documents"
ON kb_documents FOR ALL
USING (
  company_id IN (
    SELECT cu.company_id
    FROM company_users cu
    JOIN company_members cm ON cm.user_id = cu.user_id AND cm.company_id = cu.company_id
    WHERE cu.user_id = auth.uid()
    AND cm.role IN ('owner', 'admin', 'manager')
  )
);

-- RLS Policies for kb_chunks
DROP POLICY IF EXISTS "Users can view chunks from their company documents" ON kb_chunks;
CREATE POLICY "Users can view chunks from their company documents"
ON kb_chunks FOR SELECT
USING (
  document_id IN (
    SELECT id FROM kb_documents
    WHERE company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Admins can manage chunks" ON kb_chunks;
CREATE POLICY "Admins can manage chunks"
ON kb_chunks FOR ALL
USING (
  document_id IN (
    SELECT id FROM kb_documents
    WHERE company_id IN (
      SELECT cu.company_id
      FROM company_users cu
      JOIN company_members cm ON cm.user_id = cu.user_id AND cm.company_id = cu.company_id
      WHERE cu.user_id = auth.uid()
      AND cm.role IN ('owner', 'admin', 'manager')
    )
  )
);

-- RLS Policies for kb_queries
DROP POLICY IF EXISTS "Users can view queries from their company" ON kb_queries;
CREATE POLICY "Users can view queries from their company"
ON kb_queries FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM company_users WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert queries" ON kb_queries;
CREATE POLICY "Users can insert queries"
ON kb_queries FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM company_users WHERE user_id = auth.uid()
  )
);

-- RLS Policies for kb_answer_cache
DROP POLICY IF EXISTS "Users can view cache from their company" ON kb_answer_cache;
CREATE POLICY "Users can view cache from their company"
ON kb_answer_cache FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM company_users WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "System can manage cache" ON kb_answer_cache;
CREATE POLICY "System can manage cache"
ON kb_answer_cache FOR ALL
USING (true);

-- RLS Policies for kb_configs
DROP POLICY IF EXISTS "Users can view their company's KB config" ON kb_configs;
CREATE POLICY "Users can view their company's KB config"
ON kb_configs FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM company_users WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage KB config" ON kb_configs;
CREATE POLICY "Admins can manage KB config"
ON kb_configs FOR ALL
USING (
  company_id IN (
    SELECT cu.company_id
    FROM company_users cu
    JOIN company_members cm ON cm.user_id = cu.user_id AND cm.company_id = cu.company_id
    WHERE cu.user_id = auth.uid()
    AND cm.role IN ('owner', 'admin')
  )
);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_kb_document_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_kb_document_updated_at_trigger ON kb_documents;
CREATE TRIGGER update_kb_document_updated_at_trigger
BEFORE UPDATE ON kb_documents
FOR EACH ROW
EXECUTE FUNCTION update_kb_document_updated_at();

CREATE OR REPLACE FUNCTION update_kb_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_kb_config_updated_at_trigger ON kb_configs;
CREATE TRIGGER update_kb_config_updated_at_trigger
BEFORE UPDATE ON kb_configs
FOR EACH ROW
EXECUTE FUNCTION update_kb_config_updated_at();

-- Function for semantic search
CREATE OR REPLACE FUNCTION search_kb_chunks(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  filter_company_id uuid DEFAULT NULL,
  similarity_threshold float DEFAULT 0.7
)
RETURNS TABLE (
  chunk_id uuid,
  document_id uuid,
  content text,
  similarity float,
  metadata jsonb,
  document_title text,
  document_source text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS chunk_id,
    c.document_id,
    c.content,
    1 - (c.embedding <=> query_embedding) AS similarity,
    c.metadata,
    d.title AS document_title,
    d.source_type AS document_source
  FROM kb_chunks c
  JOIN kb_documents d ON c.document_id = d.id
  WHERE
    (filter_company_id IS NULL OR d.company_id = filter_company_id)
    AND d.is_active = true
    AND (1 - (c.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to clean expired cache
CREATE OR REPLACE FUNCTION clean_expired_kb_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM kb_answer_cache
  WHERE expires_at < now();
END;
$$;

-- Create default KB configs for existing companies
INSERT INTO kb_configs (company_id, is_enabled)
SELECT id, true
FROM companies
WHERE id NOT IN (SELECT company_id FROM kb_configs)
ON CONFLICT (company_id) DO NOTHING;

-- Auto-sync existing FAQs to KB
INSERT INTO kb_documents (company_id, title, content, source_type, created_at)
SELECT
  cf.company_id,
  cf.question AS title,
  cf.answer AS content,
  'faq_sync' AS source_type,
  cf.created_at
FROM company_faqs cf
WHERE cf.company_id IN (SELECT company_id FROM kb_configs WHERE auto_sync_faqs = true)
ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE kb_documents IS 'Knowledge base documents that can be searched semantically';
COMMENT ON TABLE kb_chunks IS 'Document chunks with embeddings for semantic search';
COMMENT ON TABLE kb_queries IS 'History of knowledge base queries for analytics';
COMMENT ON TABLE kb_answer_cache IS 'Cache of generated answers to avoid redundant processing';
COMMENT ON TABLE kb_configs IS 'Knowledge base configuration per company';
COMMENT ON FUNCTION search_kb_chunks IS 'Performs semantic search using vector similarity';
