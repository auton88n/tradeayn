-- Create message_ratings table for storing user feedback on AI responses
CREATE TABLE public.message_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id UUID,
  message_preview TEXT NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('positive', 'negative')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.message_ratings ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback (including anonymous via NULL check)
CREATE POLICY "Users can insert their own feedback" ON public.message_ratings
  FOR INSERT WITH CHECK (auth.uid() IS NULL OR auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback" ON public.message_ratings
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback" ON public.message_ratings
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Index for efficient querying by session and rating
CREATE INDEX idx_message_ratings_session ON public.message_ratings(session_id);
CREATE INDEX idx_message_ratings_rating ON public.message_ratings(rating);
CREATE INDEX idx_message_ratings_created ON public.message_ratings(created_at DESC);