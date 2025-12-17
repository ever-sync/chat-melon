-- ============================================
-- CORREÇÃO DEFINITIVA: Pipeline RLS (Erro 403)
-- ============================================
-- PROBLEMA: A política original usa FOR ALL USING() sem WITH CHECK()
-- Para INSERT, o PostgreSQL precisa de WITH CHECK para validar a nova linha.
-- SOLUÇÃO: Recriar as políticas corretamente.

-- ========== PIPELINES ==========

-- 1. Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Users can view pipelines in their company" ON pipelines;
DROP POLICY IF EXISTS "Admins can manage pipelines" ON pipelines;
DROP POLICY IF EXISTS "Admins can insert pipelines" ON pipelines;
DROP POLICY IF EXISTS "Admins can update pipelines" ON pipelines;
DROP POLICY IF EXISTS "Admins can delete pipelines" ON pipelines;
DROP POLICY IF EXISTS "Users can manage company pipelines" ON pipelines;
DROP POLICY IF EXISTS "pipelines_select_policy" ON pipelines;
DROP POLICY IF EXISTS "pipelines_insert_policy" ON pipelines;
DROP POLICY IF EXISTS "pipelines_update_policy" ON pipelines;
DROP POLICY IF EXISTS "pipelines_delete_policy" ON pipelines;

-- 2. Criar política de SELECT (visualização)
CREATE POLICY "pipelines_select_policy" ON pipelines
  FOR SELECT 
  USING (
    company_id IN (
      SELECT p.company_id FROM profiles p WHERE p.id = auth.uid()
    )
  );

-- 3. Criar política de INSERT (criação) - usa WITH CHECK
CREATE POLICY "pipelines_insert_policy" ON pipelines
  FOR INSERT 
  WITH CHECK (
    company_id IN (
      SELECT p.company_id FROM profiles p WHERE p.id = auth.uid()
    )
  );

-- 4. Criar política de UPDATE (edição)
CREATE POLICY "pipelines_update_policy" ON pipelines
  FOR UPDATE 
  USING (
    company_id IN (
      SELECT p.company_id FROM profiles p WHERE p.id = auth.uid()
    )
  );

-- 5. Criar política de DELETE (exclusão)
CREATE POLICY "pipelines_delete_policy" ON pipelines
  FOR DELETE 
  USING (
    company_id IN (
      SELECT p.company_id FROM profiles p WHERE p.id = auth.uid()
    )
  );

-- ========== PIPELINE_STAGES ==========

DROP POLICY IF EXISTS "Users can view stages in their company" ON pipeline_stages;
DROP POLICY IF EXISTS "Admins can manage stages" ON pipeline_stages;
DROP POLICY IF EXISTS "Admins can insert stages" ON pipeline_stages;
DROP POLICY IF EXISTS "Admins can update stages" ON pipeline_stages;
DROP POLICY IF EXISTS "Admins can delete stages" ON pipeline_stages;
DROP POLICY IF EXISTS "Users can manage company stages" ON pipeline_stages;
DROP POLICY IF EXISTS "stages_select_policy" ON pipeline_stages;
DROP POLICY IF EXISTS "stages_insert_policy" ON pipeline_stages;
DROP POLICY IF EXISTS "stages_update_policy" ON pipeline_stages;
DROP POLICY IF EXISTS "stages_delete_policy" ON pipeline_stages;

CREATE POLICY "stages_select_policy" ON pipeline_stages
  FOR SELECT 
  USING (
    pipeline_id IN (
      SELECT pl.id FROM pipelines pl 
      JOIN profiles p ON p.company_id = pl.company_id 
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "stages_insert_policy" ON pipeline_stages
  FOR INSERT 
  WITH CHECK (
    pipeline_id IN (
      SELECT pl.id FROM pipelines pl 
      JOIN profiles p ON p.company_id = pl.company_id 
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "stages_update_policy" ON pipeline_stages
  FOR UPDATE 
  USING (
    pipeline_id IN (
      SELECT pl.id FROM pipelines pl 
      JOIN profiles p ON p.company_id = pl.company_id 
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "stages_delete_policy" ON pipeline_stages
  FOR DELETE 
  USING (
    pipeline_id IN (
      SELECT pl.id FROM pipelines pl 
      JOIN profiles p ON p.company_id = pl.company_id 
      WHERE p.id = auth.uid()
    )
  );

-- Confirmar sucesso
DO $$ BEGIN RAISE NOTICE '✅ Políticas RLS de Pipelines corrigidas!'; END $$;

