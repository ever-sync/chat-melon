-- Corrigir RLS policy de INSERT na tabela companies
DROP POLICY IF EXISTS "Authenticated users can create companies" ON companies;

DROP POLICY IF EXISTS "Users can create companies for themselves" ON companies;
CREATE POLICY "Users can create companies for themselves"
ON companies FOR INSERT
WITH CHECK (auth.uid() = created_by);