-- Migration: Auto-sync custom fields with company variables
-- ==========================================
-- This migration creates triggers to automatically sync custom_fields with company_variables
-- When a custom field is created, a corresponding variable is created
-- When a custom field is updated, the variable is updated
-- When a custom field is deleted, the variable is deleted

-- ==========================================
-- 1. Function to sync custom field to variable on INSERT
-- ==========================================
CREATE OR REPLACE FUNCTION sync_custom_field_to_variable_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync contact custom fields (can extend to other entity types later)
  IF NEW.entity_type = 'contact' THEN
    -- Create or update the corresponding variable
    INSERT INTO public.company_variables (
      company_id,
      key,
      label,
      value,
      description
    ) VALUES (
      NEW.company_id,
      NEW.field_name,
      NEW.field_label,
      NEW.default_value,
      'Campo personalizado de contato: ' || NEW.field_label
    )
    ON CONFLICT (company_id, key)
    DO UPDATE SET
      label = EXCLUDED.label,
      value = EXCLUDED.value,
      description = EXCLUDED.description,
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 2. Function to sync custom field to variable on UPDATE
-- ==========================================
CREATE OR REPLACE FUNCTION sync_custom_field_to_variable_on_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync contact custom fields
  IF NEW.entity_type = 'contact' THEN
    -- If field_name changed, delete old variable and create new one
    IF OLD.field_name != NEW.field_name THEN
      -- Delete old variable
      DELETE FROM public.company_variables
      WHERE company_id = OLD.company_id
        AND key = OLD.field_name;

      -- Create new variable
      INSERT INTO public.company_variables (
        company_id,
        key,
        label,
        value,
        description
      ) VALUES (
        NEW.company_id,
        NEW.field_name,
        NEW.field_label,
        NEW.default_value,
        'Campo personalizado de contato: ' || NEW.field_label
      )
      ON CONFLICT (company_id, key)
      DO UPDATE SET
        label = EXCLUDED.label,
        value = EXCLUDED.value,
        description = EXCLUDED.description,
        updated_at = now();
    ELSE
      -- Just update the existing variable
      UPDATE public.company_variables
      SET
        label = NEW.field_label,
        value = NEW.default_value,
        description = 'Campo personalizado de contato: ' || NEW.field_label,
        updated_at = now()
      WHERE company_id = NEW.company_id
        AND key = NEW.field_name;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 3. Function to sync custom field to variable on DELETE
-- ==========================================
CREATE OR REPLACE FUNCTION sync_custom_field_to_variable_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync contact custom fields
  IF OLD.entity_type = 'contact' THEN
    -- Delete the corresponding variable
    DELETE FROM public.company_variables
    WHERE company_id = OLD.company_id
      AND key = OLD.field_name;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 4. Create triggers
-- ==========================================
DROP TRIGGER IF EXISTS sync_custom_field_insert ON public.custom_fields;
CREATE TRIGGER sync_custom_field_insert
  AFTER INSERT ON public.custom_fields
  FOR EACH ROW
  EXECUTE FUNCTION sync_custom_field_to_variable_on_insert();

DROP TRIGGER IF EXISTS sync_custom_field_update ON public.custom_fields;
CREATE TRIGGER sync_custom_field_update
  AFTER UPDATE ON public.custom_fields
  FOR EACH ROW
  EXECUTE FUNCTION sync_custom_field_to_variable_on_update();

DROP TRIGGER IF EXISTS sync_custom_field_delete ON public.custom_fields;
CREATE TRIGGER sync_custom_field_delete
  BEFORE DELETE ON public.custom_fields
  FOR EACH ROW
  EXECUTE FUNCTION sync_custom_field_to_variable_on_delete();

-- ==========================================
-- 5. Migrate existing contact custom fields to variables
-- ==========================================
INSERT INTO public.company_variables (
  company_id,
  key,
  label,
  value,
  description
)
SELECT
  cf.company_id,
  cf.field_name,
  cf.field_label,
  cf.default_value,
  'Campo personalizado de contato: ' || cf.field_label
FROM public.custom_fields cf
WHERE cf.entity_type = 'contact'
  AND cf.is_active = true
ON CONFLICT (company_id, key) DO NOTHING;
