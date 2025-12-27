-- =====================================================
-- EXECUTAR ESTE SQL NO SUPABASE SQL EDITOR
-- =====================================================
-- Este script cria um trigger para sincronizar automaticamente
-- o nome do contato em todas as conversas quando alterado
-- =====================================================

-- 1. Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_contact_name_updated ON contacts;

-- 2. Remover função antiga se existir
DROP FUNCTION IF EXISTS sync_contact_name_to_conversations();

-- 3. Criar função para sincronizar o nome do contato
CREATE OR REPLACE FUNCTION sync_contact_name_to_conversations()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o nome foi alterado, atualizar em todas as conversas deste contato
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    UPDATE conversations
    SET contact_name = COALESCE(NEW.name, NEW.phone, 'Sem nome'),
        updated_at = NOW()
    WHERE contact_id = NEW.id;

    -- Log para debug (opcional)
    RAISE NOTICE 'Nome do contato % atualizado de "%" para "%" em % conversas',
      NEW.id, OLD.name, NEW.name,
      (SELECT COUNT(*) FROM conversations WHERE contact_id = NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar trigger para executar a função após UPDATE
CREATE TRIGGER on_contact_name_updated
  AFTER UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION sync_contact_name_to_conversations();

-- 5. Comentário explicativo
COMMENT ON FUNCTION sync_contact_name_to_conversations() IS
  'Sincroniza automaticamente o nome do contato para todas as conversas quando atualizado na tabela contacts';

-- 6. Sincronizar nomes existentes (uma única vez)
-- Este comando atualiza todas as conversas que têm nomes desatualizados ou NULL
UPDATE conversations c
SET contact_name = COALESCE(ct.name, ct.phone, 'Sem nome')
FROM contacts ct
WHERE c.contact_id = ct.id
  AND (c.contact_name IS NULL OR c.contact_name IS DISTINCT FROM ct.name);

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
-- Após executar este script:
-- 1. Sempre que um nome de contato for alterado na tabela contacts
-- 2. Todas as conversas desse contato serão atualizadas automaticamente
-- 3. O nome aparecerá correto tanto no lado direito quanto no lado esquerdo
-- =====================================================
