-- Migration: 20251224000000_fix_goals_updated_at.sql
-- Fixes the error: column "updated_at" of relation "goals" does not exist

-- 1. Add updated_at to goals table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'goals' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.goals ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- 2. Add updated_at to achievements table (it was also missing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'achievements' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.achievements ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- 3. Re-ensure the updated_at trigger exists for goals
DROP TRIGGER IF EXISTS update_goals_updated_at ON public.goals;
CREATE TRIGGER update_goals_updated_at
    BEFORE UPDATE ON public.goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Ensure the updated_at trigger exists for achievements
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_achievements_updated_at ON public.achievements;
CREATE TRIGGER update_achievements_updated_at
    BEFORE UPDATE ON public.achievements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
