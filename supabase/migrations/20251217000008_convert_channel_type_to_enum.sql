-- =====================================================
-- PARTE 2: Converter channel_type de VARCHAR para ENUM
-- =====================================================
-- Deve ser executada APÓS a adição de valores ao ENUM

BEGIN;

INSERT INTO error_fix_log (error_number, error_name, status)
VALUES (3, 'channel_type_conversion', 'started');

DO $$
DECLARE
  v_current_type TEXT;
  v_updated_count INTEGER;
BEGIN
  -- Verificar tipo atual
  SELECT data_type INTO v_current_type
  FROM information_schema.columns
  WHERE table_name = 'conversations' AND column_name = 'channel_type';

  RAISE NOTICE 'Tipo atual de channel_type: %', COALESCE(v_current_type, 'NÃO EXISTE');

  -- Se já é ENUM, success
  IF v_current_type = 'USER-DEFINED' THEN
    RAISE NOTICE '✅ channel_type já é ENUM';

    INSERT INTO error_fix_log (error_number, error_name, status)
    VALUES (3, 'channel_type_conversion', 'completed');

    RETURN;
  END IF;

  -- Se é VARCHAR, converter
  IF v_current_type = 'character varying' THEN
    RAISE NOTICE 'Iniciando conversão VARCHAR → ENUM...';

    -- Criar coluna temporária
    ALTER TABLE conversations
      ADD COLUMN IF NOT EXISTS channel_type_temp channel_type DEFAULT 'whatsapp';

    -- Copiar e normalizar dados
    UPDATE conversations
    SET channel_type_temp = CASE
      WHEN LOWER(COALESCE(channel_type, '')) IN ('whatsapp', 'wa', '') THEN 'whatsapp'::channel_type
      WHEN LOWER(channel_type) IN ('instagram', 'ig') THEN 'instagram'::channel_type
      WHEN LOWER(channel_type) IN ('messenger', 'fb', 'facebook') THEN 'messenger'::channel_type
      WHEN LOWER(channel_type) IN ('telegram', 'tg') THEN 'telegram'::channel_type
      WHEN LOWER(channel_type) = 'widget' THEN 'widget'::channel_type
      WHEN LOWER(channel_type) IN ('email', 'mail') THEN 'email'::channel_type
      WHEN LOWER(channel_type) = 'sms' THEN 'sms'::channel_type
      WHEN LOWER(channel_type) IN ('voice_call', 'call', 'phone') THEN 'voice_call'::channel_type
      ELSE 'whatsapp'::channel_type
    END;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RAISE NOTICE '✅ % registros copiados', v_updated_count;

    -- Drop antiga
    ALTER TABLE conversations DROP COLUMN channel_type;
    RAISE NOTICE '✅ Coluna antiga removida';

    -- Rename
    ALTER TABLE conversations RENAME COLUMN channel_type_temp TO channel_type;
    RAISE NOTICE '✅ Coluna renomeada';

    -- Comentário
    COMMENT ON COLUMN conversations.channel_type IS
      'Canal de origem da conversa (ENUM: whatsapp, instagram, messenger, telegram, widget, email, sms, voice_call)';

    -- Log sucesso
    INSERT INTO error_fix_log (error_number, error_name, status)
    VALUES (3, 'channel_type_conversion', 'completed');

    RAISE NOTICE '';
    RAISE NOTICE '🎉 ERRO #3 CORRIGIDO!';
    RAISE NOTICE '   channel_type: VARCHAR → ENUM';
    RAISE NOTICE '   Sistema multi-channel: OPERACIONAL';
    RAISE NOTICE '';

  ELSE
    RAISE EXCEPTION 'Tipo inesperado: %', v_current_type;
  END IF;

EXCEPTION WHEN OTHERS THEN
  INSERT INTO error_fix_log (error_number, error_name, status, error_message)
  VALUES (3, 'channel_type_conversion', 'failed', SQLERRM);

  RAISE NOTICE '❌ ERRO #3 falhou: %', SQLERRM;
  RAISE;
END $$;

COMMIT;
