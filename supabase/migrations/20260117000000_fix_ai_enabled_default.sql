-- Fix the default value for ai_enabled in conversations table
-- Root cause: Migration 20251126014259_9da87a29... set it to DEFAULT true

ALTER TABLE conversations ALTER COLUMN ai_enabled SET DEFAULT false;

-- Reset ai_enabled for conversations without active AI sessions
-- This fixes the incorrect "IA" count in chat filters
UPDATE conversations 
SET ai_enabled = false 
WHERE ai_enabled = true 
AND id NOT IN (
    SELECT conversation_id 
    FROM ai_agent_sessions 
    WHERE status IN ('active', 'waiting_response')
);

-- Also fix channel_settings default while we are at it, to be consistent
-- (Although the previous migration already set it to false, let's ensure it)
ALTER TABLE channel_settings ALTER COLUMN ai_enabled SET DEFAULT false;
