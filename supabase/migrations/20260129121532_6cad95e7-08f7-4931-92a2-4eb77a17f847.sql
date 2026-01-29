-- Backfill missing chat_sessions titles from the first user message in each session
-- This fixes sessions that were created before the title generation logic was added

-- Create a function to backfill missing titles
CREATE OR REPLACE FUNCTION backfill_missing_session_titles()
RETURNS INTEGER AS $$
DECLARE
  fixed_count INTEGER := 0;
  session_record RECORD;
  first_user_message TEXT;
  truncated_title TEXT;
BEGIN
  -- Find all sessions that exist in messages but not in chat_sessions
  FOR session_record IN
    SELECT DISTINCT m.session_id, m.user_id
    FROM messages m
    LEFT JOIN chat_sessions cs ON cs.session_id = m.session_id AND cs.user_id = m.user_id
    WHERE m.session_id IS NOT NULL
      AND cs.id IS NULL
  LOOP
    -- Get the first user message for this session
    SELECT content INTO first_user_message
    FROM messages
    WHERE session_id = session_record.session_id
      AND user_id = session_record.user_id
      AND sender = 'user'
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- Use first 50 chars as title, fallback to 'Chat Session'
    IF first_user_message IS NOT NULL AND LENGTH(first_user_message) > 0 THEN
      truncated_title := CASE 
        WHEN LENGTH(first_user_message) > 50 THEN LEFT(first_user_message, 50) || '...'
        ELSE first_user_message
      END;
    ELSE
      truncated_title := 'Chat Session';
    END IF;
    
    -- Insert the missing chat_sessions record
    INSERT INTO chat_sessions (user_id, session_id, title)
    VALUES (session_record.user_id, session_record.session_id, truncated_title)
    ON CONFLICT (user_id, session_id) DO NOTHING;
    
    fixed_count := fixed_count + 1;
  END LOOP;
  
  RETURN fixed_count;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add unique constraint to prevent duplicates (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chat_sessions_user_session_unique'
  ) THEN
    ALTER TABLE chat_sessions 
    ADD CONSTRAINT chat_sessions_user_session_unique 
    UNIQUE (user_id, session_id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Constraint already exists
END $$;

-- Run the backfill
SELECT backfill_missing_session_titles();