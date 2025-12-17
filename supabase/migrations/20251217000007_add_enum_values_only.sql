-- =====================================================
-- PARTE 1: Adicionar valores faltantes ao ENUM
-- =====================================================
-- Deve ser executada ANTES da conversão

DO $$
BEGIN
  -- Adicionar 'sms'
  BEGIN
    ALTER TYPE channel_type ADD VALUE IF NOT EXISTS 'sms';
    RAISE NOTICE '✅ Valor "sms" adicionado ao ENUM channel_type';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE '⏭️  Valor "sms" já existe no ENUM';
  END;

  -- Adicionar 'voice_call'
  BEGIN
    ALTER TYPE channel_type ADD VALUE IF NOT EXISTS 'voice_call';
    RAISE NOTICE '✅ Valor "voice_call" adicionado ao ENUM channel_type';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE '⏭️  Valor "voice_call" já existe no ENUM';
  END;

  RAISE NOTICE '';
  RAISE NOTICE '✅ ENUM channel_type atualizado com 8 valores';
  RAISE NOTICE '   whatsapp, instagram, messenger, telegram, widget, email, sms, voice_call';
  RAISE NOTICE '';
END $$;
