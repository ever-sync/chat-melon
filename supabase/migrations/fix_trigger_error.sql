-- ===========================================
-- CORREÇÃO DA CONSTRAINT QUEBRADA
-- O erro diz que 'resolved' é inválido para o enum conversation_status
-- ===========================================

-- 1. Verificar valores válidos do enum
SELECT enum_range(NULL::conversation_status);

-- 2. Corrigir a função check_resolution_sla (que está causando o erro)
-- Vamos recriá-la usando apenas 'closed' se 'resolved' não existir no enum
CREATE OR REPLACE FUNCTION check_resolution_sla()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o status mudou para 'closed', marca data de resolução
    IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
        NEW.closed_at = NOW();
        
        -- Verifica SLA de resolução se existir data limite
        IF NEW.sla_resolution_at IS NOT NULL THEN
            NEW.sla_resolution_met = (NEW.closed_at <= NEW.sla_resolution_at);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
