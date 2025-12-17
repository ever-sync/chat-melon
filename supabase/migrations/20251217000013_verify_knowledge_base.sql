-- =====================================================
-- KNOWLEDGE BASE VERIFICATION & SETUP (FULL)
-- =====================================================
-- This migration ensures ALL Knowledge Base tables,
-- functions, extensions, and policies are correct.
-- =====================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- 2. Create tables if not exist

-- faq_categories
CREATE TABLE IF NOT EXISTS public.faq_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- kb_documents
CREATE TABLE IF NOT EXISTS public.kb_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source_type TEXT DEFAULT 'manual',
    source_url TEXT,
    category_id UUID REFERENCES public.faq_categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- kb_chunks
CREATE TABLE IF NOT EXISTS public.kb_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.kb_documents(id) ON DELETE CASCADE,
    -- Add company_id for direct filtering/RLS optimization
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(1536),
    chunk_index INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Ensure company_id exists if table was already created without it
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kb_chunks' AND column_name = 'company_id') THEN
        ALTER TABLE public.kb_chunks ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- kb_configs
CREATE TABLE IF NOT EXISTS public.kb_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT true,
    top_k INT DEFAULT 5,
    similarity_threshold FLOAT DEFAULT 0.7,
    use_cache BOOLEAN DEFAULT true,
    embedding_provider TEXT DEFAULT 'openai',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id)
);

-- kb_queries
CREATE TABLE IF NOT EXISTS public.kb_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    conversation_id UUID,
    results JSONB,
    confidence_score FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- kb_answer_cache
CREATE TABLE IF NOT EXISTS public.kb_answer_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    query_hash TEXT NOT NULL,
    answer TEXT NOT NULL,
    confidence_score FLOAT,
    hit_count INT DEFAULT 1,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_answer_cache ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies

-- faq_categories
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their categories" ON faq_categories;
    CREATE POLICY "Users can view their categories" ON faq_categories FOR SELECT USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
    DROP POLICY IF EXISTS "Users can manage their categories" ON faq_categories;
    CREATE POLICY "Users can manage their categories" ON faq_categories FOR ALL USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
END $$;

-- kb_documents
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their documents" ON kb_documents;
    CREATE POLICY "Users can view their documents" ON kb_documents FOR SELECT USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
    DROP POLICY IF EXISTS "Users can manage their documents" ON kb_documents;
    CREATE POLICY "Users can manage their documents" ON kb_documents FOR ALL USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
END $$;

-- kb_chunks
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their chunks" ON kb_chunks;
    -- Optimized to use company_id if present, fallback to document join
    CREATE POLICY "Users can view their chunks" ON kb_chunks FOR SELECT USING (
        company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()) 
        OR 
        (company_id IS NULL AND document_id IN (SELECT id FROM kb_documents WHERE company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())))
    );
END $$;

-- kb_configs
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their config" ON kb_configs;
    CREATE POLICY "Users can view their config" ON kb_configs FOR SELECT USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
    DROP POLICY IF EXISTS "Users can manage their config" ON kb_configs;
    CREATE POLICY "Users can manage their config" ON kb_configs FOR ALL USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
END $$;

-- kb_queries / cache
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view queries" ON kb_queries;
    CREATE POLICY "Users can view queries" ON kb_queries FOR SELECT USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
    DROP POLICY IF EXISTS "Users can insert queries" ON kb_queries; -- Edge functions/Service Role
    CREATE POLICY "Users can insert queries" ON kb_queries FOR INSERT WITH CHECK (true); 
    
    DROP POLICY IF EXISTS "Users can view cache" ON kb_answer_cache;
    CREATE POLICY "Users can view cache" ON kb_answer_cache FOR SELECT USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
END $$;

-- 4.1 Backfill default config for existing companies
INSERT INTO public.kb_configs (company_id, is_enabled)
SELECT id, true 
FROM public.companies 
WHERE id NOT IN (SELECT company_id FROM public.kb_configs);

-- 5. Search Function
CREATE OR REPLACE FUNCTION search_kb_chunks (
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  filter_company_id uuid DEFAULT null,
  similarity_threshold float DEFAULT 0.7
) returns table (
  chunk_id uuid,
  document_id uuid,
  content text,
  similarity float,
  metadata jsonb,
  document_title text,
  document_source text
)
language plpgsql
security definer
as $$
begin
  return query
  select
    kb_chunks.id as chunk_id,
    kb_chunks.document_id,
    kb_chunks.content,
    1 - (kb_chunks.embedding <=> query_embedding) as similarity,
    kb_documents.metadata,
    kb_documents.title as document_title,
    kb_documents.source_type as document_source
  from kb_chunks
  join kb_documents on kb_chunks.document_id = kb_documents.id
  where 1 - (kb_chunks.embedding <=> query_embedding) > similarity_threshold
  and (filter_company_id is null or kb_documents.company_id = filter_company_id)
  order by kb_chunks.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 6. Indexes
CREATE INDEX IF NOT EXISTS kb_chunks_embedding_idx ON public.kb_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_kb_documents_company ON kb_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_kb_chunks_company ON kb_chunks(company_id);
CREATE INDEX IF NOT EXISTS idx_kb_queries_company ON kb_queries(company_id);
