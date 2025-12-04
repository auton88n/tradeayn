-- Create saved_responses table for bookmarked AI responses
CREATE TABLE public.saved_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  mode text,
  emotion text,
  session_id uuid,
  title text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_responses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own saved responses"
ON public.saved_responses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved responses"
ON public.saved_responses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved responses"
ON public.saved_responses
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved responses"
ON public.saved_responses
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_saved_responses_user_id ON public.saved_responses(user_id);
CREATE INDEX idx_saved_responses_created_at ON public.saved_responses(created_at DESC);