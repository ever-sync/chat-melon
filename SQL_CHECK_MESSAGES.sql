-- =====================================================
-- DIAGNÓSTICO: Verificar mensagens
-- =====================================================

-- 1. Quantas mensagens existem no total?
SELECT 'Total mensagens' as metrica, COUNT(*) as valor FROM messages;

-- 2. Mensagens da conversa selecionada (Ever Sync Technology)
-- Primeiro, encontrar a conversa
SELECT 
  c.id as conversation_id,
  c.contact_id,
  co.name as contact_name,
  c.status,
  c.assigned_to,
  (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as total_messages
FROM conversations c
LEFT JOIN contacts co ON c.contact_id = co.id
WHERE co.name ILIKE '%ever%' OR co.name ILIKE '%sync%'
LIMIT 5;

-- 3. Ver RLS policies da tabela messages
SELECT 
  policyname,
  tablename,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'messages';
