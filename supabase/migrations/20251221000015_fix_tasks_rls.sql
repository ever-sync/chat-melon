-- =====================================================
-- Corrigir políticas RLS da tabela tasks
-- Usar company_members em vez de get_user_company()
-- =====================================================

-- 1. Atualizar política de SELECT
DROP POLICY IF EXISTS "Users can view tasks in their company" ON tasks;

CREATE POLICY "Users can view tasks in their company"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM company_members
      WHERE user_id = auth.uid()
        AND company_id = tasks.company_id
        AND is_active = true
    )
  );

-- 2. Atualizar política de INSERT
DROP POLICY IF EXISTS "Users can create tasks in their company" ON tasks;

CREATE POLICY "Users can create tasks in their company"
  ON tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM company_members
      WHERE user_id = auth.uid()
        AND company_id = tasks.company_id
        AND is_active = true
    )
  );

-- 3. Atualizar política de UPDATE
DROP POLICY IF EXISTS "Users can update their tasks" ON tasks;

CREATE POLICY "Users can update their tasks"
  ON tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.company_id = tasks.company_id
        AND cm.is_active = true
        AND (
          -- Usuário atribuído à tarefa pode editar
          tasks.assigned_to = auth.uid()
          OR
          -- Admins podem editar todas as tarefas
          cm.role IN ('owner', 'admin', 'manager')
        )
    )
  );

-- 4. Atualizar política de DELETE
DROP POLICY IF EXISTS "Admins can delete tasks" ON tasks;

CREATE POLICY "Admins can delete tasks"
  ON tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM company_members
      WHERE user_id = auth.uid()
        AND company_id = tasks.company_id
        AND is_active = true
        AND role IN ('owner', 'admin', 'manager')
    )
  );

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS de tasks corrigidas!';
  RAISE NOTICE 'Agora usando company_members em vez de get_user_company()';
END $$;
