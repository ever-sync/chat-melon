-- Função para criar automaticamente uma conversa quando uma mensagem é inserida
-- e a conversa ainda não existe

CREATE OR REPLACE FUNCTION auto_create_conversation_from_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se a conversation_id já existe
  IF NOT EXISTS (
    SELECT 1 FROM conversations WHERE id = NEW.conversation_id
  ) THEN
    -- Criar a conversa automaticamente
    INSERT INTO conversations (
      id,
      company_id,
      user_id,
      contact_name,
      contact_number,
      last_message,
      last_message_time,
      unread_count,
      status,
      created_at,
      updated_at
    ) VALUES (
      NEW.conversation_id,
      NEW.company_id,
      NEW.user_id,
      'Contato ' || SUBSTRING(NEW.conversation_id::text, 1, 8),
      'Sem Número',
      NEW.content,
      NEW.timestamp,
      CASE WHEN NEW.is_from_me THEN 0 ELSE 1 END,
      'active',
      NEW.created_at,
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  ELSE
    -- Atualizar a conversa existente
    UPDATE conversations
    SET
      last_message = NEW.content,
      last_message_time = NEW.timestamp,
      unread_count = CASE
        WHEN NEW.is_from_me THEN unread_count
        ELSE unread_count + 1
      END,
      updated_at = NOW()
    WHERE id = NEW.conversation_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar o trigger
DROP TRIGGER IF EXISTS trigger_auto_create_conversation ON messages;
CREATE TRIGGER trigger_auto_create_conversation
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_conversation_from_message();

-- Comentário explicativo
COMMENT ON FUNCTION auto_create_conversation_from_message() IS
'Cria automaticamente uma conversa quando uma mensagem é inserida e a conversa ainda não existe. Também atualiza a última mensagem e contador de não lidas.';
