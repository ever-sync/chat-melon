-- Retry: Add email and temperature columns to contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS temperature TEXT DEFAULT 'cold';
