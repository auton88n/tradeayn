
-- Part D: Update the trigger so it does NOT touch current_balance on close
-- (ayn-close-trade now manages current_balance directly)
CREATE OR REPLACE FUNCTION public.update_ayn_account_state()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

    -- Update ONLY stats columns — current_balance is managed by edge functions
    UPDATE public.ayn_account_state
    SET
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
$function$;
