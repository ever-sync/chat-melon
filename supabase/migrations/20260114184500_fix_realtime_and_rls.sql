-- Fix RLS Policies and Realtime configuration for Chat
-- 1. Ensure Realtime is enabled for conversations and messages (if not already)
-- 2. Update RLS policies to correctly allow access based on company_users (not company_members which is incorrect)

-- PART 1: Enable Realtime (Idempotent)
DO $$
BEGIN
  -- Conversations
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
  END IF;

  -- Messages
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;

-- PART 2: Fix RLS Policies for Messages
DROP POLICY IF EXISTS "Users can view messages in their company" ON messages;
DROP POLICY IF EXISTS "Users can view messages in their company conversations" ON messages;

CREATE POLICY "Users can view messages in their company conversations" ON messages
FOR SELECT USING (
  -- Permite se a conversa pertence à empresa do usuário
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND c.company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  )
);

-- PART 3: Fix RLS Policies for Conversations
DROP POLICY IF EXISTS "Users can view conversations in their company" ON conversations;

CREATE POLICY "Users can view conversations in their company" ON conversations
FOR SELECT USING (
  -- Permite se a conversa é da empresa do usuário
  company_id IN (
    SELECT company_id FROM company_users WHERE user_id = auth.uid()
  )
);

-- Ensure company_users has RLS enabled and policy allows read own membership
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own memberships" ON company_users;
CREATE POLICY "Users can view their own memberships" ON company_users
FOR SELECT USING (user_id = auth.uid());
