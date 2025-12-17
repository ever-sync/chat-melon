-- Migration: 20251217000009_fix_channel_type_enum.sql

-- 1. Normalizar status inválidos que impedem UPDATEs na tabela conversations
-- Isso é necessário porque triggers de validação podem falhar se o status for inválido
UPDATE conversations
SET status = 'closed'
WHERE status::text = 'resolved';

UPDATE conversations
SET status = 'active'
WHERE status::text = 'open';

UPDATE conversations
SET status = 'waiting'
WHERE status::text = 'pending';

-- 2. Garantir que todos os channel_types sejam válidos antes da conversão
-- Transforma qualquer valor desconhecido em 'whatsapp' (default seguro)
UPDATE conversations
SET channel_type = 'whatsapp'
WHERE channel_type::text NOT IN (
  'whatsapp', 'instagram', 'messenger', 'telegram', 'widget', 'email', 'sms', 'voice_call'
);

-- 3. Remover default antigo para evitar erro de cast (Fix erro 42804)
ALTER TABLE conversations 
ALTER COLUMN channel_type DROP DEFAULT;

-- 4. Agora é seguro converter a coluna para ENUM
-- Usamos USING para fazer o cast explícito
ALTER TABLE conversations
ALTER COLUMN channel_type TYPE channel_type 
USING channel_type::channel_type;

-- 5. Definir valor padrão como 'whatsapp' (agora tipado corretamente)
ALTER TABLE conversations
ALTER COLUMN channel_type SET DEFAULT 'whatsapp'::channel_type;
