-- Migration to fix RLS policies for custom_fields and custom_field_values
-- Replacing get_user_company() and has_role() with direct company_members checks for better compatibility

-- 1. Fix custom_fields
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view custom fields in their company" ON public.custom_fields;
DROP POLICY IF EXISTS "Admins can manage custom fields" ON public.custom_fields;
DROP POLICY IF EXISTS "Users can manage custom fields" ON public.custom_fields;

CREATE POLICY "Users can manage custom fields"
  ON public.custom_fields FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.company_members
      WHERE user_id = auth.uid()
        AND company_id = public.custom_fields.company_id
        AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_members
      WHERE user_id = auth.uid()
        AND company_id = public.custom_fields.company_id
        AND is_active = true
    )
  );

-- 2. Fix custom_field_values
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view custom field values in their company" ON public.custom_field_values;
DROP POLICY IF EXISTS "Users can manage custom field values in their company" ON public.custom_field_values;
DROP POLICY IF EXISTS "Users can manage custom field values" ON public.custom_field_values;

CREATE POLICY "Users can manage custom field values"
  ON public.custom_field_values FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.custom_fields cf
      JOIN public.company_members cm ON cm.company_id = cf.company_id
      WHERE cf.id = public.custom_field_values.custom_field_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.custom_fields cf
      JOIN public.company_members cm ON cm.company_id = cf.company_id
      WHERE cf.id = public.custom_field_values.custom_field_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

-- Grant permissions just in case
GRANT ALL ON public.custom_fields TO authenticated;
GRANT ALL ON public.custom_field_values TO authenticated;
