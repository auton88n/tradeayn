-- Create favorite_chats table for storing user's favorite chat sessions
CREATE TABLE public.favorite_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  chat_title TEXT NOT NULL,
  chat_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.favorite_chats ENABLE ROW LEVEL SECURITY;

-- Create policies for favorite_chats
CREATE POLICY "Users can view their own favorite chats" 
ON public.favorite_chats 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorite chats" 
ON public.favorite_chats 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorite chats" 
ON public.favorite_chats 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite chats" 
ON public.favorite_chats 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_favorite_chats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_favorite_chats_updated_at
BEFORE UPDATE ON public.favorite_chats
FOR EACH ROW
EXECUTE FUNCTION public.update_favorite_chats_updated_at();

-- Create index for better performance
CREATE INDEX idx_favorite_chats_user_id ON public.favorite_chats(user_id);
CREATE INDEX idx_favorite_chats_session_id ON public.favorite_chats(session_id);