-- =====================================================
-- VALIDAÇÃO DAS CORREÇÕES APLICADAS
-- =====================================================
-- Execute este script para verificar se as correções foram aplicadas

-- 1️⃣ Verificar log de correções
SELECT
  error_number,
  error_name,
  status,
  error_message,
  created_at
FROM error_fix_log
ORDER BY error_number, created_at DESC;

-- 2️⃣ Validar coluna messages.sender_id
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'messages' AND column_name = 'sender_id';
-- ✅ Esperado: 1 linha retornada

-- 3️⃣ Validar coluna queues.auto_assign
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'queues' AND column_name = 'auto_assign';
-- ✅ Esperado: 1 linha com default = true

-- 4️⃣ Verificar ENUM channel_type
SELECT
  enumlabel
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'channel_type'
ORDER BY enumsortorder;
-- ✅ Esperado: 8 valores (whatsapp, instagram, messenger, telegram, widget, email, sms, voice_call)

-- 5️⃣ Validar coluna queue_members (user_id ou member_id?)
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'queue_members'
  AND column_name IN ('user_id', 'member_id');
-- ✅ Esperado: Apenas 'user_id' (não 'member_id')

-- 6️⃣ Verificar tabela company_members existe
SELECT
  table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'company_members';
-- ✅ Esperado: 1 linha

-- 7️⃣ Verificar tabela platform_features existe
SELECT COUNT(*) as total_features
FROM platform_features
WHERE is_global_enabled = true;
-- ✅ Esperado: >30 features

-- 8️⃣ Validar contacts.external_id
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'contacts' AND column_name = 'external_id';
-- ✅ Esperado: 1 linha

-- 9️⃣ Verificar status do channel_type em conversations
SELECT
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'conversations' AND column_name = 'channel_type';
-- Verificar se é ENUM ou VARCHAR

-- 🔟 Resumo geral
SELECT
  'messages.sender_id' as correcao,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'sender_id'
  ) THEN '✅ OK' ELSE '❌ FALTANDO' END as status
UNION ALL
SELECT
  'queues.auto_assign',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queues' AND column_name = 'auto_assign'
  ) THEN '✅ OK' ELSE '❌ FALTANDO' END
UNION ALL
SELECT
  'queue_members.user_id',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queue_members' AND column_name = 'user_id'
  ) THEN '✅ OK' ELSE '❌ FALTANDO' END
UNION ALL
SELECT
  'company_members table',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'company_members'
  ) THEN '✅ OK' ELSE '❌ FALTANDO' END
UNION ALL
SELECT
  'platform_features table',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'platform_features'
  ) THEN '✅ OK' ELSE '❌ FALTANDO' END
UNION ALL
SELECT
  'contacts.external_id',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'external_id'
  ) THEN '✅ OK' ELSE '❌ FALTANDO' END;
