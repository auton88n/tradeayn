-- Create webhook_health_metrics table for tracking n8n webhook health
CREATE TABLE public.webhook_health_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mode_name TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unknown' CHECK (status IN ('online', 'offline', 'degraded', 'unknown')),
  response_time_ms INTEGER,
  last_checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  error_message TEXT,
  success_count_24h INTEGER DEFAULT 0,
  failure_count_24h INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhook_health_metrics ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage health metrics
CREATE POLICY "Admins can manage webhook health metrics"
ON public.webhook_health_metrics
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for efficient queries
CREATE INDEX idx_webhook_health_mode_name ON public.webhook_health_metrics(mode_name);
CREATE INDEX idx_webhook_health_last_checked ON public.webhook_health_metrics(last_checked_at DESC);

-- Create function to cleanup old health metrics (keep 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_health_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.webhook_health_metrics 
  WHERE created_at < now() - interval '7 days';
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_webhook_health_metrics_updated_at
BEFORE UPDATE ON public.webhook_health_metrics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();