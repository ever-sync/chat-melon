-- Enable Extensions for Advanced Search (Standard on Supabase PRO)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 1. Messages Search Optimization
-- GIN Index on content using trigram for efficient 'ILIKE %term%' queries
CREATE INDEX IF NOT EXISTS idx_messages_content_trgm 
ON messages USING gin (content gin_trgm_ops);

-- 2. Conversations Search Optimization
-- GIN Index on contact name
CREATE INDEX IF NOT EXISTS idx_conversations_contact_name_trgm 
ON conversations USING gin (contact_name gin_trgm_ops);

-- GIN Index on contact number
CREATE INDEX IF NOT EXISTS idx_conversations_contact_number_trgm 
ON conversations USING gin (contact_number gin_trgm_ops);

-- 3. Additional status indexes
CREATE INDEX IF NOT EXISTS idx_conversations_status_company 
ON conversations(company_id, status);

CREATE INDEX IF NOT EXISTS idx_messages_status_timestamp 
ON messages(conversation_id, status, timestamp DESC);

-- 4. Notify about success
DO $$
BEGIN
  RAISE NOTICE '✅ Supabase PRO Optimizations Applied: pg_trgm enabled and GIN indexes created.';
END $$;
