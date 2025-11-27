-- Tabela para notas de transferência e conversas
CREATE TABLE conversation_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  note_type TEXT NOT NULL DEFAULT 'general', -- 'general', 'transfer', 'internal'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_conversation_notes_conversation ON conversation_notes(conversation_id);
CREATE INDEX idx_conversation_notes_type ON conversation_notes(note_type);

-- RLS Policies
ALTER TABLE conversation_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notes in their company conversations"
  ON conversation_notes FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE company_id = get_user_company(auth.uid())
    )
  );

CREATE POLICY "Users can create notes in their company conversations"
  ON conversation_notes FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE company_id = get_user_company(auth.uid())
    )
  );

-- Adicionar índice no campo sector_id de conversations que estava sendo usado
CREATE INDEX IF NOT EXISTS idx_conversations_sector ON conversations(sector_id);