import { useState, memo } from 'react';
import { BarChart3, Upload, Brain, TrendingUp, Shield, Target, ArrowRight, ChevronRight, Zap, Award, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthModal } from './auth/AuthModal';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { motion } from 'framer-motion';
import { SEO } from '@/components/shared/SEO';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: 'easeOut' as const },
});

const LandingPage = memo(() => {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <SEO
        title="AYN Trade — AI Chart Analysis in Seconds"
        description="Upload any trading chart. AYN's AI reads RSI, EMA, MACD, Wyckoff patterns and delivers a full professional analysis: entry, stop loss, take profits, and R:R ratio."
        canonical="/"
        keywords="AI chart analysis, trading chart analyzer, technical analysis AI, RSI MACD EMA, Wyckoff analysis, trading signals, stop loss take profit, risk reward ratio"
      />

      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

        {/* ── Navbar ── */}
        <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border/40">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            <span className="font-display font-bold text-lg tracking-tight">AYN Trade</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button
              onClick={() => setShowAuth(true)}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-full px-5 h-9 text-sm"
            >
              Get Started
            </Button>
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-16 px-6 text-center overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[radial-gradient(ellipse_at_center,hsl(38_95%_54%_/_0.12)_0%,transparent_70%)]" />
          </div>

          <motion.div {...fadeUp(0)} className="mb-3">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold tracking-widest uppercase">
              <Zap className="w-3 h-3" /> AI-Powered Technical Analysis
            </span>
          </motion.div>

          <motion.h1
            {...fadeUp(0.08)}
            className="font-display font-bold text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-[-0.03em] leading-[0.95] max-w-4xl mb-6"
          >
            Upload a chart.<br />
            <span className="text-amber-500">Get a pro analysis.</span>
          </motion.h1>

          <motion.p
            {...fadeUp(0.16)}
            className="text-lg md:text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed"
          >
            AYN reads RSI, EMA, MACD, Wyckoff phases and more — and returns a full trade setup in seconds. Entry, stop loss, take profits, R:R ratio, and AI coaching.
          </motion.p>

          <motion.div {...fadeUp(0.22)} className="flex flex-col sm:flex-row items-center gap-3">
            <Button
              onClick={() => setShowAuth(true)}
              size="lg"
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-full px-8 h-12 text-base shadow-lg shadow-amber-500/20 group"
            >
              Analyze Your First Chart
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </Button>
            <span className="text-xs text-muted-foreground">Free to start · No credit card required</span>
          </motion.div>

          {/* Chart mockup preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16 w-full max-w-3xl mx-auto"
          >
            <ChartMockup />
          </motion.div>
        </section>

        {/* ── How It Works ── */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="font-display font-bold text-3xl md:text-5xl tracking-[-0.02em] mb-4">How it works</h2>
              <p className="text-muted-foreground text-lg">Three steps from screenshot to trade setup.</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  step: '01',
                  icon: <Upload className="w-6 h-6" />,
                  title: 'Upload your chart',
                  desc: 'Take a screenshot of any trading chart — crypto, forex, stocks. Any timeframe, any exchange.',
                },
                {
                  step: '02',
                  icon: <Brain className="w-6 h-6" />,
                  title: 'AYN reads the technicals',
                  desc: 'AYN identifies RSI, EMA, MACD, Bollinger Bands, Wyckoff phases, order blocks, and market structure.',
                },
                {
                  step: '03',
                  icon: <Target className="w-6 h-6" />,
                  title: 'Get a full trade setup',
                  desc: 'Signal direction, entry price, stop loss, two take profit levels, R:R ratio, and invalidation condition.',
                },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="relative p-6 rounded-2xl bg-card border border-border/60 hover:border-amber-500/40 transition-colors group"
                >
                  <div className="absolute top-4 right-4 text-5xl font-display font-bold text-muted/30 leading-none select-none">
                    {item.step}
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4 group-hover:bg-amber-500/20 transition-colors">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What You Get ── */}
        <section className="py-24 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="font-display font-bold text-3xl md:text-5xl tracking-[-0.02em] mb-4">Everything in one analysis</h2>
              <p className="text-muted-foreground text-lg">A complete trade plan — not just a vague signal.</p>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: <Award className="w-4 h-4" />, label: 'Confidence Score', desc: 'How strong is the setup — 0 to 100.' },
                { icon: <TrendingUp className="w-4 h-4" />, label: 'Entry Price & Order Type', desc: 'Limit or market, with exact price level.' },
                { icon: <Shield className="w-4 h-4" />, label: 'Stop Loss', desc: 'With % distance from entry, clearly defined.' },
                { icon: <Target className="w-4 h-4" />, label: 'Take Profit 1 & 2', desc: 'Two tiered exits for partial and full close.' },
                { icon: <Activity className="w-4 h-4" />, label: 'Risk:Reward Ratio', desc: 'Calculated automatically from your levels.' },
                { icon: <Zap className="w-4 h-4" />, label: 'Invalidation Condition', desc: 'Know exactly when the thesis is wrong.' },
                { icon: <Brain className="w-4 h-4" />, label: 'AI Coaching', desc: 'Ask follow-up questions about the chart.' },
                { icon: <ChevronRight className="w-4 h-4" />, label: 'Technical Indicators', desc: 'RSI, EMA, MACD, Wyckoff, Order Blocks.' },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="flex items-start gap-4 p-5 rounded-xl bg-card border border-border/60"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-sm mb-0.5">{item.label}</div>
                    <div className="text-muted-foreground text-xs leading-relaxed">{item.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── AYN Paper Trading ── */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-card to-card border border-amber-500/20 p-8 md:p-12"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold mb-4">
                    <Activity className="w-3 h-3" /> Live Paper Trading
                  </div>
                  <h2 className="font-display font-bold text-2xl md:text-3xl tracking-[-0.02em] mb-3">
                    AYN trades its own signals
                  </h2>
                  <p className="text-muted-foreground leading-relaxed max-w-lg">
                    AYN paper-trades every signal it generates — live, with real market prices. Track its win rate, P&L, Sharpe ratio, and every open position in the Performance tab.
                  </p>
                </div>
                <div className="flex flex-col gap-4 shrink-0 w-full md:w-auto">
                  {[
                    { label: 'Live Positions', value: 'Real-time' },
                    { label: 'Performance', value: 'Full Stats' },
                    { label: 'History', value: 'Every Trade' },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between gap-8 px-5 py-3 rounded-xl bg-background border border-border/60 min-w-[200px]">
                      <span className="text-sm text-muted-foreground">{stat.label}</span>
                      <span className="font-bold text-sm text-amber-500">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="py-24 px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="font-display font-bold text-3xl md:text-5xl tracking-[-0.02em] mb-4">
              Start analyzing free
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Upload your first chart today. No credit card needed.
            </p>
            <Button
              onClick={() => setShowAuth(true)}
              size="lg"
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-full px-10 h-13 text-base shadow-lg shadow-amber-500/20 group"
            >
              Analyze Your First Chart
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </motion.div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-border/40 py-8 px-6">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-500" />
              <span className="font-display font-semibold text-foreground">AYN Trade</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
              <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="/pricing" className="hover:text-foreground transition-colors">Pricing</a>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </footer>

        {showAuth && (
          <AuthModal
            open={showAuth}
            onOpenChange={(v) => setShowAuth(v)}
          />
        )}
      </div>
    </>
  );
});

// ── Inline chart mockup SVG ──
const ChartMockup = () => (
  <div className="relative rounded-2xl overflow-hidden border border-border/60 bg-card shadow-2xl shadow-black/10">
    {/* Toolbar */}
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 bg-card">
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-400/60" />
        <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
        <div className="w-3 h-3 rounded-full bg-green-400/60" />
      </div>
      <div className="flex items-center gap-2 ml-2">
        <BarChart3 className="w-4 h-4 text-amber-500" />
        <span className="text-xs font-semibold text-muted-foreground">BTC/USDT · 4H</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 font-semibold">LONG</span>
        <span className="text-xs text-muted-foreground">Confidence: 82%</span>
      </div>
    </div>

    {/* Fake chart */}
    <div className="relative h-52 sm:h-64 bg-gradient-to-b from-card to-muted/20 p-4 overflow-hidden">
      <svg viewBox="0 0 600 200" className="w-full h-full" preserveAspectRatio="none">
        {/* Grid lines */}
        {[40, 80, 120, 160].map((y) => (
          <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4 4" />
        ))}
        {/* EMA line */}
        <polyline
          points="0,150 60,140 120,130 180,120 240,110 300,105 360,95 420,85 480,75 540,70 600,60"
          fill="none" stroke="hsl(38 95% 54% / 0.5)" strokeWidth="1.5" strokeDasharray="5 3"
        />
        {/* Price line */}
        <polyline
          points="0,160 40,155 80,145 120,155 160,140 200,130 240,120 280,125 320,110 360,100 400,90 440,80 480,70 520,65 560,55 600,50"
          fill="none" stroke="hsl(38 95% 54%)" strokeWidth="2"
        />
        {/* Area fill */}
        <polygon
          points="0,160 40,155 80,145 120,155 160,140 200,130 240,120 280,125 320,110 360,100 400,90 440,80 480,70 520,65 560,55 600,50 600,200 0,200"
          fill="url(#areaGrad)" opacity="0.3"
        />
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(38 95% 54%)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(38 95% 54%)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* TP lines */}
        <line x1="320" y1="85" x2="600" y2="85" stroke="#22c55e" strokeWidth="1" strokeDasharray="4 3" opacity="0.7" />
        <line x1="320" y1="65" x2="600" y2="65" stroke="#22c55e" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
        {/* SL line */}
        <line x1="320" y1="130" x2="600" y2="130" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 3" opacity="0.6" />
        {/* Entry dot */}
        <circle cx="320" cy="110" r="5" fill="hsl(38 95% 54%)" />
      </svg>

      {/* Labels */}
      <div className="absolute right-3 top-[38%] text-[10px] font-semibold text-green-500">TP2</div>
      <div className="absolute right-3 top-[50%] text-[10px] font-semibold text-green-500">TP1</div>
      <div className="absolute right-3 top-[62%] text-[10px] font-semibold text-red-400">SL</div>
    </div>

    {/* Analysis result bar */}
    <div className="grid grid-cols-4 divide-x divide-border/60 border-t border-border/60">
      {[
        { label: 'Entry', value: '$67,420' },
        { label: 'Stop Loss', value: '$65,100 −3.4%' },
        { label: 'Take Profit', value: '$71,800 +6.5%' },
        { label: 'R:R', value: '1:1.9' },
      ].map((item) => (
        <div key={item.label} className="px-3 py-3 text-center">
          <div className="text-[10px] text-muted-foreground mb-0.5">{item.label}</div>
          <div className="text-xs font-bold">{item.value}</div>
        </div>
      ))}
    </div>
  </div>
);

export default LandingPage;
