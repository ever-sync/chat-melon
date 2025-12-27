-- =====================================================
-- EXECUTAR ESTE SQL NO SUPABASE SQL EDITOR
-- =====================================================
-- Este script corrige conversas com contact_name NULL
-- =====================================================

-- 1. Corrigir conversas com contact_name NULL
-- Atualiza usando o nome do contato, ou telefone, ou 'Sem nome'
UPDATE conversations c
SET contact_name = COALESCE(ct.name, ct.phone, c.contact_number, 'Sem nome')
FROM contacts ct
WHERE c.contact_id = ct.id
  AND c.contact_name IS NULL;

-- 2. Verificar se ainda há conversas com contact_name NULL
SELECT
  COUNT(*) as total_null_names,
  COUNT(DISTINCT contact_id) as unique_contacts
FROM conversations
WHERE contact_name IS NULL;

-- 3. Se ainda houver NULL (contatos sem registro na tabela contacts),
-- usar o número de telefone como fallback
UPDATE conversations
SET contact_name = COALESCE(contact_number, 'Sem nome')
WHERE contact_name IS NULL;

-- 4. Verificar resultado final
SELECT
  COUNT(*) as total_conversations,
  COUNT(*) FILTER (WHERE contact_name IS NULL) as null_names,
  COUNT(*) FILTER (WHERE contact_name IS NOT NULL) as valid_names
FROM conversations;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
-- Após executar:
-- - Todas as conversas devem ter contact_name preenchido
-- - Nenhuma conversa deve ter contact_name NULL
-- =====================================================
