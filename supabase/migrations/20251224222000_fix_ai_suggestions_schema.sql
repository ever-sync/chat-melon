-- =====================================================
-- CORREÇÃO DO SCHEMA DA TABELA ai_suggestions
-- Migration: 20251224230000_fix_ai_suggestions_schema.sql
-- =====================================================

-- Adicionar colunas faltantes na tabela ai_suggestions
DO $$
BEGIN
    -- Adicionar coluna was_used se não existir (crítico para índice)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ai_suggestions' AND column_name = 'was_used') THEN
        ALTER TABLE ai_suggestions ADD COLUMN was_used BOOLEAN DEFAULT false;
    END IF;

    -- Adicionar coluna was_useful se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ai_suggestions' AND column_name = 'was_useful') THEN
        ALTER TABLE ai_suggestions ADD COLUMN was_useful BOOLEAN;
    END IF;

    -- Adicionar coluna agent_feedback se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ai_suggestions' AND column_name = 'agent_feedback') THEN
        ALTER TABLE ai_suggestions ADD COLUMN agent_feedback TEXT;
    END IF;

    -- Adicionar coluna expires_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ai_suggestions' AND column_name = 'expires_at') THEN
        ALTER TABLE ai_suggestions ADD COLUMN expires_at TIMESTAMPTZ;
    END IF;

    -- Adicionar coluna status se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ai_suggestions' AND column_name = 'status') THEN
        ALTER TABLE ai_suggestions ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
    END IF;

    -- Adicionar coluna content se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ai_suggestions' AND column_name = 'content') THEN
        ALTER TABLE ai_suggestions ADD COLUMN content TEXT;
    END IF;

    -- Adicionar coluna suggestion_type se não existir (alias para type)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ai_suggestions' AND column_name = 'suggestion_type') THEN
        ALTER TABLE ai_suggestions ADD COLUMN suggestion_type VARCHAR(20);
    END IF;

    -- Adicionar coluna used_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ai_suggestions' AND column_name = 'used_at') THEN
        ALTER TABLE ai_suggestions ADD COLUMN used_at TIMESTAMPTZ;
    END IF;

    -- Adicionar coluna used_by se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ai_suggestions' AND column_name = 'used_by') THEN
        ALTER TABLE ai_suggestions ADD COLUMN used_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
    END IF;

    -- Adicionar coluna dismissed_reason se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ai_suggestions' AND column_name = 'dismissed_reason') THEN
        ALTER TABLE ai_suggestions ADD COLUMN dismissed_reason TEXT;
    END IF;

    -- Adicionar coluna contact_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ai_suggestions' AND column_name = 'contact_id') THEN
        ALTER TABLE ai_suggestions ADD COLUMN contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;
    END IF;

    -- Adicionar coluna confidence se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ai_suggestions' AND column_name = 'confidence') THEN
        ALTER TABLE ai_suggestions ADD COLUMN confidence DECIMAL(5,2);
    END IF;

    -- Adicionar coluna related_product_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ai_suggestions' AND column_name = 'related_product_id') THEN
        ALTER TABLE ai_suggestions ADD COLUMN related_product_id UUID;
    END IF;
END $$;

-- Sincronizar suggestion_type com type (para compatibilidade)
UPDATE ai_suggestions
SET suggestion_type = type
WHERE suggestion_type IS NULL AND type IS NOT NULL;

-- Sincronizar type com suggestion_type (para compatibilidade reversa)
UPDATE ai_suggestions
SET type = suggestion_type
WHERE type IS NULL AND suggestion_type IS NOT NULL;

-- Sincronizar content com suggested_response (para compatibilidade)
UPDATE ai_suggestions
SET content = suggested_response
WHERE content IS NULL AND suggested_response IS NOT NULL;

-- Adicionar índices para as novas colunas
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON ai_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_contact ON ai_suggestions(contact_id);

-- Adicionar trigger para sincronizar type e suggestion_type automaticamente
CREATE OR REPLACE FUNCTION sync_suggestion_types()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type IS NOT NULL AND NEW.suggestion_type IS NULL THEN
        NEW.suggestion_type := NEW.type;
    ELSIF NEW.suggestion_type IS NOT NULL AND NEW.type IS NULL THEN
        NEW.type := NEW.suggestion_type;
    END IF;

    IF NEW.suggested_response IS NOT NULL AND NEW.content IS NULL THEN
        NEW.content := NEW.suggested_response;
    ELSIF NEW.content IS NOT NULL AND NEW.suggested_response IS NULL THEN
        NEW.suggested_response := NEW.content;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_suggestion_types ON ai_suggestions;
CREATE TRIGGER trigger_sync_suggestion_types
    BEFORE INSERT OR UPDATE ON ai_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION sync_suggestion_types();

-- =====================================================
-- ATUALIZAR RLS PARA INCLUIR NOVAS FUNCIONALIDADES
-- =====================================================

-- Política para permitir que agentes vejam sugestões de conversas atribuídas a eles
DROP POLICY IF EXISTS "Users can view suggestions for their conversations" ON ai_suggestions;
CREATE POLICY "Users can view suggestions for their conversations"
    ON ai_suggestions FOR SELECT
    USING (
        -- Sugestões próprias
        agent_id = auth.uid()
        OR
        -- Sugestões de conversas atribuídas ao usuário
        conversation_id IN (
            SELECT id FROM conversations WHERE assigned_to = auth.uid()
        )
        OR
        -- Admin/Manager podem ver todas da empresa (via company_members)
        company_id IN (
            SELECT company_id FROM company_members
            WHERE user_id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true
        )
    );

-- Política para permitir update de status
DROP POLICY IF EXISTS "Users can update suggestion status" ON ai_suggestions;
CREATE POLICY "Users can update suggestion status"
    ON ai_suggestions FOR UPDATE
    USING (
        agent_id = auth.uid()
        OR
        conversation_id IN (
            SELECT id FROM conversations WHERE assigned_to = auth.uid()
        )
    );

COMMENT ON TABLE ai_suggestions IS 'Sugestões geradas pela IA para os agentes - atualizado com campos de status e compatibilidade';
