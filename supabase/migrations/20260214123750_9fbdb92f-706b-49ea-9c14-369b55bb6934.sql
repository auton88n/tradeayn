
-- =====================================================
-- Step 1: Create debounce tracking table
-- =====================================================
CREATE TABLE public.agent_event_debounce (
  agent_name TEXT PRIMARY KEY,
  last_triggered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_event_debounce ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only debounce" ON public.agent_event_debounce
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- Step 2: Generic debounced agent caller
-- =====================================================
CREATE OR REPLACE FUNCTION public.call_agent_if_not_debounced(
  p_agent_name TEXT,
  p_function_name TEXT,
  p_payload JSONB DEFAULT '{}'::JSONB,
  p_debounce_seconds INTEGER DEFAULT 120
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  last_call TIMESTAMPTZ;
BEGIN
  SELECT last_triggered_at INTO last_call
  FROM public.agent_event_debounce
  WHERE agent_name = p_agent_name;

  IF last_call IS NOT NULL AND last_call > now() - (p_debounce_seconds || ' seconds')::INTERVAL THEN
    RETURN;
  END IF;

  INSERT INTO public.agent_event_debounce (agent_name, last_triggered_at)
  VALUES (p_agent_name, now())
  ON CONFLICT (agent_name) DO UPDATE SET last_triggered_at = now();

  PERFORM net.http_post(
    url := 'https://dfkoxuokfkttjhfjcecx.supabase.co/functions/v1/' || p_function_name,
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRma294dW9rZmt0dGpoZmpjZWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTg4NzMsImV4cCI6MjA3MTkzNDg3M30.Th_-ds6dHsxIhRpkzJLREwBIVdgkcdm2SmMNDmjNbxw"}'::JSONB,
    body := p_payload
  );
END;
$$;

-- =====================================================
-- Step 3: Trigger functions + triggers
-- =====================================================

-- QA Watchdog
CREATE OR REPLACE FUNCTION public.trigger_qa_watchdog()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public.call_agent_if_not_debounced('qa_watchdog', 'ayn-qa-watchdog',
    jsonb_build_object('source', 'event_trigger', 'trigger_table', 'error_logs', 'record_id', NEW.id));
  RETURN NEW;
END; $$;

CREATE TRIGGER on_error_logged AFTER INSERT ON public.error_logs
  FOR EACH ROW EXECUTE FUNCTION public.trigger_qa_watchdog();

-- Security Guard
CREATE OR REPLACE FUNCTION public.trigger_security_guard()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.severity IN ('high', 'critical') THEN
    PERFORM public.call_agent_if_not_debounced('security_guard', 'ayn-security-guard',
      jsonb_build_object('source', 'event_trigger', 'trigger_table', 'security_logs', 'record_id', NEW.id, 'action', NEW.action, 'severity', NEW.severity));
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_security_event AFTER INSERT ON public.security_logs
  FOR EACH ROW EXECUTE FUNCTION public.trigger_security_guard();

-- Follow-Up Agent (email)
CREATE OR REPLACE FUNCTION public.trigger_follow_up_agent_email()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public.call_agent_if_not_debounced('follow_up_agent', 'ayn-follow-up-agent',
    jsonb_build_object('source', 'event_trigger', 'trigger_table', 'inbound_email_replies', 'record_id', NEW.id));
  RETURN NEW;
END; $$;

CREATE TRIGGER on_inbound_reply AFTER INSERT ON public.inbound_email_replies
  FOR EACH ROW EXECUTE FUNCTION public.trigger_follow_up_agent_email();

-- Follow-Up Agent (pipeline contacted)
CREATE OR REPLACE FUNCTION public.trigger_follow_up_agent_pipeline()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'contacted' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM public.call_agent_if_not_debounced('follow_up_agent', 'ayn-follow-up-agent',
      jsonb_build_object('source', 'event_trigger', 'trigger_table', 'ayn_sales_pipeline', 'record_id', NEW.id, 'new_status', NEW.status));
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_pipeline_contacted AFTER UPDATE ON public.ayn_sales_pipeline
  FOR EACH ROW EXECUTE FUNCTION public.trigger_follow_up_agent_pipeline();

-- Sales Outreach
CREATE OR REPLACE FUNCTION public.trigger_sales_outreach()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public.call_agent_if_not_debounced('sales_outreach', 'ayn-sales-outreach',
    jsonb_build_object('source', 'event_trigger', 'trigger_table', 'ayn_sales_pipeline', 'record_id', NEW.id, 'company', NEW.company_name));
  RETURN NEW;
END; $$;

CREATE TRIGGER on_new_pipeline_lead AFTER INSERT ON public.ayn_sales_pipeline
  FOR EACH ROW EXECUTE FUNCTION public.trigger_sales_outreach();

-- Investigator
CREATE OR REPLACE FUNCTION public.trigger_investigator()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status IN ('new', 'needs_investigation') AND (OLD.status IS DISTINCT FROM NEW.status OR TG_OP = 'INSERT') THEN
    PERFORM public.call_agent_if_not_debounced('investigator', 'ayn-investigator',
      jsonb_build_object('source', 'event_trigger', 'trigger_table', 'ayn_sales_pipeline', 'record_id', NEW.id, 'status', NEW.status));
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_lead_needs_investigation AFTER INSERT OR UPDATE ON public.ayn_sales_pipeline
  FOR EACH ROW EXECUTE FUNCTION public.trigger_investigator();

-- Customer Success
CREATE OR REPLACE FUNCTION public.trigger_customer_success()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public.call_agent_if_not_debounced('customer_success', 'ayn-customer-success',
    jsonb_build_object('source', 'event_trigger', 'trigger_table', 'contact_messages', 'record_id', NEW.id));
  RETURN NEW;
END; $$;

CREATE TRIGGER on_new_contact_message AFTER INSERT ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.trigger_customer_success();

-- Outcome Evaluator
CREATE OR REPLACE FUNCTION public.trigger_outcome_evaluator()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public.call_agent_if_not_debounced('outcome_evaluator', 'ayn-unified',
    jsonb_build_object('source', 'event_trigger', 'trigger_table', 'employee_reflections', 'record_id', NEW.id, 'employee_id', NEW.employee_id, 'agent_override', 'outcome_evaluator'));
  RETURN NEW;
END; $$;

CREATE TRIGGER on_new_reflection AFTER INSERT ON public.employee_reflections
  FOR EACH ROW EXECUTE FUNCTION public.trigger_outcome_evaluator();

-- Chief of Staff
CREATE OR REPLACE FUNCTION public.trigger_chief_of_staff()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.type = 'employee_report' THEN
    PERFORM public.call_agent_if_not_debounced('chief_of_staff', 'ayn-unified',
      jsonb_build_object('source', 'event_trigger', 'trigger_table', 'ayn_mind', 'record_id', NEW.id, 'agent_override', 'chief_of_staff'));
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_employee_report AFTER INSERT ON public.ayn_mind
  FOR EACH ROW EXECUTE FUNCTION public.trigger_chief_of_staff();

-- Marketing
CREATE OR REPLACE FUNCTION public.trigger_marketing()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public.call_agent_if_not_debounced('marketing', 'ayn-unified',
    jsonb_build_object('source', 'event_trigger', 'trigger_table', TG_TABLE_NAME, 'record_id', NEW.id, 'agent_override', 'marketing'));
  RETURN NEW;
END; $$;

CREATE TRIGGER on_twitter_post_activity AFTER INSERT OR UPDATE ON public.twitter_posts
  FOR EACH ROW EXECUTE FUNCTION public.trigger_marketing();

-- =====================================================
-- Step 4: Safely remove cron jobs (ignore missing ones)
-- =====================================================
DO $$
DECLARE
  job_names TEXT[] := ARRAY[
    'ayn-qa-watchdog-loop', 'ayn-security-guard-loop', 'ayn-chief-of-staff-loop',
    'ayn-sales-outreach-loop', 'ayn-marketing-loop', 'ayn-follow-up-loop',
    'ayn-investigator-loop', 'ayn-customer-success-loop', 'ayn-outcome-evaluator-loop',
    'ayn-advisor-loop', 'ayn-innovation-loop', 'ayn-hr-loop',
    'ayn-lawyer-loop', 'ayn-proactive-loop'
  ];
  job TEXT;
BEGIN
  FOREACH job IN ARRAY job_names LOOP
    BEGIN
      PERFORM cron.unschedule(job);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Cron job % not found, skipping', job;
    END;
  END LOOP;
END;
$$;
