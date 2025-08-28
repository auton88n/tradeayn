-- Create system_reports table for storing diagnostic reports
CREATE TABLE public.system_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL UNIQUE,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  system_status TEXT NOT NULL CHECK (system_status IN ('healthy', 'warning', 'critical')),
  total_issues INTEGER NOT NULL DEFAULT 0,
  issues_fixed INTEGER NOT NULL DEFAULT 0,
  issues_requiring_attention INTEGER NOT NULL DEFAULT 0,
  performance_metrics JSONB,
  issues JSONB,
  recommendations TEXT[],
  report_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for system reports (admin only)
CREATE POLICY "Admins can view all system reports" 
ON public.system_reports 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert reports" 
ON public.system_reports 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_system_reports_generated_at ON public.system_reports(generated_at DESC);
CREATE INDEX idx_system_reports_status ON public.system_reports(system_status);

-- Create function to clean up old system reports (keep last 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_system_reports()
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.system_reports 
  WHERE generated_at < (now() - interval '30 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;