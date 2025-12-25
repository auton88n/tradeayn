-- Create engineering_activity table to track user engineering actions for AYN context
CREATE TABLE public.engineering_activity (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    activity_type text NOT NULL,
    summary text NOT NULL,
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add index for fast user lookups
CREATE INDEX idx_engineering_activity_user_id ON public.engineering_activity(user_id);
CREATE INDEX idx_engineering_activity_created_at ON public.engineering_activity(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.engineering_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see/manage their own activities
CREATE POLICY "Users can view own engineering activities"
ON public.engineering_activity
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own engineering activities"
ON public.engineering_activity
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own engineering activities"
ON public.engineering_activity
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all for monitoring
CREATE POLICY "Admins can view all engineering activities"
ON public.engineering_activity
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Block anonymous access
CREATE POLICY "Block anonymous engineering_activity access"
ON public.engineering_activity
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);