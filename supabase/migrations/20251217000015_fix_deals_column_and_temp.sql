-- =====================================================
-- FIX MISSING COLUMN 'created_from_conversation_id' AND EXTEND DEALS
-- =====================================================
-- This migration ensures the 'deals' table has the column
-- 'created_from_conversation_id' needed by the 'create_deal_from_conversation' function.
-- It also re-applies the CRM Temperature logic to ensure consistency.
-- =====================================================

-- 1. Add missing column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'deals' AND column_name = 'created_from_conversation_id'
    ) THEN
        ALTER TABLE public.deals ADD COLUMN created_from_conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL;
        COMMENT ON COLUMN public.deals.created_from_conversation_id IS 'ID da conversa que originou o negócio';
    END IF;
END $$;

-- 2. Ensure index for performance
CREATE INDEX IF NOT EXISTS idx_deals_conversation ON public.deals(created_from_conversation_id);

-- 3. Re-apply Temperature Score Function (Idempotent fix)
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
        RETURN 50; 
    END IF;

    IF deal_record.budget_confirmed THEN
        score := score + 20;
    END IF;

    IF deal_record.timeline_confirmed THEN
        score := score + 20;
    END IF;

    IF deal_record.decision_maker IS NOT NULL THEN
        score := score + 10;
    END IF;

    -- FIX: Use EPOCH extraction for accurate total days diff
    IF deal_record.last_activity IS NOT NULL THEN
        days_since_activity := EXTRACT(EPOCH FROM (now() - deal_record.last_activity)) / 86400;
    ELSE
        days_since_activity := 0;
    END IF;

    score := score - LEAST(days_since_activity * 5, 30);

    IF deal_record.expected_close_date IS NOT NULL THEN
        -- FIX: Direct subtraction of dates
        days_to_close := (deal_record.expected_close_date::date - CURRENT_DATE);

        IF days_to_close < 7 AND days_to_close >= 0 THEN
            score := score + 20;
        ELSIF days_to_close < 0 THEN
            score := score - 10;
        END IF;
    END IF;

    score := GREATEST(0, LEAST(100, score));

    RETURN score;
END;
$$ LANGUAGE plpgsql;
