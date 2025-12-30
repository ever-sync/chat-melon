-- Migration: Add settings column to pipelines table
-- This allows storing advanced configuration for each pipeline

-- Add settings column to pipelines table
ALTER TABLE public.pipelines
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.pipelines.settings IS 'JSON configuration for pipeline settings including automations, notifications, email, display options, and integrations';

-- Create index for settings queries (useful for filtering by specific settings)
CREATE INDEX IF NOT EXISTS idx_pipelines_settings ON public.pipelines USING GIN (settings);
