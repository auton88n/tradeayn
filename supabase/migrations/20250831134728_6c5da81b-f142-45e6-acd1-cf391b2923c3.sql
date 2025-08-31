-- Add sender column to messages table to support both user and AI messages
ALTER TABLE public.messages 
ADD COLUMN sender TEXT NOT NULL DEFAULT 'user';

-- Add check constraint to ensure sender is either 'user' or 'ayn'
ALTER TABLE public.messages 
ADD CONSTRAINT messages_sender_check CHECK (sender IN ('user', 'ayn'));

-- Update existing messages to be from 'user' (they already are, just making it explicit)
UPDATE public.messages SET sender = 'user' WHERE sender IS NULL OR sender = '';

-- Add index for better performance when loading chat history
CREATE INDEX IF NOT EXISTS idx_messages_user_timestamp ON public.messages (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user_sender ON public.messages (user_id, sender);