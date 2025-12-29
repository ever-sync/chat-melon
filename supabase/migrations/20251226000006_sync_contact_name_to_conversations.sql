-- Função para sincronizar o nome do contato para todas as conversas
CREATE OR REPLACE FUNCTION sync_contact_name_to_conversations()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o nome foi alterado, atualizar em todas as conversas
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    UPDATE conversations
    SET contact_name = COALESCE(NEW.name, NEW.phone, 'Sem nome'),
        updated_at = NOW()
    WHERE contact_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para sincronizar automaticamente quando o nome do contato for atualizado
DROP TRIGGER IF EXISTS on_contact_name_updated ON contacts;
CREATE TRIGGER on_contact_name_updated
  AFTER UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION sync_contact_name_to_conversations();

-- Comentário explicativo
COMMENT ON FUNCTION sync_contact_name_to_conversations() IS
  'Sincroniza automaticamente o nome do contato para todas as conversas quando atualizado na tabela contacts';
