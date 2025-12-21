-- =====================================================
-- Garantir que deal_notes tem coluna user_id
-- E criar foreign key se necessário
-- =====================================================

-- 1. Verificar e criar coluna user_id se não existir
DO $$
BEGIN
  -- Se user_id não existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deal_notes' AND column_name = 'user_id'
  ) THEN
    -- Se created_by existe, renomear para user_id
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'deal_notes' AND column_name = 'created_by'
    ) THEN
      RAISE NOTICE 'Renomeando created_by para user_id...';
      ALTER TABLE deal_notes RENAME COLUMN created_by TO user_id;
    ELSE
      -- Criar coluna user_id do zero
      RAISE NOTICE 'Criando coluna user_id...';
      ALTER TABLE deal_notes ADD COLUMN user_id UUID;
    END IF;
  END IF;
END $$;

-- 2. Remover políticas antigas que usam created_by
DROP POLICY IF EXISTS "Users can insert their own deal notes" ON deal_notes;
DROP POLICY IF EXISTS "Users can update their own deal notes" ON deal_notes;
DROP POLICY IF EXISTS "Users can delete their own deal notes" ON deal_notes;
DROP POLICY IF EXISTS "Users can view deal notes from their company" ON deal_notes;

-- 3. Criar foreign key nomeada para user_id -> profiles.id
DO $$
BEGIN
  -- Remover constraint existente se houver
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'deal_notes_user_id_fkey'
    AND table_name = 'deal_notes'
  ) THEN
    ALTER TABLE deal_notes DROP CONSTRAINT deal_notes_user_id_fkey;
  END IF;

  -- Adicionar constraint com nome específico
  ALTER TABLE deal_notes
    ADD CONSTRAINT deal_notes_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES profiles(id)
    ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Ignora se já existe
END $$;

-- 4. Recriar políticas RLS usando user_id
CREATE POLICY "Users can view deal notes from their company"
  ON deal_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_notes.deal_id
      AND deals.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can insert their own deal notes"
  ON deal_notes FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_notes.deal_id
      AND deals.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own deal notes"
  ON deal_notes FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own deal notes"
  ON deal_notes FOR DELETE
  USING (user_id = auth.uid());

-- 5. Adicionar índice para performance
CREATE INDEX IF NOT EXISTS idx_deal_notes_user_id ON deal_notes(user_id);

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ deal_notes configurado com sucesso!';
  RAISE NOTICE 'Coluna user_id verificada/criada';
  RAISE NOTICE 'Foreign key adicionada: user_id -> profiles.id';
  RAISE NOTICE 'Políticas RLS recriadas';
END $$;
