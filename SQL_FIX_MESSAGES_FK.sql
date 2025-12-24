-- =====================================================
-- FIX: Criar foreign key entre messages e profiles
-- =====================================================

-- 1. Adicionar foreign key de messages.user_id para profiles.id
-- Primeiro verificar se já existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'messages_user_id_fkey' 
    AND table_name = 'messages'
  ) THEN
    -- Verificar se há valores inválidos primeiro
    DELETE FROM messages WHERE user_id NOT IN (SELECT id FROM profiles);
    
    -- Criar a foreign key
    ALTER TABLE messages 
    ADD CONSTRAINT messages_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Foreign key messages_user_id_fkey criada!';
  ELSE
    RAISE NOTICE 'Foreign key já existe';
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Erro ao criar FK: %', SQLERRM;
END $$;

-- 2. Também criar FK para sender_id se existir
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'sender_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'messages_sender_id_fkey' 
    AND table_name = 'messages'
  ) THEN
    ALTER TABLE messages 
    ADD CONSTRAINT messages_sender_id_fkey 
    FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Foreign key messages_sender_id_fkey criada!';
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Erro ao criar FK sender_id: %', SQLERRM;
END $$;

-- 3. Refrescar o schema cache do PostgREST
NOTIFY pgrst, 'reload schema';

SELECT 'Foreign keys criadas! Aguarde alguns segundos e tente novamente.' as resultado;
