
-- Phase 1: Add 5 new columns to employee_states for Layer 3
ALTER TABLE public.employee_states
  ADD COLUMN IF NOT EXISTS peer_models jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS initiative_score double precision NOT NULL DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS reputation_score double precision NOT NULL DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS cognitive_load double precision NOT NULL DEFAULT 0.2,
  ADD COLUMN IF NOT EXISTS emotional_memory jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Seed peer_models with neutral 0.5 trust for all 13 agents
-- Each agent gets a trust map toward every OTHER agent
UPDATE public.employee_states SET peer_models = jsonb_build_object(
  'advisor', 0.5, 'chief_of_staff', 0.5, 'customer_success', 0.5,
  'follow_up', 0.5, 'hr_manager', 0.5, 'innovation', 0.5,
  'investigator', 0.5, 'lawyer', 0.5, 'marketing', 0.5,
  'qa_watchdog', 0.5, 'sales', 0.5, 'security_guard', 0.5, 'system', 0.5
);

-- Set initial values for all agents
UPDATE public.employee_states SET
  initiative_score = 0.5,
  reputation_score = 0.5,
  cognitive_load = 0.2,
  emotional_memory = '[]'::jsonb;

-- Update founder_model for system agent with dynamic psychology fields
UPDATE public.employee_states SET founder_model = COALESCE(founder_model, '{}'::jsonb) || jsonb_build_object(
  'current_mood', 'neutral',
  'trust_trajectory', 'stable',
  'recent_overrides', 0,
  'delegation_comfort', 0.5,
  'attention_patterns', '[]'::jsonb,
  'frustration_signals', 0.0
)
WHERE employee_id = 'system';
