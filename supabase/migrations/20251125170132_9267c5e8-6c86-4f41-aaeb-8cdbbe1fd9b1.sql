-- Corrigir security warning: adicionar search_path à função
CREATE OR REPLACE FUNCTION trigger_playbooks_on_stage_change()
RETURNS TRIGGER AS $$
DECLARE
  v_playbook RECORD;
BEGIN
  -- Buscar playbooks ativos com trigger de mudança de stage
  FOR v_playbook IN
    SELECT * FROM playbooks
    WHERE company_id = NEW.company_id
      AND is_active = true
      AND trigger_type = 'stage_change'
      AND (
        trigger_config->>'target_stage_id' IS NULL 
        OR trigger_config->>'target_stage_id' = NEW.stage_id::text
      )
  LOOP
    -- Criar execução do playbook
    INSERT INTO playbook_executions (
      playbook_id,
      deal_id,
      status
    ) VALUES (
      v_playbook.id,
      NEW.id,
      'running'
    );
    
    -- Incrementar contador de uso
    UPDATE playbooks
    SET usage_count = usage_count + 1
    WHERE id = v_playbook.id;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';