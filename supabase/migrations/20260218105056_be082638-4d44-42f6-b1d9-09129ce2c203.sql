
-- Migration 1: Add advanced performance metrics to ayn_account_state
ALTER TABLE ayn_account_state
  ADD COLUMN IF NOT EXISTS sharpe_ratio DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sortino_ratio DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profit_factor DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expectancy DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_trade_duration_hours DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_win_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_loss_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_win_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_loss_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_drawdown_duration_days INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recovery_factor DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_win_size DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_loss_size DECIMAL DEFAULT 0;

-- Migration 2: Add position sizing reasoning to ayn_paper_trades
ALTER TABLE ayn_paper_trades
  ADD COLUMN IF NOT EXISTS position_sizing_reasoning TEXT[] DEFAULT '{}';
