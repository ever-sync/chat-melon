-- Fix contact_notes foreign key relationship with profiles
ALTER TABLE contact_notes 
ADD CONSTRAINT contact_notes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create RLS policies for messages table to allow sending messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages from conversations in their company
DROP POLICY IF EXISTS "Users can view messages in their company conversations" ON messages;
CREATE POLICY "Users can view messages in their company conversations" ON messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND c.company_id IN (
      SELECT company_id FROM company_members WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Users can insert messages in conversations assigned to them or in their company
DROP POLICY IF EXISTS "Users can send messages in their company conversations" ON messages;
CREATE POLICY "Users can send messages in their company conversations" ON messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND c.company_id IN (
      SELECT company_id FROM company_members WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Users can update messages they created
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
CREATE POLICY "Users can update their own messages" ON messages
FOR UPDATE USING (
  user_id = auth.uid()
);

-- Policy: Users can delete their own messages
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;
CREATE POLICY "Users can delete their own messages" ON messages
FOR DELETE USING (
  user_id = auth.uid()
);