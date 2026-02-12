
-- =============================================
-- AYN Workforce V2: AI Company Brain Schema
-- =============================================

-- 1. employee_states — Persistent intelligence per agent
CREATE TABLE public.employee_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text UNIQUE NOT NULL,
  beliefs jsonb NOT NULL DEFAULT '{"growth_priority": 0.5, "risk_tolerance": 0.5, "speed_vs_quality": 0.5}'::jsonb,
  emotional_stance text NOT NULL DEFAULT 'calm',
  confidence float NOT NULL DEFAULT 0.5,
  core_motivation text,
  active_objectives text[] DEFAULT '{}',
  recent_decisions jsonb DEFAULT '[]'::jsonb,
  performance_metrics jsonb DEFAULT '{"actions_taken": 0, "success_rate": 0, "false_alarms": 0}'::jsonb,
  founder_model jsonb DEFAULT '{"risk_tolerance": "high", "prefers_brevity": true, "communication_style": "casual", "approved_patterns": [], "rejected_patterns": []}'::jsonb,
  chime_in_threshold float NOT NULL DEFAULT 0.75,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on employee_states"
  ON public.employee_states FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins can view employee_states"
  ON public.employee_states FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. employee_reflections — Post-action learning
CREATE TABLE public.employee_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text NOT NULL,
  action_ref text,
  reasoning text,
  expected_outcome text,
  confidence float DEFAULT 0.5,
  what_would_change_mind text,
  actual_outcome text,
  outcome_evaluated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on employee_reflections"
  ON public.employee_reflections FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins can view employee_reflections"
  ON public.employee_reflections FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. employee_discussions — Internal debate records
CREATE TABLE public.employee_discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid NOT NULL DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  employee_id text NOT NULL,
  position text,
  reasoning text,
  confidence float DEFAULT 0.5,
  objections text,
  impact_level text NOT NULL DEFAULT 'medium',
  objective_impact jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_discussions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on employee_discussions"
  ON public.employee_discussions FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins can view employee_discussions"
  ON public.employee_discussions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. company_objectives — Shared mission alignment
CREATE TABLE public.company_objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  metric text,
  target_value float,
  current_value float NOT NULL DEFAULT 0,
  deadline timestamptz,
  priority int NOT NULL DEFAULT 3,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on company_objectives"
  ON public.company_objectives FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins can view company_objectives"
  ON public.company_objectives FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. service_economics — Economic intelligence
CREATE TABLE public.service_economics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id text UNIQUE NOT NULL,
  service_name text NOT NULL,
  acquisition_difficulty int NOT NULL DEFAULT 5,
  scalability_score int NOT NULL DEFAULT 5,
  average_margin float NOT NULL DEFAULT 0.5,
  time_to_deploy text,
  retention_probability float NOT NULL DEFAULT 0.5,
  operational_complexity int NOT NULL DEFAULT 5,
  category text NOT NULL DEFAULT 'service',
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_economics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on service_economics"
  ON public.service_economics FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins can view service_economics"
  ON public.service_economics FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 6. company_state — Organizational temperature (single row)
CREATE TABLE public.company_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  momentum text NOT NULL DEFAULT 'stable',
  stress_level float NOT NULL DEFAULT 0.2,
  growth_velocity text NOT NULL DEFAULT 'growing',
  risk_exposure text NOT NULL DEFAULT 'low',
  morale text NOT NULL DEFAULT 'high',
  context jsonb DEFAULT '{}'::jsonb,
  updated_by text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on company_state"
  ON public.company_state FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins can view company_state"
  ON public.company_state FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 7. company_journal — Quarterly narrative memory
CREATE TABLE public.company_journal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period text NOT NULL,
  summary text,
  key_wins jsonb DEFAULT '[]'::jsonb,
  key_losses jsonb DEFAULT '[]'::jsonb,
  strategic_shift text,
  created_by text NOT NULL DEFAULT 'chief_of_staff',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on company_journal"
  ON public.company_journal FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins can view company_journal"
  ON public.company_journal FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Indexes for performance
CREATE INDEX idx_employee_reflections_employee ON public.employee_reflections(employee_id);
CREATE INDEX idx_employee_reflections_unevaluated ON public.employee_reflections(outcome_evaluated) WHERE outcome_evaluated = false;
CREATE INDEX idx_employee_discussions_discussion ON public.employee_discussions(discussion_id);
CREATE INDEX idx_company_objectives_active ON public.company_objectives(status) WHERE status = 'active';

-- Updated_at triggers
CREATE TRIGGER update_employee_states_updated_at
  BEFORE UPDATE ON public.employee_states
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER update_company_objectives_updated_at
  BEFORE UPDATE ON public.company_objectives
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER update_service_economics_updated_at
  BEFORE UPDATE ON public.service_economics
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER update_company_state_updated_at
  BEFORE UPDATE ON public.company_state
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
