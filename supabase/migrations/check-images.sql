-- Check image URLs in conversations and contacts
-- Run this in Supabase SQL Editor

-- 1. Check conversations with profile_pic_url
SELECT 
  id, 
  contact_name, 
  profile_pic_url 
FROM conversations 
WHERE profile_pic_url IS NOT NULL 
LIMIT 5;

-- 2. Check contacts with profile_pic_url
SELECT 
  id, 
  name, 
  profile_pic_url 
FROM contacts 
WHERE profile_pic_url IS NOT NULL 
LIMIT 5;

-- 3. Check specific join that Chat.tsx does
SELECT 
  c.id as conversation_id,
  c.contact_name,
  c.profile_pic_url as conv_pic,
  ct.profile_pic_url as contact_pic
FROM conversations c
LEFT JOIN contacts ct ON ct.id = c.contact_id -- Assuming contact_id allows joining
LIMIT 10;
