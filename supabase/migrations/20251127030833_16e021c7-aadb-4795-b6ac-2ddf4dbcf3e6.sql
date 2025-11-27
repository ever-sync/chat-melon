-- Corrige search_path das funções da Fase 3
ALTER FUNCTION auto_send_satisfaction_survey() SET search_path = 'public';
ALTER FUNCTION auto_update_lead_score_from_message() SET search_path = 'public';
ALTER FUNCTION auto_update_lead_score_from_deal() SET search_path = 'public';
ALTER FUNCTION detect_duplicates_all_companies() SET search_path = 'public';