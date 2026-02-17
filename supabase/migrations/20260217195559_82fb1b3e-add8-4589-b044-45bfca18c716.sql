
-- ============================================================================
-- AYN PAPER TRADING SYSTEM
-- ============================================================================

-- 1. ACCOUNT STATE (AYN's trading account - single row)
CREATE TABLE public.ayn_account_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  starting_balance DECIMAL NOT NULL DEFAULT 10000.00,
  current_balance DECIMAL NOT NULL DEFAULT 10000.00,
  total_pnl_dollars DECIMAL NOT NULL DEFAULT 0,
  total_pnl_percent DECIMAL NOT NULL DEFAULT 0,
  total_trades INTEGER NOT NULL DEFAULT 0,
  winning_trades INTEGER NOT NULL DEFAULT 0,
  losing_trades INTEGER NOT NULL DEFAULT 0,
  win_rate DECIMAL NOT NULL DEFAULT 0,
  largest_win_percent DECIMAL DEFAULT 0,
  largest_loss_percent DECIMAL DEFAULT 0,
  max_drawdown_percent DECIMAL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial account
INSERT INTO public.ayn_account_state (id) 
VALUES ('00000000-0000-0000-0000-000000000001');

-- 2. PAPER TRADES
CREATE TABLE public.ayn_paper_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  signal TEXT NOT NULL,
  entry_price DECIMAL NOT NULL,
  entry_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  position_size_percent DECIMAL NOT NULL,
  position_size_dollars DECIMAL NOT NULL,
  shares_or_coins DECIMAL NOT NULL,
  stop_loss_price DECIMAL NOT NULL,
  take_profit_1_price DECIMAL,
  take_profit_2_price DECIMAL,
  take_profit_1_percent DECIMAL DEFAULT 50,
  take_profit_2_percent DECIMAL DEFAULT 50,
  exit_price DECIMAL,
  exit_time TIMESTAMPTZ,
  exit_reason TEXT,
  partial_exits JSONB DEFAULT '[]',
  pnl_dollars DECIMAL DEFAULT 0,
  pnl_percent DECIMAL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'OPEN',
  confidence_score INTEGER,
  setup_type TEXT,
  reasoning TEXT,
  chart_image_url TEXT,
  market_context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ayn_trades_status ON public.ayn_paper_trades(status);
CREATE INDEX idx_ayn_trades_ticker ON public.ayn_paper_trades(ticker);
CREATE INDEX idx_ayn_trades_entry_time ON public.ayn_paper_trades(entry_time DESC);
CREATE INDEX idx_ayn_trades_signal ON public.ayn_paper_trades(signal);

-- 3. DAILY SNAPSHOTS
CREATE TABLE public.ayn_daily_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL UNIQUE,
  balance DECIMAL NOT NULL,
  daily_pnl_dollars DECIMAL DEFAULT 0,
  daily_pnl_percent DECIMAL DEFAULT 0,
  open_positions INTEGER DEFAULT 0,
  trades_closed_today INTEGER DEFAULT 0,
  wins_today INTEGER DEFAULT 0,
  losses_today INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_snapshots_date ON public.ayn_daily_snapshots(snapshot_date DESC);

-- 4. WEEKLY SUMMARIES
CREATE TABLE public.ayn_weekly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  starting_balance DECIMAL NOT NULL,
  ending_balance DECIMAL NOT NULL,
  weekly_pnl_dollars DECIMAL NOT NULL,
  weekly_pnl_percent DECIMAL NOT NULL,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  win_rate DECIMAL DEFAULT 0,
  best_trade_ticker TEXT,
  best_trade_pnl_percent DECIMAL,
  worst_trade_ticker TEXT,
  worst_trade_pnl_percent DECIMAL,
  best_setup_type TEXT,
  worst_setup_type TEXT,
  commentary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_weekly_week_start ON public.ayn_weekly_summaries(week_start DESC);

-- 5. SETUP PERFORMANCE
CREATE TABLE public.ayn_setup_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setup_type TEXT NOT NULL UNIQUE,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  win_rate DECIMAL DEFAULT 0,
  avg_win_percent DECIMAL DEFAULT 0,
  avg_loss_percent DECIMAL DEFAULT 0,
  total_pnl_percent DECIMAL DEFAULT 0,
  profit_factor DECIMAL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TRIGGER: Auto-update account state when trade closes
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_ayn_account_state()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('CLOSED_WIN', 'CLOSED_LOSS', 'STOPPED_OUT') 
     AND OLD.status IN ('OPEN', 'PARTIAL_CLOSE') THEN
    
    UPDATE public.ayn_account_state
    SET 
      current_balance = current_balance + NEW.pnl_dollars,
      total_pnl_dollars = total_pnl_dollars + NEW.pnl_dollars,
      total_pnl_percent = ((current_balance + NEW.pnl_dollars - starting_balance) / starting_balance) * 100,
      total_trades = total_trades + 1,
      winning_trades = winning_trades + CASE WHEN NEW.pnl_dollars > 0 THEN 1 ELSE 0 END,
      losing_trades = losing_trades + CASE WHEN NEW.pnl_dollars <= 0 THEN 1 ELSE 0 END,
      win_rate = CASE WHEN total_trades + 1 > 0 
        THEN (winning_trades + CASE WHEN NEW.pnl_dollars > 0 THEN 1 ELSE 0 END)::DECIMAL / (total_trades + 1) * 100
        ELSE 0 END,
      largest_win_percent = GREATEST(largest_win_percent, NEW.pnl_percent),
      largest_loss_percent = LEAST(largest_loss_percent, NEW.pnl_percent),
      updated_at = NOW()
    WHERE id = '00000000-0000-0000-0000-000000000001';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_ayn_account_state
AFTER UPDATE ON public.ayn_paper_trades
FOR EACH ROW
EXECUTE FUNCTION public.update_ayn_account_state();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.ayn_account_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ayn_paper_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ayn_daily_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ayn_weekly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ayn_setup_performance ENABLE ROW LEVEL SECURITY;

-- Public read access (transparency)
CREATE POLICY "Public read ayn_account_state" ON public.ayn_account_state FOR SELECT USING (true);
CREATE POLICY "Public read ayn_paper_trades" ON public.ayn_paper_trades FOR SELECT USING (true);
CREATE POLICY "Public read ayn_daily_snapshots" ON public.ayn_daily_snapshots FOR SELECT USING (true);
CREATE POLICY "Public read ayn_weekly_summaries" ON public.ayn_weekly_summaries FOR SELECT USING (true);
CREATE POLICY "Public read ayn_setup_performance" ON public.ayn_setup_performance FOR SELECT USING (true);
