-- VERIFICAÇÃO DE PERMISSÕES E RLS
-- Vamos confirmar se SEU usuário pode ver dados da empresa EverSync

-- 1. Pegar o ID da empresa EverSync
SELECT id as eversync_id, name FROM companies WHERE name = 'EverSync';

-- 2. Verificar se seu usuário está vinculado a essa empresa
-- Substitua o ID abaixo pelo ID da empresa retornado no passo 1
SELECT * FROM company_members 
WHERE company_id = (SELECT id FROM companies WHERE name = 'EverSync')
AND user_id = auth.uid();

-- 3. Tentar ler as mensagens simulando seu usuário (se possível via SQL Editor)
-- Nota: O SQL Editor roda como superusuário, então sempre vê tudo.
-- Mas podemos verificar se a política está ativa:
SELECT * FROM pg_policies WHERE tablename = 'messages';
