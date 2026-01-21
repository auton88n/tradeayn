-- Test Results table for storing all test outcomes
CREATE TABLE public.test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_suite TEXT NOT NULL,
  test_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'skipped', 'flaky')),
  duration_ms INTEGER,
  error_message TEXT,
  screenshot_url TEXT,
  browser TEXT,
  viewport TEXT,
  retry_count INTEGER DEFAULT 0,
  run_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stress Test Metrics table for performance data
CREATE TABLE public.stress_test_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name TEXT NOT NULL,
  concurrent_users INTEGER,
  requests_per_second FLOAT,
  avg_response_time_ms FLOAT,
  p50_response_time_ms FLOAT,
  p95_response_time_ms FLOAT,
  p99_response_time_ms FLOAT,
  error_rate FLOAT,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  run_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Test Run Summary table
CREATE TABLE public.test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_name TEXT,
  total_tests INTEGER DEFAULT 0,
  passed_tests INTEGER DEFAULT 0,
  failed_tests INTEGER DEFAULT 0,
  skipped_tests INTEGER DEFAULT 0,
  duration_ms INTEGER,
  triggered_by TEXT DEFAULT 'manual',
  environment TEXT DEFAULT 'production',
  git_commit TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stress_test_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only admins can view/manage test data
CREATE POLICY "Admins can manage test results" ON public.test_results
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage stress metrics" ON public.stress_test_metrics
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage test runs" ON public.test_runs
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role policies for inserting test data
CREATE POLICY "Service role can insert test results" ON public.test_results
  FOR INSERT WITH CHECK ((SELECT (auth.jwt() ->> 'role')) = 'service_role');

CREATE POLICY "Service role can insert stress metrics" ON public.stress_test_metrics
  FOR INSERT WITH CHECK ((SELECT (auth.jwt() ->> 'role')) = 'service_role');

CREATE POLICY "Service role can insert test runs" ON public.test_runs
  FOR INSERT WITH CHECK ((SELECT (auth.jwt() ->> 'role')) = 'service_role');

-- Indexes for performance
CREATE INDEX idx_test_results_run_id ON public.test_results(run_id);
CREATE INDEX idx_test_results_status ON public.test_results(status);
CREATE INDEX idx_test_results_created_at ON public.test_results(created_at DESC);
CREATE INDEX idx_stress_metrics_run_id ON public.stress_test_metrics(run_id);
CREATE INDEX idx_test_runs_created_at ON public.test_runs(created_at DESC);