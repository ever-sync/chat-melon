DROP TRIGGER IF EXISTS trigger_update_score_on_deal ON deals;
DROP TRIGGER IF EXISTS trigger_update_score_on_deal ON deals;
-- ============================================
-- FASE 3: AUTOMAÇÕES UX (FINAL)
-- ============================================

-- 1. TRIGGER AUTOMÁTICO DE SATISFAÇÃO
-- Envia pesquisa CSAT/NPS quando conversa é resolvida
CREATE OR REPLACE FUNCTION auto_send_satisfaction_survey()
RETURNS TRIGGER AS $$
DECLARE
  v_settings RECORD;
BEGIN
  -- Só processa se mudou para 'resolved'
  IF NEW.status = 'resolved' AND (OLD.status IS NULL OR OLD.status != 'resolved') THEN
    
    -- Busca configurações da empresa
    SELECT * INTO v_settings
    FROM satisfaction_settings
    WHERE company_id = NEW.company_id AND enabled = true;
    
    -- Se pesquisas estão habilitadas
    IF FOUND THEN
      -- Chama Edge Function para enviar pesquisa
      PERFORM net.http_post(
        url := current_setting('app.supabase_url') || '/functions/v1/send-satisfaction-survey',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.service_role_key')
        ),
        body := jsonb_build_object(
          'conversation_id', NEW.id
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_send_satisfaction ON conversations;
CREATE TRIGGER trigger_auto_send_satisfaction
AFTER UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION auto_send_satisfaction_survey();


-- 2. TRIGGER AUTOMÁTICO DE LEAD SCORE
-- Recalcula score quando dados relevantes mudam

-- Função para recalcular score através da conversa
CREATE OR REPLACE FUNCTION auto_update_lead_score_from_message()
RETURNS TRIGGER AS $$
DECLARE
  v_contact_id UUID;
BEGIN
  -- Busca contact_id através da conversation_id
  SELECT contact_id INTO v_contact_id
  FROM conversations
  WHERE id = NEW.conversation_id;
  
  -- Se encontrou contato e é mensagem recebida
  IF v_contact_id IS NOT NULL AND NEW.is_from_me = false THEN
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/calculate-lead-score',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object(
        'contact_id', v_contact_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para recalcular score através do deal
CREATE OR REPLACE FUNCTION auto_update_lead_score_from_deal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contact_id IS NOT NULL THEN
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/calculate-lead-score',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object(
        'contact_id', NEW.contact_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger em mensagens
DROP TRIGGER IF EXISTS trigger_update_score_on_message ON messages;
CREATE TRIGGER trigger_update_score_on_message
AFTER INSERT ON messages
FOR EACH ROW
WHEN (NEW.is_from_me = false)
EXECUTE FUNCTION auto_update_lead_score_from_message();

-- Trigger em deals
DROP TRIGGER IF EXISTS trigger_update_score_on_deal ON deals;
CREATE TRIGGER trigger_update_score_on_deal
AFTER INSERT OR UPDATE ON deals
FOR EACH ROW
EXECUTE FUNCTION auto_update_lead_score_from_deal();


-- 3. FUNÇÃO PARA DETECÇÃO PERIÓDICA DE DUPLICADOS
CREATE OR REPLACE FUNCTION detect_duplicates_all_companies()
RETURNS void AS $$
DECLARE
  v_company RECORD;
BEGIN
  FOR v_company IN 
    SELECT id FROM companies WHERE is_active = true
  LOOP
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/detect-duplicates',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object(
        'company_id', v_company.id
      )
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;