-- Fix RLS policies for company_faqs - CORRECTED VERSION
-- The profiles table doesn't have a role column, roles are in user_roles table

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their company faqs" ON public.company_faqs;
DROP POLICY IF EXISTS "Users can insert their company faqs" ON public.company_faqs;
DROP POLICY IF EXISTS "Users can update their company faqs" ON public.company_faqs;
DROP POLICY IF EXISTS "Users can delete their company faqs" ON public.company_faqs;

-- Create/update helper function
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Recreate policies - simplified version without role checks
-- Just check if company_id matches the user's company_id from profiles
CREATE POLICY "Users can view their company faqs"
  ON public.company_faqs FOR SELECT
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can insert their company faqs"
  ON public.company_faqs FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Users can update their company faqs"
  ON public.company_faqs FOR UPDATE
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can delete their company faqs"
  ON public.company_faqs FOR DELETE
  USING (company_id = public.get_user_company_id());

-- Also fix faq_categories policies
DROP POLICY IF EXISTS "Users can view their company faq categories" ON public.faq_categories;
DROP POLICY IF EXISTS "Users can insert their company faq categories" ON public.faq_categories;
DROP POLICY IF EXISTS "Users can update their company faq categories" ON public.faq_categories;
DROP POLICY IF EXISTS "Users can delete their company faq categories" ON public.faq_categories;

CREATE POLICY "Users can view their company faq categories"
  ON public.faq_categories FOR SELECT
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can insert their company faq categories"
  ON public.faq_categories FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Users can update their company faq categories"
  ON public.faq_categories FOR UPDATE
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can delete their company faq categories"
  ON public.faq_categories FOR DELETE
  USING (company_id = public.get_user_company_id());
