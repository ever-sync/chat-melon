-- Add current_session_id to profiles to track active sessions
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_session_id TEXT;

-- Enable Realtime for the profiles table if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  END IF;
END $$;
