-- =====================================================
-- Políticas RLS para tabela segments
-- Usar company_members para validação de acesso
-- =====================================================

-- Enable RLS on segments table
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT: users can view segments from their company
DROP POLICY IF EXISTS "Users can view their company's segments" ON segments;
CREATE POLICY "Users can view their company's segments"
ON public.segments
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM company_members
    WHERE user_id = auth.uid()
      AND company_id = segments.company_id
      AND is_active = true
  )
);

-- Policy for INSERT: users can create segments for their company
DROP POLICY IF EXISTS "Users can create segments for their company" ON segments;
CREATE POLICY "Users can create segments for their company"
ON public.segments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM company_members
    WHERE user_id = auth.uid()
      AND company_id = segments.company_id
      AND is_active = true
  )
);

-- Policy for UPDATE: users can update segments from their company
DROP POLICY IF EXISTS "Users can update their company's segments" ON segments;
CREATE POLICY "Users can update their company's segments"
ON public.segments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM company_members
    WHERE user_id = auth.uid()
      AND company_id = segments.company_id
      AND is_active = true
  )
);

-- Policy for DELETE: users can delete segments from their company
DROP POLICY IF EXISTS "Users can delete their company's segments" ON segments;
CREATE POLICY "Users can delete their company's segments"
ON public.segments
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM company_members
    WHERE user_id = auth.uid()
      AND company_id = segments.company_id
      AND is_active = true
  )
);

-- Also add RLS policies for segment_contacts table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'segment_contacts') THEN
    ALTER TABLE public.segment_contacts ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if any
    DROP POLICY IF EXISTS "Users can view segment_contacts from their company" ON segment_contacts;
    DROP POLICY IF EXISTS "Users can create segment_contacts for their company" ON segment_contacts;
    DROP POLICY IF EXISTS "Users can delete segment_contacts from their company" ON segment_contacts;

    -- Policy for SELECT
    CREATE POLICY "Users can view segment_contacts from their company"
    ON public.segment_contacts
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM segments s
        JOIN company_members cm ON cm.company_id = s.company_id
        WHERE s.id = segment_contacts.segment_id
          AND cm.user_id = auth.uid()
          AND cm.is_active = true
      )
    );

    -- Policy for INSERT
    CREATE POLICY "Users can create segment_contacts for their company"
    ON public.segment_contacts
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM segments s
        JOIN company_members cm ON cm.company_id = s.company_id
        WHERE s.id = segment_contacts.segment_id
          AND cm.user_id = auth.uid()
          AND cm.is_active = true
      )
    );

    -- Policy for DELETE
    CREATE POLICY "Users can delete segment_contacts from their company"
    ON public.segment_contacts
    FOR DELETE
    USING (
      EXISTS (
        SELECT 1
        FROM segments s
        JOIN company_members cm ON cm.company_id = s.company_id
        WHERE s.id = segment_contacts.segment_id
          AND cm.user_id = auth.uid()
          AND cm.is_active = true
      )
    );
  END IF;
END $$;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS de segments corrigidas!';
END $$;
