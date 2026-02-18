
INSERT INTO public.ayn_circuit_breakers (breaker_type, is_tripped, auto_reset, threshold_value, reason)
VALUES 
  ('KILL_SWITCH',      FALSE, FALSE, NULL, NULL),
  ('DAILY_LOSS_LIMIT', FALSE, TRUE,  -5,   NULL)
ON CONFLICT (breaker_type) DO NOTHING;
