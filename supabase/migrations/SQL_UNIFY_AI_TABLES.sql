-- =====================================================
-- UNIFICAÇÃO DA TABELA ai_suggestions
-- Garante compatibilidade entre Elisa, Copiloto e Monitoramento
-- =====================================================

DO $$ 
BEGIN
    -- Adicionar colunas se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_suggestions' AND column_name='agent_id') THEN
        ALTER TABLE ai_suggestions ADD COLUMN agent_id UUID REFERENCES profiles(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_suggestions' AND column_name='description') THEN
        ALTER TABLE ai_suggestions ADD COLUMN description TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_suggestions' AND column_name='suggested_response') THEN
        ALTER TABLE ai_suggestions ADD COLUMN suggested_response TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_suggestions' AND column_name='reasoning') THEN
        ALTER TABLE ai_suggestions ADD COLUMN reasoning TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_suggestions' AND column_name='trigger_context') THEN
        ALTER TABLE ai_suggestions ADD COLUMN trigger_context JSONB DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_suggestions' AND column_name='type') THEN
        ALTER TABLE ai_suggestions ADD COLUMN type VARCHAR(20);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_suggestions' AND column_name='was_useful') THEN
        ALTER TABLE ai_suggestions ADD COLUMN was_useful BOOLEAN;
    END IF;

    -- Garantir que as colunas da Elisa também existam (caso tenham sido deletadas)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_suggestions' AND column_name='content') THEN
        ALTER TABLE ai_suggestions ADD COLUMN content TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_suggestions' AND column_name='suggestion_type') THEN
        ALTER TABLE ai_suggestions ADD COLUMN suggestion_type TEXT;
    END IF;

END $$;

-- Criar um TRIGGER para manter compatibilidade: 
-- Quando inserir em 'type', preencher 'suggestion_type'. Quando inserir em 'suggested_response', preencher 'content'.
CREATE OR REPLACE FUNCTION sync_ai_suggestions_cols() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type IS NOT NULL AND NEW.suggestion_type IS NULL THEN
        NEW.suggestion_type = NEW.type;
    END IF;
    IF NEW.suggested_response IS NOT NULL AND NEW.content IS NULL THEN
        NEW.content = NEW.suggested_response;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_ai_cols ON ai_suggestions;
CREATE TRIGGER trg_sync_ai_cols
BEFORE INSERT OR UPDATE ON ai_suggestions
FOR EACH ROW EXECUTE FUNCTION sync_ai_suggestions_cols();

SELECT 'Tabela ai_suggestions unificada com sucesso!' as resultado;
