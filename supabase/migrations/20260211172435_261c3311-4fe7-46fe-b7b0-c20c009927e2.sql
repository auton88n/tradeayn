
-- ============================================
-- 1. security_incidents table
-- ============================================
CREATE TABLE public.security_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  strike_count INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'detected',
  action_taken TEXT,
  details JSONB DEFAULT '{}',
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID
);

ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on security_incidents"
  ON public.security_incidents FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins can view security_incidents"
  ON public.security_incidents FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_security_incidents_user ON public.security_incidents(user_id);
CREATE INDEX idx_security_incidents_status ON public.security_incidents(status);
CREATE INDEX idx_security_incidents_created ON public.security_incidents(created_at DESC);

-- ============================================
-- 2. employee_tasks table
-- ============================================
CREATE TABLE public.employee_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_employee TEXT NOT NULL,
  to_employee TEXT NOT NULL,
  task_type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.employee_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on employee_tasks"
  ON public.employee_tasks FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins can view employee_tasks"
  ON public.employee_tasks FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_employee_tasks_to ON public.employee_tasks(to_employee, status);
CREATE INDEX idx_employee_tasks_created ON public.employee_tasks(created_at DESC);

-- ============================================
-- 3. system_health_checks table
-- ============================================
CREATE TABLE public.system_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  response_time_ms INTEGER,
  status_code INTEGER,
  is_healthy BOOLEAN DEFAULT true,
  error_message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_health_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on system_health_checks"
  ON public.system_health_checks FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins can view system_health_checks"
  ON public.system_health_checks FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_health_checks_function ON public.system_health_checks(function_name, checked_at DESC);

-- Auto-cleanup old health checks (keep 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_health_checks_v2()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.system_health_checks 
  WHERE checked_at < now() - interval '7 days';
END;
$$;
