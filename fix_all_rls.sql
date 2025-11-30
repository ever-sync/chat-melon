-- FIX GERAL DE RLS (CORREÇÃO DE SCHEMA)
-- Problema: As regras de segurança (RLS) estão procurando a tabela antiga 'company_users'.
-- Solução: Atualizar tudo para usar a tabela nova 'company_members'.

-- 1. Corrigir a função que busca a empresa do usuário
CREATE OR REPLACE FUNCTION public.get_user_company(_user_id uuid) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT company_id
  FROM public.company_members
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- 2. Corrigir RLS de CONVERSATIONS
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view conversations in their company" ON conversations;
DROP POLICY IF EXISTS "Users can view conversations in their company conversations" ON conversations;

CREATE POLICY "Users can view conversations in their company" ON conversations
FOR SELECT USING (
  company_id IN (
    SELECT company_id FROM company_members WHERE user_id = auth.uid()
  )
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- 3. Corrigir RLS de MESSAGES (Simplificada e Direta)
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in their company" ON messages;
DROP POLICY IF EXISTS "Users can view messages in their company conversations" ON messages;

-- Nova regra: Se a mensagem é da minha empresa, eu posso ver. Simples.
CREATE POLICY "Users can view messages in their company" ON messages
FOR SELECT USING (
  company_id IN (
    SELECT company_id FROM company_members WHERE user_id = auth.uid()
  )
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 4. Verificação Final
SELECT 'Conversas Visíveis' as teste, count(*) FROM conversations WHERE id = '0291ee3e-47f5-4dc8-95db-341d0eecf7d5'
UNION ALL
SELECT 'Mensagens Visíveis' as teste, count(*) FROM messages WHERE conversation_id = '0291ee3e-47f5-4dc8-95db-341d0eecf7d5';
