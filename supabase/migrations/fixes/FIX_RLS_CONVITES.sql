-- EXECUTE ESTE SQL NO SUPABASE DASHBOARD
-- SQL Editor → Cole este código → Run

-- ==================================================
-- FIX: Erro 406 ao carregar convites
-- ==================================================
-- Este SQL permite que a página de signup leia
-- dados de convites pendentes sem autenticação
-- ==================================================

-- Passo 1: Deletar política antiga (se existir)
DROP POLICY IF EXISTS "allow_public_read_pending_invites" ON public.company_invites;

-- Passo 2: Criar nova política
CREATE POLICY "allow_public_read_pending_invites"
ON public.company_invites
FOR SELECT
TO public
USING (status = 'pending');

-- Passo 3: Garantir que RLS está habilitado
ALTER TABLE public.company_invites ENABLE ROW LEVEL SECURITY;

-- ==================================================
-- Verificar se funcionou
-- ==================================================
-- Execute esta query para testar:
-- SELECT * FROM company_invites WHERE status = 'pending';
--
-- Se retornar os convites pendentes, funcionou!
-- ==================================================
