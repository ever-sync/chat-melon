-- =====================================================
-- Trigger automático para registrar atividades de deals
-- =====================================================

-- Função para registrar criação de deal
CREATE OR REPLACE FUNCTION log_deal_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO deal_activities (
    deal_id,
    user_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    NEW.id,
    auth.uid(),
    'created',
    'Negócio criado',
    jsonb_build_object(
      'title', NEW.title,
      'value', NEW.value,
      'stage_id', NEW.stage_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para registrar atualização de deal
CREATE OR REPLACE FUNCTION log_deal_updated()
RETURNS TRIGGER AS $$
DECLARE
  changes jsonb := '{}'::jsonb;
  activity_desc text;
BEGIN
  -- Detectar mudanças e construir descrição
  IF OLD.title != NEW.title THEN
    changes := changes || jsonb_build_object('title', jsonb_build_object('old', OLD.title, 'new', NEW.title));
  END IF;

  IF OLD.value != NEW.value OR (OLD.value IS NULL AND NEW.value IS NOT NULL) OR (OLD.value IS NOT NULL AND NEW.value IS NULL) THEN
    changes := changes || jsonb_build_object('value', jsonb_build_object('old', OLD.value, 'new', NEW.value));
  END IF;

  IF OLD.probability != NEW.probability OR (OLD.probability IS NULL AND NEW.probability IS NOT NULL) OR (OLD.probability IS NOT NULL AND NEW.probability IS NULL) THEN
    changes := changes || jsonb_build_object('probability', jsonb_build_object('old', OLD.probability, 'new', NEW.probability));
  END IF;

  IF OLD.priority != NEW.priority OR (OLD.priority IS NULL AND NEW.priority IS NOT NULL) OR (OLD.priority IS NOT NULL AND NEW.priority IS NULL) THEN
    changes := changes || jsonb_build_object('priority', jsonb_build_object('old', OLD.priority, 'new', NEW.priority));
  END IF;

  IF OLD.temperature != NEW.temperature OR (OLD.temperature IS NULL AND NEW.temperature IS NOT NULL) OR (OLD.temperature IS NOT NULL AND NEW.temperature IS NULL) THEN
    changes := changes || jsonb_build_object('temperature', jsonb_build_object('old', OLD.temperature, 'new', NEW.temperature));
  END IF;

  IF OLD.expected_close_date != NEW.expected_close_date OR (OLD.expected_close_date IS NULL AND NEW.expected_close_date IS NOT NULL) OR (OLD.expected_close_date IS NOT NULL AND NEW.expected_close_date IS NULL) THEN
    changes := changes || jsonb_build_object('expected_close_date', jsonb_build_object('old', OLD.expected_close_date, 'new', NEW.expected_close_date));
  END IF;

  -- Mudança de etapa (stage)
  IF OLD.stage_id != NEW.stage_id THEN
    -- Buscar nome da nova etapa
    DECLARE
      stage_name text;
    BEGIN
      SELECT name INTO stage_name FROM pipeline_stages WHERE id = NEW.stage_id;

      INSERT INTO deal_activities (
        deal_id,
        user_id,
        activity_type,
        description,
        metadata
      ) VALUES (
        NEW.id,
        auth.uid(),
        'stage_change',
        'Etapa alterada',
        jsonb_build_object(
          'old_stage_id', OLD.stage_id,
          'new_stage_id', NEW.stage_id,
          'stage_name', stage_name
        )
      );
    END;
  END IF;

  -- Se houve mudanças além de stage, registrar update
  IF changes != '{}'::jsonb THEN
    -- Construir descrição resumida
    activity_desc := 'Negócio atualizado';

    IF changes ? 'value' THEN
      activity_desc := 'Valor do negócio alterado';
    ELSIF changes ? 'priority' THEN
      activity_desc := 'Prioridade alterada';
    ELSIF changes ? 'temperature' THEN
      activity_desc := 'Temperatura alterada';
    END IF;

    INSERT INTO deal_activities (
      deal_id,
      user_id,
      activity_type,
      description,
      metadata
    ) VALUES (
      NEW.id,
      auth.uid(),
      'updated',
      activity_desc,
      changes
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar triggers
DROP TRIGGER IF EXISTS trigger_log_deal_created ON deals;
CREATE TRIGGER trigger_log_deal_created
  AFTER INSERT ON deals
  FOR EACH ROW
  EXECUTE FUNCTION log_deal_created();

DROP TRIGGER IF EXISTS trigger_log_deal_updated ON deals;
CREATE TRIGGER trigger_log_deal_updated
  AFTER UPDATE ON deals
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION log_deal_updated();

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Triggers de atividades de deals criados!';
  RAISE NOTICE '📝 Atividades serão registradas automaticamente';
END $$;
