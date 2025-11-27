-- Criar trigger para executar playbooks quando deal muda de stage
CREATE OR REPLACE FUNCTION trigger_playbooks_on_stage_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_playbook RECORD;
BEGIN
  -- Verifica se houve mudança de stage
  IF OLD.stage_id IS DISTINCT FROM NEW.stage_id THEN
    -- Busca playbooks ativos com trigger de mudança de stage
    FOR active_playbook IN
      SELECT * FROM playbooks
      WHERE trigger_type = 'stage_change'
      AND is_active = true
      AND company_id = NEW.company_id
      AND (
        trigger_config->>'target_stage_id' = NEW.stage_id::text
        OR trigger_config->>'target_stage_id' IS NULL
      )
    LOOP
      -- Cria execução do playbook
      INSERT INTO playbook_executions (
        playbook_id,
        deal_id,
        triggered_by,
        status,
        current_step,
        started_at
      ) VALUES (
        active_playbook.id,
        NEW.id,
        auth.uid(),
        'running',
        0,
        NOW()
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Remove trigger anterior se existir
DROP TRIGGER IF EXISTS on_deal_stage_change ON deals;

-- Cria o trigger
CREATE TRIGGER on_deal_stage_change
  AFTER UPDATE ON deals
  FOR EACH ROW
  WHEN (OLD.stage_id IS DISTINCT FROM NEW.stage_id)
  EXECUTE FUNCTION trigger_playbooks_on_stage_change();