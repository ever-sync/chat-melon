-- Migration to add CASCADE DELETE to foreign keys referencing contacts

-- 1. Conversations
DO $$
BEGIN
  -- Tenta remover a constraint existente (nome padrão ou nomes comuns)
  BEGIN
    ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_contact_id_fkey;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Adiciona a nova constraint com CASCADE
  ALTER TABLE conversations
  ADD CONSTRAINT conversations_contact_id_fkey
  FOREIGN KEY (contact_id)
  REFERENCES contacts(id)
  ON DELETE CASCADE;
END $$;

-- 2. Deals (Negócios)
DO $$
BEGIN
  BEGIN
    ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_contact_id_fkey;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  ALTER TABLE deals
  ADD CONSTRAINT deals_contact_id_fkey
  FOREIGN KEY (contact_id)
  REFERENCES contacts(id)
  ON DELETE CASCADE;
END $$;

-- 3. Tasks (Tarefas)
DO $$
BEGIN
  BEGIN
    ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_contact_id_fkey;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  ALTER TABLE tasks
  ADD CONSTRAINT tasks_contact_id_fkey
  FOREIGN KEY (contact_id)
  REFERENCES contacts(id)
  ON DELETE CASCADE;
END $$;

-- 4. Contact Notes (Notas)
DO $$
BEGIN
  BEGIN
    ALTER TABLE contact_notes DROP CONSTRAINT IF EXISTS contact_notes_contact_id_fkey;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  ALTER TABLE contact_notes
  ADD CONSTRAINT contact_notes_contact_id_fkey
  FOREIGN KEY (contact_id)
  REFERENCES contacts(id)
  ON DELETE CASCADE;
END $$;

-- 5. Campaign Contacts
DO $$
BEGIN
  BEGIN
    ALTER TABLE campaign_contacts DROP CONSTRAINT IF EXISTS campaign_contacts_contact_id_fkey;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  ALTER TABLE campaign_contacts
  ADD CONSTRAINT campaign_contacts_contact_id_fkey
  FOREIGN KEY (contact_id)
  REFERENCES contacts(id)
  ON DELETE CASCADE;
END $$;

-- 6. Contact Duplicates (Duplicatas)
DO $$
BEGIN
  -- Contact 1
  BEGIN
    ALTER TABLE contact_duplicates DROP CONSTRAINT IF EXISTS contact_duplicates_contact_id_1_fkey;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  ALTER TABLE contact_duplicates
  ADD CONSTRAINT contact_duplicates_contact_id_1_fkey
  FOREIGN KEY (contact_id_1)
  REFERENCES contacts(id)
  ON DELETE CASCADE;

  -- Contact 2
  BEGIN
    ALTER TABLE contact_duplicates DROP CONSTRAINT IF EXISTS contact_duplicates_contact_id_2_fkey;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  ALTER TABLE contact_duplicates
  ADD CONSTRAINT contact_duplicates_contact_id_2_fkey
  FOREIGN KEY (contact_id_2)
  REFERENCES contacts(id)
  ON DELETE CASCADE;
END $$;

-- 7. Messages (via Conversations)
-- Ensure messages are deleted when conversation is deleted
DO $$
BEGIN
  BEGIN
    ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  ALTER TABLE messages
  ADD CONSTRAINT messages_conversation_id_fkey
  FOREIGN KEY (conversation_id)
  REFERENCES conversations(id)
  ON DELETE CASCADE;
END $$;
