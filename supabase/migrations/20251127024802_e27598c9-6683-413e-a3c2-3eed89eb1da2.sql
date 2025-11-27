-- Trigger para atualização automática de metas quando deal é fechado
CREATE OR REPLACE FUNCTION update_goals_on_deal_won()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas processar se o deal foi ganho
  IF NEW.status = 'won' AND (OLD.status IS NULL OR OLD.status != 'won') THEN
    -- Atualizar goals de receita do usuário responsável
    UPDATE goals
    SET current_value = current_value + COALESCE(NEW.value, 0),
        updated_at = NOW()
    WHERE user_id = NEW.assigned_to
      AND goal_type = 'revenue'
      AND status = 'active'
      AND start_date <= CURRENT_DATE
      AND end_date >= CURRENT_DATE;
    
    -- Atualizar goals de número de deals do usuário responsável
    UPDATE goals
    SET current_value = current_value + 1,
        updated_at = NOW()
    WHERE user_id = NEW.assigned_to
      AND goal_type = 'deals'
      AND status = 'active'
      AND start_date <= CURRENT_DATE
      AND end_date >= CURRENT_DATE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
DROP TRIGGER IF EXISTS on_deal_won ON deals;
CREATE TRIGGER on_deal_won
  AFTER UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION update_goals_on_deal_won();