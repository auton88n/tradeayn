
-- ============================================================
-- 1. Fix update_ayn_account_state trigger bug (win_rate off-by-one)
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_ayn_account_state()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_winning_trades INTEGER;
  v_current_total_trades   INTEGER;
  v_is_win                 BOOLEAN;
  v_new_winning            INTEGER;
  v_new_total              INTEGER;
BEGIN
  IF NEW.status IN ('CLOSED_WIN', 'CLOSED_LOSS', 'STOPPED_OUT')
     AND OLD.status IN ('OPEN', 'PARTIAL_CLOSE') THEN

    -- Capture pre-update values first to avoid calculation-order bug
    SELECT winning_trades, total_trades
      INTO v_current_winning_trades, v_current_total_trades
      FROM public.ayn_account_state
     WHERE id = '00000000-0000-0000-0000-000000000001';

    v_is_win        := NEW.pnl_dollars > 0;
    v_new_winning   := v_current_winning_trades + CASE WHEN v_is_win THEN 1 ELSE 0 END;
    v_new_total     := v_current_total_trades + 1;

    UPDATE public.ayn_account_state
    SET
      current_balance    = current_balance + NEW.pnl_dollars,
      total_pnl_dollars  = total_pnl_dollars + NEW.pnl_dollars,
      total_pnl_percent  = ((current_balance + NEW.pnl_dollars - starting_balance) / starting_balance) * 100,
      total_trades       = v_new_total,
      winning_trades     = v_new_winning,
      losing_trades      = losing_trades + CASE WHEN v_is_win THEN 0 ELSE 1 END,
      win_rate           = CASE WHEN v_new_total > 0
                             THEN v_new_winning::DECIMAL / v_new_total * 100
                             ELSE 0 END,
      largest_win_percent  = GREATEST(COALESCE(largest_win_percent, NEW.pnl_percent), NEW.pnl_percent),
      largest_loss_percent = LEAST(COALESCE(largest_loss_percent, NEW.pnl_percent), NEW.pnl_percent),
      updated_at         = NOW()
    WHERE id = '00000000-0000-0000-0000-000000000001';
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 2. Create update_setup_performance trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_setup_performance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_setup         TEXT;
  v_is_win        BOOLEAN;
  v_prev_wins     INTEGER;
  v_prev_losses   INTEGER;
  v_prev_total    INTEGER;
  v_new_wins      INTEGER;
  v_new_losses    INTEGER;
  v_new_total     INTEGER;
  v_total_win_pnl DECIMAL;
  v_total_los_pnl DECIMAL;
BEGIN
  IF NEW.status IN ('CLOSED_WIN', 'CLOSED_LOSS', 'STOPPED_OUT')
     AND OLD.status IN ('OPEN', 'PARTIAL_CLOSE') THEN

    v_setup  := COALESCE(NEW.setup_type, 'UNKNOWN');
    v_is_win := NEW.pnl_dollars > 0;

    -- Ensure row exists
    INSERT INTO public.ayn_setup_performance (setup_type, total_trades, winning_trades, losing_trades,
      win_rate, avg_win_percent, avg_loss_percent, total_pnl_percent, profit_factor)
    VALUES (v_setup, 0, 0, 0, 0, 0, 0, 0, 0)
    ON CONFLICT (setup_type) DO NOTHING;

    -- Capture current counters before update
    SELECT COALESCE(winning_trades, 0), COALESCE(losing_trades, 0), COALESCE(total_trades, 0)
      INTO v_prev_wins, v_prev_losses, v_prev_total
      FROM public.ayn_setup_performance
     WHERE setup_type = v_setup;

    v_new_wins   := v_prev_wins   + CASE WHEN v_is_win THEN 1 ELSE 0 END;
    v_new_losses := v_prev_losses + CASE WHEN v_is_win THEN 0 ELSE 1 END;
    v_new_total  := v_prev_total  + 1;

    -- Recalculate profit factor from actual trade data (avoids drift)
    SELECT
      COALESCE(SUM(pnl_percent) FILTER (WHERE pnl_dollars > 0 AND (setup_type = v_setup OR (setup_type IS NULL AND v_setup = 'UNKNOWN'))), 0),
      ABS(COALESCE(SUM(pnl_percent) FILTER (WHERE pnl_dollars <= 0 AND (setup_type = v_setup OR (setup_type IS NULL AND v_setup = 'UNKNOWN'))), 0))
    INTO v_total_win_pnl, v_total_los_pnl
    FROM public.ayn_paper_trades
    WHERE status IN ('CLOSED_WIN', 'CLOSED_LOSS', 'STOPPED_OUT')
      AND (setup_type = v_setup OR (setup_type IS NULL AND v_setup = 'UNKNOWN'));

    -- Include current closing trade
    IF v_is_win THEN
      v_total_win_pnl := v_total_win_pnl + COALESCE(NEW.pnl_percent, 0);
    ELSE
      v_total_los_pnl := v_total_los_pnl + ABS(COALESCE(NEW.pnl_percent, 0));
    END IF;

    UPDATE public.ayn_setup_performance
    SET
      total_trades      = v_new_total,
      winning_trades    = v_new_wins,
      losing_trades     = v_new_losses,
      win_rate          = CASE WHEN v_new_total > 0 THEN v_new_wins::DECIMAL / v_new_total * 100 ELSE 0 END,
      total_pnl_percent = COALESCE(total_pnl_percent, 0) + COALESCE(NEW.pnl_percent, 0),
      avg_win_percent   = CASE WHEN v_new_wins > 0 THEN v_total_win_pnl / v_new_wins ELSE 0 END,
      avg_loss_percent  = CASE WHEN v_new_losses > 0 THEN -v_total_los_pnl / v_new_losses ELSE 0 END,
      profit_factor     = CASE WHEN v_total_los_pnl > 0 THEN v_total_win_pnl / v_total_los_pnl ELSE NULL END,
      updated_at        = NOW()
    WHERE setup_type = v_setup;

  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_setup_performance ON public.ayn_paper_trades;
CREATE TRIGGER trigger_update_setup_performance
  AFTER UPDATE ON public.ayn_paper_trades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_setup_performance();

-- ============================================================
-- 3. Create ayn_error_log table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ayn_error_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type    TEXT NOT NULL,
  component     TEXT NOT NULL,
  operation     TEXT,
  error_message TEXT,
  context       JSONB DEFAULT '{}',
  severity      TEXT DEFAULT 'ERROR',
  resolved      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ayn_error_log_component  ON public.ayn_error_log(component, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ayn_error_log_unresolved ON public.ayn_error_log(resolved) WHERE resolved = FALSE;

ALTER TABLE public.ayn_error_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin read error log" ON public.ayn_error_log;
CREATE POLICY "Admin read error log" ON public.ayn_error_log
  FOR SELECT USING ((auth.jwt() ->> 'role') = 'admin');

-- ============================================================
-- 4. Create ayn_circuit_breakers table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ayn_circuit_breakers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breaker_type    TEXT NOT NULL UNIQUE,
  is_tripped      BOOLEAN DEFAULT FALSE,
  tripped_at      TIMESTAMPTZ,
  reason          TEXT,
  threshold_value DECIMAL,
  current_value   DECIMAL,
  auto_reset      BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ayn_circuit_breakers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read circuit breakers" ON public.ayn_circuit_breakers;
CREATE POLICY "Public read circuit breakers" ON public.ayn_circuit_breakers
  FOR SELECT USING (true);
