-- Corrigir RLS para permitir leitura pública de convites pendentes
-- Isso resolve o erro 406 ao tentar carregar dados do convite na página de signup

-- Primeiro, deletar a política se ela já existir (ignora erro se não existir)
DROP POLICY IF EXISTS "allow_public_read_pending_invites" ON public.company_invites;

-- Criar a política para permitir leitura de convites pendentes
CREATE POLICY "allow_public_read_pending_invites"
ON public.company_invites
FOR SELECT
TO public
USING (status = 'pending');

-- Garantir que RLS está habilitado
ALTER TABLE public.company_invites ENABLE ROW LEVEL SECURITY;

-- Comentário explicativo
COMMENT ON POLICY "allow_public_read_pending_invites" ON public.company_invites IS
'Permite que usuários não autenticados leiam convites pendentes para completar o signup';
