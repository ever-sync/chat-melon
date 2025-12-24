-- Migration to add 'markint' category for all existing companies

INSERT INTO public.faq_categories (company_id, name)
SELECT id, 'markint'
FROM public.companies c
WHERE NOT EXISTS (
    SELECT 1 
    FROM public.faq_categories fc 
    WHERE fc.company_id = c.id 
    AND fc.name = 'markint'
);
