-- Phase 1: Add saved insights table and populate business data

-- Create saved insights table
CREATE TABLE public.saved_insights (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  insight_text text NOT NULL,
  category text,
  created_at timestamp with time zone DEFAULT now(),
  tags text[]
);

-- Enable RLS
ALTER TABLE public.saved_insights ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can manage their own insights" ON public.saved_insights
  FOR ALL USING (auth.uid() = user_id);

-- Populate business data for testing
UPDATE public.profiles 
SET business_type = 'consulting', 
    business_context = 'Digital consulting business focused on helping SMEs with technology solutions. Main challenges: lead generation and pricing strategy. Goals: scale to 50k monthly revenue.'
WHERE business_type IS NULL AND business_context IS NULL;