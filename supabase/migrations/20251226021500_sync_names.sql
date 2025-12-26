-- Sync names from conversations to contacts
-- This backfills the name for contacts that have 'Sem nome' (NULL) but have a name in their conversation
UPDATE contacts
SET name = conversations.contact_name,
    push_name = COALESCE(contacts.push_name, conversations.contact_name)
FROM conversations
WHERE contacts.id = conversations.contact_id
  AND (contacts.name IS NULL OR contacts.name = '')
  AND conversations.contact_name IS NOT NULL
  AND conversations.contact_name != ''
  AND conversations.contact_name != conversations.contact_number;
