-- Enable RLS just in case
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT
DROP POLICY IF EXISTS "Users can view segments of their company" ON public.segments;
CREATE POLICY "Users can view segments of their company"
ON public.segments
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Policy for INSERT
DROP POLICY IF EXISTS "Users can insert segments for their company" ON public.segments;
CREATE POLICY "Users can insert segments for their company"
ON public.segments
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Policy for UPDATE
DROP POLICY IF EXISTS "Users can update segments of their company" ON public.segments;
CREATE POLICY "Users can update segments of their company"
ON public.segments
FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Policy for DELETE
DROP POLICY IF EXISTS "Users can delete segments of their company" ON public.segments;
CREATE POLICY "Users can delete segments of their company"
ON public.segments
FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);
