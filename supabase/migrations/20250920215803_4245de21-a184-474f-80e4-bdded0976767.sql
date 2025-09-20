-- Create ai_cost_tracking table to store real cost data
CREATE TABLE public.ai_cost_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mode_used TEXT NOT NULL,
  cost_amount NUMERIC(10,6) NOT NULL,
  request_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_cost_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own cost tracking" 
ON public.ai_cost_tracking 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert cost tracking" 
ON public.ai_cost_tracking 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all cost tracking" 
ON public.ai_cost_tracking 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for performance
CREATE INDEX idx_ai_cost_tracking_user_id ON public.ai_cost_tracking(user_id);
CREATE INDEX idx_ai_cost_tracking_timestamp ON public.ai_cost_tracking(request_timestamp);

-- Populate cost_thresholds for existing users who don't have entries
INSERT INTO public.cost_thresholds (user_id)
SELECT DISTINCT user_id 
FROM public.profiles 
WHERE user_id NOT IN (SELECT user_id FROM public.cost_thresholds)
ON CONFLICT (user_id) DO NOTHING;