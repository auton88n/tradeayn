-- Update existing messages to group them properly by conversation flow
-- First, let's create a function to assign session IDs based on conversation patterns

DO $$
DECLARE
    user_record RECORD;
    message_record RECORD;
    current_session_id UUID;
    prev_timestamp TIMESTAMP WITH TIME ZONE;
    time_gap_threshold INTERVAL := '30 minutes';
BEGIN
    -- Process each user separately
    FOR user_record IN 
        SELECT DISTINCT user_id FROM messages WHERE session_id IS NOT NULL
    LOOP
        current_session_id := gen_random_uuid();
        prev_timestamp := NULL;
        
        -- Process messages for this user in chronological order
        FOR message_record IN 
            SELECT id, created_at 
            FROM messages 
            WHERE user_id = user_record.user_id 
            ORDER BY created_at ASC
        LOOP
            -- If this is the first message or there's a significant time gap, start a new session
            IF prev_timestamp IS NULL OR 
               (message_record.created_at - prev_timestamp) > time_gap_threshold THEN
                current_session_id := gen_random_uuid();
            END IF;
            
            -- Update the message with the current session ID
            UPDATE messages 
            SET session_id = current_session_id 
            WHERE id = message_record.id;
            
            prev_timestamp := message_record.created_at;
        END LOOP;
    END LOOP;
END $$;