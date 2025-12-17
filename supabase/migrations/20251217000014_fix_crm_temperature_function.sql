-- =====================================================
-- FIX CRM TEMPERATURE SCORE FUNCTION
-- =====================================================
-- This migration fixes the SQL error "function pg_catalog.extract(unknown, integer) does not exist"
-- caused by subtracting Dates (which yields integer) and trying to EXTRACT from it.
-- It also improves the days calculation logic.
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_deal_temperature_score(deal_id uuid)
RETURNS integer AS $$
DECLARE
    score integer := 50; -- Score base
    deal_record record;
    days_since_activity integer;
    days_to_close integer;
BEGIN
    SELECT * INTO deal_record
    FROM public.deals
    WHERE id = deal_id;

    IF NOT FOUND THEN
        RETURN 50; -- Return base score if not found (e.g. during insert if not yet committed)
    END IF;

    -- +20 se orçamento confirmado
    IF deal_record.budget_confirmed THEN
        score := score + 20;
    END IF;

    -- +20 se timeline confirmado
    IF deal_record.timeline_confirmed THEN
        score := score + 20;
    END IF;

    -- +10 se tem tomador de decisão identificado
    IF deal_record.decision_maker IS NOT NULL THEN
        score := score + 10;
    END IF;

    -- Calcular dias desde última atividade
    -- FIX: Use EPOCH extraction for accurate total days diff, handle NULL
    IF deal_record.last_activity IS NOT NULL THEN
        days_since_activity := EXTRACT(EPOCH FROM (now() - deal_record.last_activity)) / 86400;
    ELSE
        days_since_activity := 0;
    END IF;

    -- -5 por cada dia sem atividade (max -30)
    score := score - LEAST(days_since_activity * 5, 30);

    -- Calcular dias até fechamento esperado
    IF deal_record.expected_close_date IS NOT NULL THEN
        -- FIX: Direct subtraction of dates yields integer days in Postgres
        -- Cast to DATE to ensure type safety in case column is timestamp
        days_to_close := (deal_record.expected_close_date::date - CURRENT_DATE);

        -- +20 se está próximo do fechamento (< 7 dias)
        IF days_to_close < 7 AND days_to_close >= 0 THEN
            score := score + 20;
        -- -10 se passou da data esperada
        ELSIF days_to_close < 0 THEN
            score := score - 10;
        END IF;
    END IF;

    -- Garantir que está entre 0 e 100
    score := GREATEST(0, LEAST(100, score));

    RETURN score;
END;
$$ LANGUAGE plpgsql;
