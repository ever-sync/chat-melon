-- Migration: Add entity_icon to product_settings
-- Created to fix "Could not find the 'entity_icon' column of 'product_settings'" error

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'product_settings' AND column_name = 'entity_icon') THEN
        ALTER TABLE public.product_settings ADD COLUMN entity_icon TEXT DEFAULT 'Package';
    END IF;
END $$;

-- Also ensure other potentially missing columns exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'product_settings' AND column_name = 'entity_name') THEN
        ALTER TABLE public.product_settings ADD COLUMN entity_name TEXT DEFAULT 'Produto';
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'product_settings' AND column_name = 'entity_name_plural') THEN
        ALTER TABLE public.product_settings ADD COLUMN entity_name_plural TEXT DEFAULT 'Produtos';
    END IF;
END $$;
