-- Create comprehensive threat detection and security monitoring system

-- Threat detection table for tracking suspicious activities
CREATE TABLE public.threat_detection (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_ip INET NOT NULL,
  threat_type TEXT NOT NULL, -- 'failed_login', 'ddos', 'suspicious_request', 'rate_limit_violation'
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  details JSONB NOT NULL DEFAULT '{}',
  user_id UUID NULL,
  endpoint TEXT NULL,
  user_agent TEXT NULL,
  request_count INTEGER DEFAULT 1,
  is_blocked BOOLEAN DEFAULT false,
  blocked_until TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- IP blocking table for automatic threat mitigation
CREATE TABLE public.ip_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address INET NOT NULL UNIQUE,
  block_reason TEXT NOT NULL,
  blocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  blocked_until TIMESTAMP WITH TIME ZONE NULL, -- NULL means permanent
  block_type TEXT NOT NULL DEFAULT 'automatic', -- 'automatic', 'manual', 'emergency'
  threat_level TEXT NOT NULL DEFAULT 'medium',
  metadata JSONB DEFAULT '{}',
  created_by UUID NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Device fingerprinting for enhanced authentication
CREATE TABLE public.device_fingerprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  fingerprint_hash TEXT NOT NULL,
  device_info JSONB NOT NULL DEFAULT '{}', -- browser, OS, screen resolution, timezone, etc.
  first_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_trusted BOOLEAN DEFAULT false,
  login_count INTEGER DEFAULT 1,
  location_info JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced emergency system with multi-level alerts
CREATE TABLE public.emergency_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_level TEXT NOT NULL, -- 'yellow', 'red', 'critical'
  alert_type TEXT NOT NULL, -- 'security_threat', 'system_overload', 'manual_trigger'
  triggered_by UUID NULL,
  trigger_reason TEXT NOT NULL,
  auto_triggered BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  resolved_at TIMESTAMP WITH TIME ZONE NULL,
  resolved_by UUID NULL,
  threat_assessment JSONB DEFAULT '{}',
  mitigation_actions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Performance monitoring for system health
CREATE TABLE public.performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL, -- 'response_time', 'memory_usage', 'db_connections', 'active_users'
  metric_value NUMERIC NOT NULL,
  measurement_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.threat_detection ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for threat_detection (Admin only access)
CREATE POLICY "Only admins can manage threat detection" 
ON public.threat_detection 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for ip_blocks (Admin only access)
CREATE POLICY "Only admins can manage IP blocks" 
ON public.ip_blocks 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for device_fingerprints (Users can see their own, admins see all)
CREATE POLICY "Users can view their own device fingerprints" 
ON public.device_fingerprints 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all device fingerprints" 
ON public.device_fingerprints 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own device fingerprints" 
ON public.device_fingerprints 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for emergency_alerts (Admin only)
CREATE POLICY "Only admins can manage emergency alerts" 
ON public.emergency_alerts 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for performance_metrics (Admin only)
CREATE POLICY "Only admins can view performance metrics" 
ON public.performance_metrics 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert performance metrics" 
ON public.performance_metrics 
FOR INSERT 
WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_threat_detection_source_ip ON public.threat_detection(source_ip);
CREATE INDEX idx_threat_detection_detected_at ON public.threat_detection(detected_at);
CREATE INDEX idx_threat_detection_threat_type ON public.threat_detection(threat_type);
CREATE INDEX idx_threat_detection_severity ON public.threat_detection(severity);

CREATE INDEX idx_ip_blocks_ip_address ON public.ip_blocks(ip_address);
CREATE INDEX idx_ip_blocks_is_active ON public.ip_blocks(is_active);
CREATE INDEX idx_ip_blocks_blocked_until ON public.ip_blocks(blocked_until);

CREATE INDEX idx_device_fingerprints_user_id ON public.device_fingerprints(user_id);
CREATE INDEX idx_device_fingerprints_fingerprint_hash ON public.device_fingerprints(fingerprint_hash);

CREATE INDEX idx_emergency_alerts_is_active ON public.emergency_alerts(is_active);
CREATE INDEX idx_emergency_alerts_alert_level ON public.emergency_alerts(alert_level);

CREATE INDEX idx_performance_metrics_metric_type ON public.performance_metrics(metric_type);
CREATE INDEX idx_performance_metrics_measurement_time ON public.performance_metrics(measurement_time);

-- Database functions for threat detection
CREATE OR REPLACE FUNCTION public.detect_suspicious_ip(
  _ip_address INET,
  _threat_type TEXT,
  _severity TEXT DEFAULT 'medium',
  _details JSONB DEFAULT '{}'
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  recent_threats INTEGER;
  should_block BOOLEAN := false;
BEGIN
  -- Count recent threats from this IP
  SELECT COUNT(*) INTO recent_threats
  FROM public.threat_detection
  WHERE source_ip = _ip_address
    AND detected_at > now() - interval '1 hour';
  
  -- Insert threat record
  INSERT INTO public.threat_detection (
    source_ip, threat_type, severity, details
  ) VALUES (
    _ip_address, _threat_type, _severity, _details
  );
  
  -- Auto-block if threshold exceeded
  IF recent_threats >= 5 OR _severity = 'critical' THEN
    INSERT INTO public.ip_blocks (
      ip_address, block_reason, blocked_until, block_type, threat_level
    ) VALUES (
      _ip_address, 
      format('Automatic block: %s threats detected', recent_threats + 1),
      now() + interval '24 hours',
      'automatic',
      _severity
    ) ON CONFLICT (ip_address) DO UPDATE SET
      blocked_until = GREATEST(ip_blocks.blocked_until, now() + interval '24 hours'),
      updated_at = now();
    
    should_block := true;
  END IF;
  
  RETURN should_block;
END;
$$;

-- Function to check if IP is blocked
CREATE OR REPLACE FUNCTION public.is_ip_blocked(_ip_address INET)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.ip_blocks
    WHERE ip_address = _ip_address
      AND is_active = true
      AND (blocked_until IS NULL OR blocked_until > now())
  );
$$;

-- Function to record device fingerprint
CREATE OR REPLACE FUNCTION public.record_device_fingerprint(
  _user_id UUID,
  _fingerprint_hash TEXT,
  _device_info JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  fingerprint_id UUID;
BEGIN
  INSERT INTO public.device_fingerprints (
    user_id, fingerprint_hash, device_info, last_seen, login_count
  ) VALUES (
    _user_id, _fingerprint_hash, _device_info, now(), 1
  ) ON CONFLICT (user_id, fingerprint_hash) DO UPDATE SET
    last_seen = now(),
    login_count = device_fingerprints.login_count + 1,
    device_info = _device_info,
    updated_at = now()
  RETURNING id INTO fingerprint_id;
  
  RETURN fingerprint_id;
END;
$$;

-- Function to trigger emergency alert
CREATE OR REPLACE FUNCTION public.trigger_emergency_alert(
  _alert_level TEXT,
  _alert_type TEXT,
  _trigger_reason TEXT,
  _threat_assessment JSONB DEFAULT '{}'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  alert_id UUID;
BEGIN
  INSERT INTO public.emergency_alerts (
    alert_level, alert_type, triggered_by, trigger_reason, 
    auto_triggered, threat_assessment
  ) VALUES (
    _alert_level, _alert_type, auth.uid(), _trigger_reason,
    auth.uid() IS NULL, _threat_assessment
  ) RETURNING id INTO alert_id;
  
  RETURN alert_id;
END;
$$;

-- Function for cleanup of old records
CREATE OR REPLACE FUNCTION public.cleanup_security_tables()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Clean up old threat detection records (keep 30 days)
  DELETE FROM public.threat_detection 
  WHERE detected_at < now() - interval '30 days';
  
  -- Remove expired IP blocks
  DELETE FROM public.ip_blocks 
  WHERE blocked_until IS NOT NULL AND blocked_until < now();
  
  -- Clean old device fingerprints (keep 90 days of inactive)
  DELETE FROM public.device_fingerprints 
  WHERE last_seen < now() - interval '90 days';
  
  -- Clean old performance metrics (keep 7 days)
  DELETE FROM public.performance_metrics 
  WHERE measurement_time < now() - interval '7 days';
  
  -- Clean resolved emergency alerts (keep 30 days)
  DELETE FROM public.emergency_alerts 
  WHERE resolved_at IS NOT NULL AND resolved_at < now() - interval '30 days';
END;
$$;

-- Triggers for automatic updates
CREATE TRIGGER update_threat_detection_updated_at
BEFORE UPDATE ON public.threat_detection
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ip_blocks_updated_at
BEFORE UPDATE ON public.ip_blocks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_device_fingerprints_updated_at
BEFORE UPDATE ON public.device_fingerprints
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emergency_alerts_updated_at
BEFORE UPDATE ON public.emergency_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();