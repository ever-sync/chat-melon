-- =====================================================
-- Popular atividades de deals existentes
-- Criar atividade "created" para deals que não têm nenhuma atividade
-- =====================================================

-- Inserir atividade de criação para deals que ainda não têm atividades
INSERT INTO deal_activities (
  deal_id,
  user_id,
  activity_type,
  description,
  metadata,
  created_at
)
SELECT
  d.id as deal_id,
  d.assigned_to as user_id, -- Usar assigned_to como fallback
  'created' as activity_type,
  'Negócio criado' as description,
  jsonb_build_object(
    'title', d.title,
    'value', d.value,
    'stage_id', d.stage_id,
    'imported', true
  ) as metadata,
  d.created_at as created_at
FROM deals d
WHERE NOT EXISTS (
  SELECT 1
  FROM deal_activities da
  WHERE da.deal_id = d.id
)
AND d.created_at IS NOT NULL;

-- Mensagem de resultado
DO $$
DECLARE
  inserted_count integer;
BEGIN
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RAISE NOTICE '✅ Criadas % atividades para deals existentes', inserted_count;
END $$;
