-- =====================================================
-- Corrigir trigger de SLA que usa closed_at
-- =====================================================

-- Dropar trigger e função antigas
DROP TRIGGER IF EXISTS check_resolution_sla_trigger ON conversations;
DROP FUNCTION IF EXISTS check_resolution_sla();

-- Recriar função sem usar closed_at (usar resolved_at em vez)
CREATE OR REPLACE FUNCTION check_resolution_sla()
RETURNS TRIGGER AS $$
BEGIN
  -- Se está mudando para status 'closed', verificar SLA
  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    -- Usar resolved_at em vez de closed_at
    NEW.resolved_at = NOW();

    -- Verificar se SLA foi cumprida
    IF NEW.sla_resolution_at IS NOT NULL THEN
      NEW.sla_resolution_met = (NEW.resolved_at <= NEW.sla_resolution_at);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger
CREATE TRIGGER check_resolution_sla_trigger
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION check_resolution_sla();

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger de SLA corrigido!';
  RAISE NOTICE '🔧 Agora usa resolved_at em vez de closed_at';
END $$;
