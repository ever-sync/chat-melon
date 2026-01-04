-- Migration to enhance chat widget settings for premium design and custom fields
-- Date: 2026-01-04

-- Add new columns for advanced personalization if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'widget_settings' AND COLUMN_NAME = 'header_gradient') THEN
        ALTER TABLE public.widget_settings ADD COLUMN header_gradient text DEFAULT 'linear-gradient(135deg, #22C55E 0%, #15803d 100%)';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'widget_settings' AND COLUMN_NAME = 'bubble_gradient') THEN
        ALTER TABLE public.widget_settings ADD COLUMN bubble_gradient text DEFAULT 'linear-gradient(135deg, #22C55E 0%, #15803d 100%)';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'widget_settings' AND COLUMN_NAME = 'shadow_intensity') THEN
        ALTER TABLE public.widget_settings ADD COLUMN shadow_intensity text DEFAULT 'medium'; -- none, low, medium, high
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'widget_settings' AND COLUMN_NAME = 'font_family') THEN
        ALTER TABLE public.widget_settings ADD COLUMN font_family text DEFAULT 'Inter';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'widget_settings' AND COLUMN_NAME = 'welcome_image_url') THEN
        ALTER TABLE public.widget_settings ADD COLUMN welcome_image_url text;
    END IF;
END $$;

-- Ensure custom_fields column exists (already does, but for safety)
-- ALTER TABLE public.widget_settings ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '[]'::jsonb;

-- Comment for documentation
COMMENT ON COLUMN public.widget_settings.header_gradient IS 'CSS gradient for the widget header';
COMMENT ON COLUMN public.widget_settings.bubble_gradient IS 'CSS gradient for the floating bubble';
COMMENT ON COLUMN public.widget_settings.shadow_intensity IS 'The intensity of shadows in the widget';
COMMENT ON COLUMN public.widget_settings.font_family IS 'The font family used in the widget';
