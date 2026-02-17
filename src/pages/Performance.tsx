import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { TrendingUp, TrendingDown, Activity, Target, BarChart3, Clock, Award, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import AIDecisionLog from '@/components/trading/AIDecisionLog';

// Types
interface AccountState {
  current_balance: number;
  starting_balance: number;
  total_pnl_dollars: number;
  total_pnl_percent: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  largest_win_percent: number;
  largest_loss_percent: number;
}

interface PaperTrade {
  id: string;
  ticker: string;
  timeframe: string;
  signal: string;
  entry_price: number;
  entry_time: string;
  position_size_percent: number;
  position_size_dollars: number;
  shares_or_coins: number;
  stop_loss_price: number;
  take_profit_1_price: number | null;
  take_profit_2_price: number | null;
  exit_price: number | null;
  exit_time: string | null;
  exit_reason: string | null;
  partial_exits: any[];
  pnl_dollars: number;
  pnl_percent: number;
  status: string;
  confidence_score: number | null;
  setup_type: string | null;
  reasoning: string | null;
  market_context: any;
  created_at: string;
}

interface DailySnapshot {
  snapshot_date: string;
  balance: number;
  daily_pnl_dollars: number;
}

interface SetupPerf {
  setup_type: string;
  total_trades: number;
  winning_trades: number;
  win_rate: number;
  avg_win_percent: number;
  avg_loss_percent: number;
  profit_factor: number;
}

// ─── Stats Card ───
function StatsCard({ title, value, subtitle, positive }: {
  title: string; value: string; subtitle?: string; positive?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <p className="text-xs text-muted-foreground mb-1">{title}</p>
        <p className={`text-2xl font-bold ${positive === true ? 'text-green-500' : positive === false ? 'text-red-500' : ''}`}>
          {value}
        </p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Open Position Card ───
function OpenPositionCard({ trade }: { trade: PaperTrade }) {
  const entryPrice = Number(trade.entry_price);
  const unrealizedPnl = Number(trade.pnl_dollars);
  const unrealizedPercent = trade.position_size_dollars > 0
    ? (unrealizedPnl / Number(trade.position_size_dollars)) * 100 : 0;

  return (
    <div className="bg-card/50 rounded-lg p-4 border border-border/50">
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="text-lg font-bold">{trade.ticker}</span>
          <Badge variant="outline" className={`ml-2 text-[10px] ${trade.signal === 'BUY' ? 'text-green-500 border-green-500/30' : 'text-red-500 border-red-500/30'}`}>
            {trade.signal}
          </Badge>
          {trade.setup_type && (
            <Badge variant="secondary" className="ml-1 text-[10px]">{trade.setup_type}</Badge>
          )}
        </div>
        <div className={`text-right ${unrealizedPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          <span className="text-sm font-bold">
            {unrealizedPnl >= 0 ? '+' : ''}{unrealizedPercent.toFixed(2)}%
          </span>
          <br />
          <span className="text-xs">${unrealizedPnl.toFixed(2)}</span>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 text-xs">
        <div><span className="text-muted-foreground">Entry</span><br /><span className="font-medium">${entryPrice.toFixed(2)}</span></div>
        <div><span className="text-muted-foreground">Stop</span><br /><span className="font-medium text-red-400">${Number(trade.stop_loss_price).toFixed(2)}</span></div>
        <div><span className="text-muted-foreground">TP1</span><br /><span className="font-medium text-green-400">{trade.take_profit_1_price ? `$${Number(trade.take_profit_1_price).toFixed(2)}` : '—'}</span></div>
        <div><span className="text-muted-foreground">Size</span><br /><span className="font-medium">{trade.position_size_percent}%</span></div>
      </div>
      {trade.partial_exits && trade.partial_exits.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border/30">
          {trade.partial_exits.map((exit: any, i: number) => (
            <p key={i} className="text-[11px] text-green-400">✓ {exit.percent}% @ ${exit.price} (+${Number(exit.pnl).toFixed(2)})</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Trade Row ───
function TradeRow({ trade }: { trade: PaperTrade }) {
  const isWin = Number(trade.pnl_dollars) > 0;
  const duration = trade.exit_time && trade.entry_time
    ? Math.round((new Date(trade.exit_time).getTime() - new Date(trade.entry_time).getTime()) / (1000 * 60 * 60))
    : null;

  return (
    <div className={`grid grid-cols-7 gap-2 py-2.5 px-3 text-xs border-b border-border/30 ${isWin ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
      <div className="font-medium">{trade.ticker}</div>
      <div><Badge variant="outline" className={`text-[10px] ${trade.signal === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>{trade.signal}</Badge></div>
      <div>${Number(trade.entry_price).toFixed(2)}</div>
      <div>{trade.exit_price ? `$${Number(trade.exit_price).toFixed(2)}` : '—'}</div>
      <div className={isWin ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
        {isWin ? '+' : ''}{Number(trade.pnl_percent).toFixed(2)}%
      </div>
      <div className="text-muted-foreground">{trade.setup_type || '—'}</div>
      <div className="text-muted-foreground">{duration !== null ? `${duration}h` : '—'}</div>
    </div>
  );
}

// ─── Main Page ───
export default function Performance() {
  const navigate = useNavigate();
  const [account, setAccount] = useState<AccountState | null>(null);
  const [openTrades, setOpenTrades] = useState<PaperTrade[]>([]);
  const [closedTrades, setClosedTrades] = useState<PaperTrade[]>([]);
  const [allTrades, setAllTrades] = useState<PaperTrade[]>([]);
  const [snapshots, setSnapshots] = useState<DailySnapshot[]>([]);
  const [setupPerf, setSetupPerf] = useState<SetupPerf[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  const loadData = useCallback(async () => {
    const [acctRes, openRes, closedRes, snapRes, setupRes, allTradesRes] = await Promise.all([
      supabase.from('ayn_account_state').select('*').eq('id', '00000000-0000-0000-0000-000000000001').single(),
      supabase.from('ayn_paper_trades').select('*').in('status', ['OPEN', 'PARTIAL_CLOSE']).order('entry_time', { ascending: false }),
      supabase.from('ayn_paper_trades').select('*').in('status', ['CLOSED_WIN', 'CLOSED_LOSS', 'STOPPED_OUT']).order('exit_time', { ascending: false }).limit(20),
      supabase.from('ayn_daily_snapshots').select('*').order('snapshot_date', { ascending: true }).limit(90),
      supabase.from('ayn_setup_performance').select('*').order('total_trades', { ascending: false }),
      supabase.from('ayn_paper_trades').select('*').order('created_at', { ascending: false }).limit(50),
    ]);

    if (acctRes.data) setAccount(acctRes.data as any);
    if (openRes.data) setOpenTrades(openRes.data as any);
    if (closedRes.data) setClosedTrades(closedRes.data as any);
    if (snapRes.data) setSnapshots(snapRes.data as any);
    if (setupRes.data) setSetupPerf(setupRes.data as any);
    if (allTradesRes.data) setAllTrades(allTradesRes.data as any);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);

    // Realtime subscriptions
    const tradesChannel = supabase
      .channel('trades-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ayn_paper_trades' }, () => {
        loadData();
      })
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    const accountChannel = supabase
      .channel('account-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ayn_account_state' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(tradesChannel);
      supabase.removeChannel(accountChannel);
    };
  }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground text-sm">Loading AYN's performance...</p>
        </div>
      </div>
    );
  }

  const pnlPositive = account ? account.total_pnl_dollars > 0 : false;

  return (
    <>
      <Helmet>
        <title>AYN Trading Performance | Live Paper Trading Results</title>
        <meta name="description" content="Track AYN's live paper trading performance — win rate, P&L, open positions, and trade history with full transparency." />
      </Helmet>

      <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="gap-2 bg-muted/50 backdrop-blur-sm rounded-full px-4 hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-7 w-7 text-primary" />
            AYN's Trading Performance
            {isLive && (
              <span className="relative flex h-2.5 w-2.5 ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live paper trading account — full transparency • {isLive ? 'Real-time updates' : 'Updates every 30s'}
          </p>
        </div>

        {/* Stats Grid */}
        {account && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatsCard
              title="Account Balance"
              value={`$${Number(account.current_balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              subtitle={`Started: $${Number(account.starting_balance).toLocaleString()}`}
              positive={pnlPositive}
            />
            <StatsCard
              title="Total P&L"
              value={`${pnlPositive ? '+' : ''}${Number(account.total_pnl_percent).toFixed(2)}%`}
              subtitle={`$${pnlPositive ? '+' : ''}${Number(account.total_pnl_dollars).toFixed(2)}`}
              positive={pnlPositive}
            />
            <StatsCard
              title="Win Rate"
              value={`${Number(account.win_rate).toFixed(1)}%`}
              subtitle={`${account.winning_trades}W / ${account.losing_trades}L`}
            />
            <StatsCard
              title="Total Trades"
              value={String(account.total_trades)}
              subtitle={account.total_trades > 0 ? `Avg ${(Number(account.total_pnl_percent) / account.total_trades).toFixed(2)}%/trade` : 'No trades yet'}
            />
          </div>
        )}

        {/* Equity Curve */}
        {snapshots.length > 1 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Account Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={snapshots}>
                  <defs>
                    <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="snapshot_date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" fill="url(#balanceGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Open Positions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Open Positions
              <Badge variant="secondary" className="text-[10px]">{openTrades.length}/3</Badge>
              {isLive && (
                <span className="relative flex h-2 w-2 ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {openTrades.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No open positions. Waiting for high-conviction setup...
              </p>
            ) : (
              <div className="space-y-3">
                {openTrades.map(trade => (
                  <OpenPositionCard key={trade.id} trade={trade} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Closed Trades */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4" /> Recent Trades
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {closedTrades.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6 px-4">
                No closed trades yet. Trades will appear here once positions are closed.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-2 py-2 px-3 text-[10px] uppercase tracking-wider text-muted-foreground font-medium border-b border-border">
                  <div>Ticker</div><div>Signal</div><div>Entry</div><div>Exit</div><div>P&L</div><div>Setup</div><div>Duration</div>
                </div>
                {closedTrades.map(trade => (
                  <TradeRow key={trade.id} trade={trade} />
                ))}
              </>
            )}
          </CardContent>
        </Card>

        {/* AI Decision Log */}
        <AIDecisionLog trades={allTrades} />

        {/* Setup Performance */}
        {setupPerf.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Setup Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-5 gap-2 py-2 px-3 text-[10px] uppercase tracking-wider text-muted-foreground font-medium border-b border-border">
                <div>Setup</div><div>Trades</div><div>Win Rate</div><div>Avg Win</div><div>P/F</div>
              </div>
              {setupPerf.map(s => (
                <div key={s.setup_type} className="grid grid-cols-5 gap-2 py-2 px-3 text-xs border-b border-border/30">
                  <div className="font-medium">{s.setup_type}</div>
                  <div>{s.total_trades} ({s.winning_trades}W)</div>
                  <div className={Number(s.win_rate) >= 60 ? 'text-green-500' : 'text-muted-foreground'}>{Number(s.win_rate).toFixed(0)}%</div>
                  <div className="text-green-500">+{Number(s.avg_win_percent).toFixed(1)}%</div>
                  <div>{Number(s.profit_factor).toFixed(2)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <p className="text-[11px] text-muted-foreground text-center italic">
          Paper trading account starting at $10,000. All trades are automatically generated by AYN's chart analysis.
        </p>
      </div>
    </>
  );
}
