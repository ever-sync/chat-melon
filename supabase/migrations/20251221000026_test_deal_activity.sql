-- =====================================================
-- Criar atividade de teste para verificar se timeline funciona
-- =====================================================

-- Inserir uma atividade de teste para o primeiro deal encontrado
DO $$
DECLARE
  first_deal_id UUID;
  test_user_id UUID;
BEGIN
  -- Pegar o primeiro deal
  SELECT id INTO first_deal_id FROM deals LIMIT 1;

  -- Pegar um user_id válido
  SELECT id INTO test_user_id FROM profiles LIMIT 1;

  -- Se existir um deal, criar atividade de teste
  IF first_deal_id IS NOT NULL THEN
    INSERT INTO deal_activities (
      deal_id,
      user_id,
      activity_type,
      description,
      metadata
    ) VALUES (
      first_deal_id,
      test_user_id,
      'created',
      'Negócio criado (teste)',
      jsonb_build_object('test', true)
    );

    RAISE NOTICE '✅ Atividade de teste criada para deal %', first_deal_id;
  ELSE
    RAISE NOTICE '⚠️  Nenhum deal encontrado para criar atividade de teste';
  END IF;
END $$;
