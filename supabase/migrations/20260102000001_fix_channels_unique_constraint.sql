-- =====================================================
-- Fix channels unique constraint for upsert operations
-- =====================================================

-- Primeiro, adicionar a coluna external_id se não existir
ALTER TABLE channels ADD COLUMN IF NOT EXISTS external_id VARCHAR(255);

-- Remove a constraint antiga (company_id, type, name) se existir
DO $$
BEGIN
  -- Dropar constraint pelo nome se existir
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'channels_company_id_type_name_key'
  ) THEN
    ALTER TABLE channels DROP CONSTRAINT channels_company_id_type_name_key;
  END IF;
END $$;

-- Garantir que existe a constraint correta (company_id, type, external_id)
-- Esta é necessária para o upsert no meta-oauth funcionar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'channels_company_id_type_external_id_key'
  ) THEN
    -- Criar a constraint única correta
    ALTER TABLE channels ADD CONSTRAINT channels_company_id_type_external_id_key
      UNIQUE (company_id, type, external_id);
  END IF;
END $$;

-- Criar índice para melhor performance nas buscas
CREATE INDEX IF NOT EXISTS idx_channels_company_type_external
  ON channels(company_id, type, external_id);
