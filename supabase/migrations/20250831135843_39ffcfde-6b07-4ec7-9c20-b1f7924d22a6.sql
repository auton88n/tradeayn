-- Add session_id to messages table for separate conversations
ALTER TABLE public.messages 
ADD COLUMN session_id uuid DEFAULT gen_random_uuid();

-- Create index for better performance on session queries
CREATE INDEX idx_messages_session_id ON public.messages(session_id);
CREATE INDEX idx_messages_user_session ON public.messages(user_id, session_id);