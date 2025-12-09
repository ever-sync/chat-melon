-- Migration: Sync profile_pic_url from contacts to conversations
-- This updates existing conversations with the latest profile pictures from their linked contacts

-- Update conversations that have a contact_id linked
UPDATE public.conversations c
SET profile_pic_url = ct.profile_pic_url
FROM public.contacts ct
WHERE c.contact_id = ct.id
  AND ct.profile_pic_url IS NOT NULL
  AND (c.profile_pic_url IS NULL OR c.profile_pic_url != ct.profile_pic_url);

-- For conversations without contact_id, try to match by phone number
UPDATE public.conversations c
SET profile_pic_url = ct.profile_pic_url,
    contact_id = ct.id
FROM public.contacts ct
WHERE c.contact_id IS NULL
  AND c.contact_number = ct.phone_number
  AND c.company_id = ct.company_id
  AND ct.profile_pic_url IS NOT NULL;
