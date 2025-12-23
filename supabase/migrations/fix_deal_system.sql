-- ================================================================
-- FIX COMPLETO DO SISTEMA DE NEGOCIAÇÕES (DEALS)
-- Execute este SQL no Supabase Dashboard -> SQL Editor
-- ================================================================

-- ============================================
-- 1. GARANTIR QUE TABELA deal_notes EXISTE COM ESTRUTURA CORRETA
-- ============================================

-- Verificar e adicionar coluna company_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deal_notes' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE deal_notes ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

    -- Preencher company_id baseado no deal_id para registros existentes
    UPDATE deal_notes dn
    SET company_id = d.company_id
    FROM deals d
    WHERE dn.deal_id = d.id AND dn.company_id IS NULL;
  END IF;
END $$;

-- ============================================
-- 2. GARANTIR QUE TABELA deal_tasks EXISTE
-- ============================================

CREATE TABLE IF NOT EXISTS public.deal_tasks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    due_date timestamptz,
    priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    completed_at timestamptz,
    completed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    reminder_at timestamptz,
    reminder_sent boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT deal_tasks_title_not_empty CHECK (char_length(title) > 0)
);

-- ============================================
-- 3. GARANTIR QUE TABELA deal_files EXISTE
-- ============================================

CREATE TABLE IF NOT EXISTS public.deal_files (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_type text,
    file_size integer,
    mime_type text,
    storage_path text,
    description text,
    is_public boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT deal_files_name_not_empty CHECK (char_length(file_name) > 0),
    CONSTRAINT deal_files_url_not_empty CHECK (char_length(file_url) > 0)
);

-- Adicionar storage_path se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deal_files' AND column_name = 'storage_path'
  ) THEN
    ALTER TABLE deal_files ADD COLUMN storage_path TEXT;
  END IF;
END $$;

-- Adicionar company_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deal_files' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE deal_files ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

    UPDATE deal_files df
    SET company_id = d.company_id
    FROM deals d
    WHERE df.deal_id = d.id AND df.company_id IS NULL;
  END IF;
END $$;

-- ============================================
-- 4. GARANTIR QUE TABELA deal_activities EXISTE
-- ============================================

CREATE TABLE IF NOT EXISTS public.deal_activities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    activity_type text NOT NULL,
    description text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- ============================================
-- 5. ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_deal_notes_deal_id ON deal_notes(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_notes_user_id ON deal_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_deal_notes_company_id ON deal_notes(company_id);

CREATE INDEX IF NOT EXISTS idx_deal_tasks_deal_id ON deal_tasks(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_tasks_assigned_to ON deal_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deal_tasks_created_by ON deal_tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_deal_tasks_company_id ON deal_tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_deal_tasks_status ON deal_tasks(status);

CREATE INDEX IF NOT EXISTS idx_deal_files_deal_id ON deal_files(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_files_uploaded_by ON deal_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_deal_files_company_id ON deal_files(company_id);

CREATE INDEX IF NOT EXISTS idx_deal_activities_deal_id ON deal_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_activities_user_id ON deal_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_deal_activities_created_at ON deal_activities(created_at DESC);

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE deal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_activities ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6.1 POLICIES PARA deal_notes
-- ============================================

DROP POLICY IF EXISTS "deal_notes_select" ON deal_notes;
CREATE POLICY "deal_notes_select" ON deal_notes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM deals d
    WHERE d.id = deal_notes.deal_id
    AND d.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  )
);

DROP POLICY IF EXISTS "deal_notes_insert" ON deal_notes;
CREATE POLICY "deal_notes_insert" ON deal_notes FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM deals d
    WHERE d.id = deal_notes.deal_id
    AND d.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  )
);

DROP POLICY IF EXISTS "deal_notes_update" ON deal_notes;
CREATE POLICY "deal_notes_update" ON deal_notes FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "deal_notes_delete" ON deal_notes;
CREATE POLICY "deal_notes_delete" ON deal_notes FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- 6.2 POLICIES PARA deal_tasks
-- ============================================

DROP POLICY IF EXISTS "deal_tasks_select" ON deal_tasks;
CREATE POLICY "deal_tasks_select" ON deal_tasks FOR SELECT
USING (
  company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "deal_tasks_insert" ON deal_tasks;
CREATE POLICY "deal_tasks_insert" ON deal_tasks FOR INSERT
WITH CHECK (
  company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "deal_tasks_update" ON deal_tasks;
CREATE POLICY "deal_tasks_update" ON deal_tasks FOR UPDATE
USING (
  company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "deal_tasks_delete" ON deal_tasks;
CREATE POLICY "deal_tasks_delete" ON deal_tasks FOR DELETE
USING (
  company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
);

-- ============================================
-- 6.3 POLICIES PARA deal_files
-- ============================================

DROP POLICY IF EXISTS "deal_files_select" ON deal_files;
CREATE POLICY "deal_files_select" ON deal_files FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM deals d
    WHERE d.id = deal_files.deal_id
    AND d.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  )
);

DROP POLICY IF EXISTS "deal_files_insert" ON deal_files;
CREATE POLICY "deal_files_insert" ON deal_files FOR INSERT
WITH CHECK (
  uploaded_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM deals d
    WHERE d.id = deal_files.deal_id
    AND d.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  )
);

DROP POLICY IF EXISTS "deal_files_delete" ON deal_files;
CREATE POLICY "deal_files_delete" ON deal_files FOR DELETE
USING (uploaded_by = auth.uid());

-- ============================================
-- 6.4 POLICIES PARA deal_activities
-- ============================================

DROP POLICY IF EXISTS "deal_activities_select" ON deal_activities;
CREATE POLICY "deal_activities_select" ON deal_activities FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM deals d
    WHERE d.id = deal_activities.deal_id
    AND d.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  )
);

DROP POLICY IF EXISTS "deal_activities_insert" ON deal_activities;
CREATE POLICY "deal_activities_insert" ON deal_activities FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM deals d
    WHERE d.id = deal_activities.deal_id
    AND d.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  )
);

-- ============================================
-- 7. TRIGGERS PARA updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_deal_notes_updated_at ON deal_notes;
CREATE TRIGGER update_deal_notes_updated_at
    BEFORE UPDATE ON deal_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deal_tasks_updated_at ON deal_tasks;
CREATE TRIGGER update_deal_tasks_updated_at
    BEFORE UPDATE ON deal_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. FOREIGN KEYS COM NOMES ESPECÍFICOS (para joins do Supabase)
-- ============================================

-- deal_tasks.assigned_to
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'deal_tasks_assigned_to_fkey' AND table_name = 'deal_tasks') THEN
    ALTER TABLE deal_tasks ADD CONSTRAINT deal_tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- deal_tasks.created_by
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'deal_tasks_created_by_fkey' AND table_name = 'deal_tasks') THEN
    ALTER TABLE deal_tasks ADD CONSTRAINT deal_tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- deal_tasks.completed_by
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'deal_tasks_completed_by_fkey' AND table_name = 'deal_tasks') THEN
    ALTER TABLE deal_tasks ADD CONSTRAINT deal_tasks_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- deal_files.uploaded_by
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'deal_files_uploaded_by_fkey' AND table_name = 'deal_files') THEN
    ALTER TABLE deal_files ADD CONSTRAINT deal_files_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 9. VERIFICAR RESULTADO
-- ============================================

SELECT 'Tabelas criadas:' as info;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('deal_notes', 'deal_tasks', 'deal_files', 'deal_activities');

SELECT 'Colunas de deal_notes:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'deal_notes'
ORDER BY ordinal_position;
