// Deep Trading Knowledge Base for AYN Trading Coach
// Professional-grade knowledge: patterns, indicators, SMC, Wyckoff, Elliott Wave, on-chain, risk management

// ============================================================
// SECTION 1: CANDLESTICK PATTERNS (50+) WITH BULKOWSKI SUCCESS RATES
// ============================================================
export const CANDLESTICK_PATTERNS = `
CANDLESTICK PATTERNS (with Bulkowski success rates):

BULLISH SINGLE-BAR:
- Hammer: 60% bull continuation. Long lower wick (2x body). Best at key support. Confirm with next green candle.
- Inverted Hammer: 55%. Long upper wick. Needs bullish confirmation candle.
- Dragonfly Doji: 63%. Open=close at top, long wick below. Strong reversal at support.
- Bullish Marubozu: 70%+ continuation. Full body no wicks. Institutional conviction.
- Spinning Top: Indecision. At support = possible reversal. At resistance = possible rejection.

BULLISH MULTI-BAR:
- Bullish Engulfing: 63%. Green candle fully engulfs prior red. +volume = 73% success. Best on daily+.
- Morning Star: 72%. 3 bars: red → doji/small → green. Gap adds reliability.
- Three White Soldiers: 83% if volumes increase each bar. Powerful trend reversal.
- Piercing Line: 64%. Bullish candle closes above 50% of prior bearish candle.
- Bullish Harami: 53%. Small green inside prior large red. Needs confirmation.
- Tweezer Bottom: 61%. Two candles share same low. At support = strong.
- Morning Doji Star: 76%. More reliable than Morning Star with doji middle.
- Three Inside Up: 65%. Harami + confirmation. More reliable than basic harami.
- Mat Hold: 75%. Continuation pattern after small pullback in uptrend.
- Breakaway: Bullish gap reversal. 5 bars. 63% in bear markets.
- Ladder Bottom: 76%. Rare but powerful reversal. 5 declining bars then surge.

BEARISH SINGLE-BAR:
- Shooting Star: 59% bear reversal. Long upper wick (2x body) at resistance.
- Hanging Man: 59%. Hammer shape at TOP of uptrend = bearish. Confirm with next red.
- Gravestone Doji: 65% bear reversal. Open=close at bottom, long wick above. At resistance.
- Bearish Marubozu: 70%+ continuation down. Institutional selling.

BEARISH MULTI-BAR:
- Bearish Engulfing: 63%. Red candle fully engulfs prior green. Volume spike = stronger.
- Evening Star: 72%. 3 bars: green → doji → red. Top reversal.
- Three Black Crows: 78%. Three consecutive declining bars with increasing volume.
- Dark Cloud Cover: 61%. Bear candle closes below 50% of prior bull candle.
- Bearish Harami: 53%. Small red inside prior large green. Needs confirmation.
- Tweezer Top: 61%. Two candles share same high at resistance.
- Evening Doji Star: 76%. More reliable than Evening Star.
- Three Inside Down: 65%. Bearish harami + confirmation.
- Abandoned Baby: 70%+. Very rare. Gap-isolated doji. Strong reversal.

NEUTRAL/CONTINUATION:
- Doji: Pure indecision. Meaning depends on location + prior trend.
- Long-Legged Doji: Extreme indecision. Major inflection point.
- Four Price Doji: Open=high=low=close. Rare. Extreme consolidation.
- Rising Three Methods: Bullish continuation. Small bearish candles inside large bull range.
- Falling Three Methods: Bearish continuation.
- Tasuki Gap: Continuation after gap. Retest of gap then continue.`;

// ============================================================
// SECTION 2: CHART PATTERNS WITH MEASURED MOVE TARGETS
// ============================================================
export const CHART_PATTERNS = `
CHART PATTERNS (measured move targets):

REVERSAL PATTERNS:
- Head & Shoulders: 89% reliability at tops. Target = neckline distance below neckline break. Right shoulder lower = stronger. Volume: left shoulder highest, head lower, right shoulder lowest.
- Inverse H&S: Same but inverted. 89% at bottoms. Volume should spike on right shoulder breakout.
- Double Top (M): 78%. Target = height of pattern below neckline. Second top lower = stronger signal. Volume divergence confirms.
- Double Bottom (W): 78%. Target = height above neckline. Second bottom higher = stronger. 
- Triple Top/Bottom: More powerful than double. 80%+.
- Rounding Top/Bottom: 75%. Slow momentum shift. Long timeframe pattern (weeks/months).
- Bump and Run: 70%. Sharp rally (bump) precedes breakdown. Measured by bump angle.
- Diamond Top/Bottom: 74%. Rare but powerful. Expanding then contracting range.
- Broadening Top: 65%. Rising highs, lower lows. Distribution pattern.

CONTINUATION PATTERNS:
- Bull Flag: 67%. Tight consolidation on declining volume after sharp rally. Target = pole height above breakout.
- Bear Flag: 67%. Tight consolidation on declining volume after sharp drop.
- Bull Pennant: 68%. Triangle consolidation after rally. Target = pole height.
- Bear Pennant: 68%.
- Ascending Triangle: 72%. Flat top + rising bottoms. Breakout statistically up. Target = triangle height.
- Descending Triangle: 72%. Flat bottom + declining tops. Breakout statistically down.
- Symmetrical Triangle: 54%. Direction determined by prior trend. Breakout with volume.
- Rectangle: 65% breakout in direction of prior trend. Target = rectangle height.
- Wedge (Rising): Bearish continuation/reversal. 69%. Falling volume during rise.
- Wedge (Falling): Bullish continuation/reversal. 69%.
- Cup & Handle: 68%. Smooth U-shape (cup) + small pullback (handle <50% of cup). Breakout above cup rim.
- Measured Move: Assumes equal swing legs (AB=CD). Use for targets in trending markets.
- Three Drives Pattern: Harmonic reversal. Three legs with equal fib ratios.

KEY NOTES:
- Volume should decline during consolidation, surge on breakout
- Pattern failure (false breakout) happens ~25-30% of time → quick exit if price returns into pattern
- Larger patterns on higher timeframes = more powerful targets
- Always calculate risk to invalidation vs potential reward (min 1:2)`;

// ============================================================
// SECTION 3: TECHNICAL INDICATORS - DEEP FORMULAS & SIGNALS
// ============================================================
export const TECHNICAL_INDICATORS = `
TECHNICAL INDICATORS (formulas, signals, limitations):

RSI (Relative Strength Index):
- Formula: 100 - (100 / 1 + RS). RS = avg gain / avg loss over 14 periods.
- Oversold <30 (strong <20), Overbought >70 (extreme >80).
- Divergence: Price new high + RSI lower high = BEARISH DIVERGENCE (powerful). Price new low + RSI higher low = BULLISH DIVERGENCE.
- Hidden divergence: RSI higher low + price same/lower low = continuation (bullish).
- RSI in 40-60 range = weak trend. RSI >60 with pullback to 40 = buy the dip.
- Failure swing top: RSI >70, drops below 70, retests <70, fails = sell.
- Works best: sideways/oscillating markets. Limitation: can stay overbought in strong trends.

MACD (Moving Average Convergence Divergence):
- Formula: 12-period EMA - 26-period EMA = MACD line. Signal = 9-period EMA of MACD.
- Histogram = MACD - Signal. Zero-line crossovers = momentum change.
- Signal line cross above = bullish. Cross below = bearish.
- Histogram divergence (price vs histogram) = early reversal warning.
- Zero line rejection (MACD bounces off zero) = strong continuation signal.
- Best for: trending markets. Limitation: lagging indicator.

Bollinger Bands:
- Formula: 20-period SMA ± 2 standard deviations.
- Squeeze (bands narrow) = low volatility → breakout incoming. Direction unknown until it breaks.
- Band walk: price hugs upper band = strong uptrend. Lower band = strong downtrend.
- %B = (price - lower band) / (upper - lower). >1 = above upper. <0 = below lower.
- Band expansion after squeeze = breakout confirmation.
- Keltner Channel squeeze (BB inside KC) = even stronger breakout signal.

Stochastic RSI:
- Formula: (RSI - min RSI) / (max RSI - min RSI) × 100. Uses 14/3/3 typical settings.
- More sensitive than RSI. Better for entries.
- %K >%D and crossing above 20 = BUY. %K <%D crossing below 80 = SELL.
- Most powerful when combined with RSI divergence and pattern.

ATR (Average True Range):
- Measures volatility, not direction. True Range = max(high-low, abs(high-prev close), abs(low-prev close)).
- Use for stop placement: 1.5-2x ATR below entry for longs.
- ATR expanding = increasing volatility. Contracting = squeeze building.
- Chandelier Exit: Highest high - (3x ATR). Trailing stop that adapts to volatility.

Volume Profile / Volume at Price:
- Point of Control (POC): Price level with most volume traded = magnet price.
- Value Area High/Low (VAH/VAL): 70% of volume traded between these. Act as S/R.
- Low Volume Nodes (LVN): Thin areas = price moves through quickly.
- High Volume Nodes (HVN): Consolidation zones. Price oscillates here.

Fibonacci:
- Retracement levels: 23.6%, 38.2%, 50%, 61.8% (golden ratio), 78.6%.
- 61.8% retracement + support = strongest buy zone.
- Extension levels: 127.2%, 161.8%, 261.8% = profit targets.
- Cluster analysis: When multiple fibs from different swings converge = high probability zone.
- Time fibs: Apply horizontally for timing reversals.

Ichimoku Cloud:
- Tenkan-sen (9): short-term momentum. Kijun-sen (26): medium-term trend.
- Senkou A = (Tenkan + Kijun) / 2 plotted 26 periods ahead. Senkou B = (52H + 52L) / 2 plotted 26 ahead.
- Chikou Span: Close plotted 26 periods back = confirmation.
- Price above cloud = bullish. Inside cloud = consolidation. Below = bearish.
- TK cross above cloud = strong buy. Cloud twist = trend change coming.
- Kumo breakout (price exits cloud) = high probability trend start.

Moving Averages:
- EMA 8/21: Fast. Day trading entries. 8 crosses 21 = trend change.
- SMA 50/200: Major support/resistance levels. Golden Cross (50 > 200) = bull market. Death Cross = bear.
- EMA 200: Institutional reference. Price above = generally long-biased. Bounce off = strong buy.
- VWAP: Intraday institutional cost basis. Price above = buyers in control.
- Ribbon (multiple EMAs): Spacing shows trend strength. Crossovers show momentum shifts.`;

// ============================================================
// SECTION 4: SMART MONEY CONCEPTS (ICT/SMC) - DEEP
// ============================================================
export const SMART_MONEY_CONCEPTS = `
SMART MONEY CONCEPTS (ICT/SMC):

ORDER BLOCKS (OB):
- Definition: Last candle BEFORE a strong impulsive move. Institutional entry footprint.
- Bullish OB: Last red candle before impulsive move up. Body = entry zone.
- Bearish OB: Last green candle before impulsive move down.
- Mitigation: When price returns to OB = institutions re-enter. High probability reversal.
- OB strength: Volume on the OB candle matters. Higher = stronger.
- Breaker Block: Failed OB that gets engulfed. Now acts as OPPOSITE level.
- Mitigation Block: OB that's partially filled. Price may return for full fill.
- OB + FVG combo = institutional confluence zone. Highest probability setups.

FAIR VALUE GAPS (FVG / Imbalance):
- Definition: 3-candle pattern where candle 1's high is below candle 3's low (bullish) or candle 1's low is above candle 3's high (bearish).
- Represents inefficiency. Price statistically returns to fill 80%+ of time.
- Inversion: FVG filled + price rejects = now acts as opposite level.
- Old FVG vs New FVG: Closest to current price most relevant.
- ICT Optimal Trade Entry (OTE): 62-79% of FVG = sweet spot entry zone.
- Nested FVG: Multiple FVGs at same level = very strong zone.

LIQUIDITY CONCEPTS:
- Equal Highs/Lows: Resting liquidity. Smart money WILL sweep these.
- Buy-Side Liquidity (BSL): Above equal highs, above stops of short sellers.
- Sell-Side Liquidity (SSL): Below equal lows, below stops of long holders.
- Liquidity sweep: Price aggressively breaks a level then reverses = classic smart money trap.
- After sweep → look for OB or FVG to enter in the OPPOSITE direction.
- Judas Swing: False move at market open designed to trap retail traders.
- Turtle Soup: Buy new 20-day low (or sell new 20-day high) expecting a reversal.

MARKET STRUCTURE:
- BOS (Break of Structure): New HH in uptrend = BOS bullish. New LL in downtrend = BOS bearish.
- CHOCH (Change of Character): First sign of potential reversal. Lower high in uptrend = bearish CHOCH.
- MSS (Market Structure Shift): Multiple CHOCH = confirmed reversal.
- Only BUY in discount (price <50% of range). Only SELL in premium (price >50%).
- Premium/Discount: Use Fibonacci 0-100% on last major swing. 50% = equilibrium.
- Expansion → Correction → Expansion: Normal market rhythm.

POWER OF 3 (PO3) - ICT Concept:
- Accumulation (Asia session) → Manipulation (London open, sweep) → Distribution (NY session, true direction).
- Asian range = draw liquidity. London sweeps one side. NY runs the other direction.

INSTITUTIONAL ORDER FLOW:
- 15m OB within 4H OB within Daily OB = maximum confluence.
- Time of day matters: 09:30-10:00 EST = high manipulation. 10:00-11:30 = real trend.
- New York Kill Zone (09:30-11:00 EST): Highest probability reversals.
- London Kill Zone (08:00-10:00 GMT): Second highest probability.`;

// ============================================================
// SECTION 5: WYCKOFF METHOD - FULL ANALYSIS
// ============================================================
export const WYCKOFF_METHOD = `
WYCKOFF METHOD (Richard Wyckoff, 1930s - still the most accurate institutional model):

THREE FUNDAMENTAL LAWS:
1. Supply and Demand: Price rises when demand > supply. Falls when supply > demand.
2. Cause and Effect: Size of accumulation/distribution (horizontal range) = magnitude of subsequent move.
3. Effort vs Result: Volume (effort) should confirm price movement (result). Divergence = warning.

ACCUMULATION SCHEMATIC:
Phase A - Stopping the Downtrend:
- PS (Preliminary Support): First demand appears after downtrend. Volume increases.
- SC (Selling Climax): Panic selling. Highest volume bar. Exhaustion.
- AR (Automatic Rally): Price bounces from SC. Defines top of trading range.
- ST (Secondary Test): Retest SC area on lower volume. Confirms SC.

Phase B - Building Cause:
- Large range, confusing price action. Smart money accumulating.
- Multiple tests of support and resistance.
- Springs: Brief dips below support to shake out weak holders.

Phase C - Test:
- SPRING: The key signal. Price breaks below support on LOW volume, immediately reverses.
- Spring Volume Rule: Volume on spring MUST be lower than SC volume. If volume is high = no spring.
- Test of Spring: Retests the spring area. Should hold with low volume.

Phase D - Mark Up Beginning:
- SOS (Sign of Strength): Strong rally on high volume above resistance.
- LPS (Last Point of Support): Final pullback to former resistance before main up move.
- SOS + LPS = best entry point for Wyckoff accumulation.

Phase E - Mark Up:
- Trend established. Strong price appreciation.
- BUY opportunity: LPS during Phase D.

DISTRIBUTION SCHEMATIC:
Phase A - Stopping the Uptrend:
- PSY (Preliminary Supply): First selling after uptrend.
- BC (Buying Climax): Exhaustion peak. Highest volume.
- AR (Automatic Reaction): Sharp drop from BC.
- ST (Secondary Test): Retest BC on lower volume.

Phase B: Distribution building. Multiple tests. UT (Upthrust) = brief breakout above resistance that fails.

Phase C:
- UTAD (Upthrust After Distribution): New high on LOW volume, immediately reverses.
- Classic "bear trap" for retail traders buying the breakout.

Phase D: LPSY (Last Point of Supply) + SOW (Sign of Weakness) = SELL.

Phase E: Mark Down. Strong downtrend begins.

WYCKOFF VOLUME ANALYSIS:
- Wide spread + high volume + price up = strength
- Wide spread + high volume + price down = weakness  
- Narrow spread + low volume = no interest at this level
- Wide spread + low volume up (floating) = supply absorbed, imminent decline
- Stopping volume: High volume bar with little price progress = absorption`;

// ============================================================
// SECTION 6: ELLIOTT WAVE THEORY
// ============================================================
export const ELLIOTT_WAVE = `
ELLIOTT WAVE THEORY (Ralph Nelson Elliott, 1938):

IMPULSE WAVES (5 waves in direction of trend):
Wave 1: First advance. Small. Only 5% of traders notice.
Wave 2: Retracement of wave 1. NEVER goes below start of wave 1. 50-61.8% retracement typical.
Wave 3: STRONGEST wave. Never shortest. Must exceed wave 1 high. Often extends 161.8% of wave 1.
Wave 4: Retracement. Never overlaps with wave 1 price territory. 38.2% typical. More complex than wave 2.
Wave 5: Final push. Often shows divergence (price new high, RSI lower high). 61.8-100% of wave 1 length.

CORRECTIVE WAVES (3 waves against trend):
ABC Zigzag: Sharp correction. A=5 waves, B=3 waves, C=5 waves. C usually = A.
ABC Flat: Sideways correction. A=3, B=3, C=5. B returns to near A start.
Triangle (ABCDE): 5 waves contracting. Usually wave 4 or B wave. Thrust out = 100% of widest part.
Double/Triple Three: Complex corrections. Most difficult to analyze.
WXY: Combination correction. Can last a long time.

FIBONACCI RELATIONSHIPS (Elliott Wave price targets):
Wave 2 retracement: 50%, 61.8%, or 76.4% of wave 1
Wave 3 extension: 161.8%, 200%, 261.8% of wave 1
Wave 4 retracement: 23.6%, 38.2% of wave 1-3
Wave 5 equality: Equal to wave 1, OR 61.8% of waves 1-3

PRACTICAL APPLICATION:
- If in wave 3: aggressive buy. Use 61.8% retrace of wave 1-2 as entry.
- If in wave 5: watch for divergence, reduce position, prepare for correction.
- A-B-C correction after impulse: C often = 100% of A (measured from B low/high).
- Truncated wave 5: Short wave 5, market very weak = strong reversal coming.
- Extended wave 3: Most common extension in crypto. Can reach 261.8% or more.`;

// ============================================================
// SECTION 7: HARMONIC PATTERNS (Gartley, Bat, Butterfly, Crab, Shark)
// ============================================================
export const HARMONIC_PATTERNS = `
HARMONIC PATTERNS (Fibonacci-based price patterns):

GARTLEY (Harold Gartley, 1935):
- Bullish: X→A up, A→B retraces 61.8% of XA, B→C retraces 38.2-88.6% of AB, C→D extends 127.2% of BC.
- D point = PRZ (Potential Reversal Zone). D = 78.6% retracement of XA.
- Success rate: 70%+ when all ratios align precisely.

BAT PATTERN:
- Similar to Gartley but deeper. B = 38.2-50% of XA. D = 88.6% of XA.
- Tighter PRZ. More precise entry. Success: 75%+.

BUTTERFLY:
- B = 78.6% of XA. D extends BEYOND X. D = 127.2-161.8% of XA.
- Reversal at market extremes. Very powerful. Success: 72%+.

CRAB:
- Most extreme. B = 38.2-61.8% of XA. D = 161.8% of XA (deep extension).
- Highest risk/reward. Success: 73%+.

SHARK:
- Newest. C = 113-161.8% extension of AB. D = 88.6% of OX.
- Very powerful at extremes.

CYPHER:
- C = 113-141.4% of XA. D = 78.6% of XC.
- Higher accuracy than standard harmonics.

ENTRY METHOD (for all harmonics):
1. Identify the PRZ (D point)
2. Wait for pattern completion + confirmation candle
3. Enter at 50-61.8% of the CD leg (not at the extreme)
4. Stop: Below X for bullish patterns. Above X for bearish.
5. Target: 38.2% of AD, then 61.8% of AD, then A.

NOTES:
- Never enter at the extreme of D. Wait for reversal confirmation.
- Volume should decrease as price approaches PRZ.
- Best on H4 and above timeframes.
- Combine with SMC order blocks for maximum probability.`;

// ============================================================
// SECTION 8: ON-CHAIN & CRYPTO-SPECIFIC ANALYSIS
// ============================================================
export const ONCHAIN_ANALYSIS = `
ON-CHAIN & CRYPTO ANALYSIS:

BITCOIN ON-CHAIN METRICS:
- MVRV Ratio: Market Value / Realized Value. >3.5 = historically overbought (top signals). <1 = extreme undervaluation (buy zone).
- NVT (Network Value to Transactions): PE ratio for Bitcoin. High = overvalued. Low = undervalued.
- SOPR (Spent Output Profit Ratio): >1 = coins moved in profit. <1 = being sold at loss. 
  - Declining SOPR + price rising = smart money accumulating.
  - SOPR >1.05 consistently = late bull market euphoria.
- Stock-to-Flow: Measures scarcity (gold model applied to BTC). Post-halving S2F doubles.
- Hash Rate: Rising hash rate = miners confident, network secure, bullish long-term.
- Miner Revenue: Sharp drop = miners selling (bearish). Stable/rising = healthy.
- Exchange Reserves: BTC moving TO exchanges = selling intent (bearish). Moving OFF = HODLing (bullish).
- Long-Term Holder (LTH) Supply: LTH distributing = bear market near top. LTH accumulating = bottom forming.
- Short-Term Holder (STH) Supply in Loss: STH at loss + capitulation = BOTTOM signal.
- Realized Price: Average cost basis of all BTC holders. Price below Realized Price = historically near bottoms.

FUNDING RATES (DEEP):
- Positive funding: Longs pay shorts. High positive = too many longs = squeeze risk.
- Threshold for danger: BTC >0.05%/8h, Altcoins >0.10%/8h = extremely overleveraged.
- Sustained negative funding for >24h = aggressive shorts = squeeze opportunity.
- Funding spike (+0.3%+): Often precedes sharp correction within hours.
- Funding + Open Interest rising: Confirms directional conviction (not squeeze).

OPEN INTEREST (OI):
- Rising OI + rising price = healthy uptrend with new money entering.
- Rising OI + falling price = distribution, short accumulation.
- Falling OI + falling price = capitulation (can signal bottom).
- Falling OI + rising price = short squeeze. Unsustainable.
- OI spike: Large increase in open interest = major move imminent.

LIQUIDATION LEVELS:
- Large liquidation clusters above/below price = price magnets.
- Smart money knows where retail stops cluster. Will hunt that liquidity.
- After major liquidation cascade: smart money enters in opposite direction.

ALTCOIN SPECIFICS:
- Bitcoin Dominance (BTC.D): Rising = BTC outperforming, altcoins struggling. Falling = altseason.
- Alt Season Index: <25 = BTC season. >75 = altcoin season.
- Total2 (Total minus BTC): When breaks ATH = altseason confirmed.
- Token unlock schedules: Check tokenomist.ai/vesting for all projects.
  - >5% of circulating supply unlocking = major dump risk.
  - Insider/VC unlocks worse than public sale unlocks.
  - Never hold through major unlock. Re-enter after flush.
- FDV vs Market Cap ratio: FDV/MC >5x = significant inflation ahead.

CRYPTO MARKET CYCLES:
- Bitcoin Halving Cycle (4 years): Halving → 12-18 months to ATH → 18-24 months bear.
- Historical ATH timing: 2013 (Nov), 2017 (Dec), 2021 (Nov). Each cycle slightly different.
- Altseason rotation: BTC → ETH → Large caps → Mid caps → Small caps → Memes.
- Meme coin mania = PEAK SIGNAL. Exit within 2-4 weeks of meme explosion.
- DeFi Summer pattern: Yields attract capital → token farming → inflation → dump.
- NFT cycle: Similar to meme coins. Leading indicator for market peak.

DERIVATIVES SIGNALS:
- Put/Call ratio: High put buying = bearish sentiment (often contrarian bullish).
- Skew: OTM puts expensive vs calls = fear in market.
- Term structure: Contango (futures > spot) = bull market. Backwardation = fear.`;

// ============================================================
// SECTION 9: ADVANCED RISK MANAGEMENT
// ============================================================
export const RISK_MANAGEMENT = `
PROFESSIONAL RISK MANAGEMENT:

POSITION SIZING (Kelly Criterion & Fixed Fractional):
- Kelly Formula: f = (bp - q) / b. Where: b = win/loss ratio, p = win probability, q = 1-p.
- Example: 60% win rate, 2:1 R/R → f = (2×0.60 - 0.40) / 2 = 20% optimal (use half = 10%).
- Fixed Fractional: Risk exactly 1% or 2% of total account per trade. NEVER more.
- Position size formula: Risk amount / (Entry - Stop Loss) = Number of units.
- Max portfolio heat: No more than 10% total risk across all open trades simultaneously.
- Correlation risk: BTC + ETH + altcoins = highly correlated. Count as single position for risk.

LEVERAGE RULES:
- No leverage (1x): Beginners. Survive market crashes without margin calls.
- 2-3x: Experienced traders with proven edge and strict rules.
- 5x max: Advanced traders. Any more = casino, not trading.
- Crypto 10x+: Institutional manipulation targets your stops. Avoid.
- Liquidation calculator: Position size = Account × Leverage. Liquidation at ~(100/leverage)% move against you.

STOP LOSS STRATEGY:
- Hard stop: Fixed price. Always use. No exceptions.
- ATR stop: 1.5-2x ATR below entry. Adapts to volatility.
- Time stop: If price doesn't move in expected direction within X bars, exit.
- Trailing stop: Move stop to breakeven once +1R profit. Trail at 2x ATR above price.
- Never move stop FURTHER away to "give it more room." This is how accounts blow up.
- Break-even rule: Move stop to entry once position is +1R in profit.

TAKE PROFIT STRATEGY:
- Scale out: Sell 33% at TP1 (1:1 R/R), 33% at TP2 (2:1), let 33% run with trailing stop.
- Fibonacci targets: TP1 = 127.2% extension, TP2 = 161.8%, TP3 = 261.8% of swing.
- Previous swing high/low: Natural resistance/support = logical targets.
- Round numbers: 10,000; 50,000; 100,000 = psychological resistance. Price often rejects.
- Risk:Reward minimum: 1:2 minimum. Prefer 1:3+. Never take 1:1 unless very high probability.

DRAWDOWN RULES (professional money management):
- Daily loss limit: -3% = review. -5% = STOP trading for the day.
- Weekly loss limit: -10% = trading plan review. -15% = stop for the week.
- Monthly loss limit: -20% = system review required. -25% = paper trade only for 30 days.
- Account protection: If down -30% from peak, stop trading for the month.
- Peak-to-trough: Professional traders maintain drawdown under 20-25% annually.

TRADE JOURNAL (essential):
- Record: Date, pair, entry, exit, stop, target, R:R, result in R, reason for entry, reason for exit.
- Review weekly: Win rate, average R, expectancy = Win% × avg win - Loss% × avg loss.
- Positive expectancy = profitable system even with 40% win rate at 2:1 R/R.`;

// ============================================================
// SECTION 10: MARKET STRUCTURE & MULTI-TIMEFRAME ANALYSIS
// ============================================================
export const MARKET_STRUCTURE_MTF = `
MARKET STRUCTURE & MULTI-TIMEFRAME ANALYSIS:

HIGHER TIMEFRAME PRIORITY (never fight it):
- Monthly: Major cycle direction. Cannot change in days/weeks.
- Weekly: Intermediate trend. Swing trade direction.
- Daily: Trend for position trading. Most important for crypto.
- 4H: Entry timeframe for swing trades.
- 1H: Entry refinement. Short-term trend.
- 15m/5m: Intraday entries only. Must align with 1H+.

MTF ANALYSIS PROCESS:
1. Start with Daily/Weekly: What is the macro bias? Up/Down/Range?
2. Drop to 4H: What is the intermediate trend? Find key levels.
3. Drop to 1H: What is short-term structure? Find entry zone.
4. Use 15m for precise entry trigger.
- Rule: Never take 15m setup that contradicts Daily trend.
- Exception: Only counter-trend trade at MAJOR S/R levels with strict stops.

SUPPORT & RESISTANCE HIERARCHY:
- Monthly S/R: Strongest. Multiple years of history.
- Weekly S/R: Strong. Quarterly/annual levels.
- Daily S/R: Standard. Swing highs and lows.
- Psychological levels: Round numbers (50, 100, 1000, 10000). ALWAYS mark these.
- Dynamic S/R: 200 EMA, VWAP, Bollinger Bands midline.
- Tested levels weaken: Each retest uses up buying/selling pressure at that level.
- Third test of a level often breaks through.

TREND IDENTIFICATION:
- Strong uptrend: Higher highs + higher lows. Buy pullbacks.
- Weak uptrend: Highs making progress but lows are flat. Watch for breakdown.
- Range: Equal highs and lows. Buy bottom, sell top. Or wait for breakout.
- Downtrend: Lower highs + lower lows. Sell rallies. Avoid buying.
- Trend change: First CHOCH, then confirmed by BOS in new direction.

KEY LEVEL CONFLUENCE (maximum probability):
- Price at Weekly S/R + Daily OB + Fibonacci 61.8% + RSI Divergence = VERY HIGH PROBABILITY.
- Aim for 3+ factors confluencing at one price level.
- More confluence = tighter stop = better R:R.`;

// ============================================================
// SECTION 11: MARKET SESSIONS & MACRO TIMING
// ============================================================
export const MARKET_SESSIONS_MACRO = `
MARKET SESSIONS & MACRO TIMING:

CRYPTO MARKET SESSIONS (UTC times):
- Asian Session: 00:00-08:00 UTC. Low volume, range-bound. Accumulation/fakeout zone.
- London Open: 08:00-09:00 UTC. Volume surges. Often sweeps Asian highs or lows.
- London Session: 08:00-16:00 UTC. Strong directional moves begin.
- New York Open: 13:00-14:00 UTC. Highest volatility spike. Major reversals.
- New York Session: 13:00-21:00 UTC. Highest total volume. Real direction established.
- London-NY Overlap: 13:00-16:00 UTC. PEAK VOLUME. Most reliable setups.
- Dead Zone: 21:00-00:00 UTC. Low volume. Avoid new positions.

POWER OF 3 TIMING (ICT):
- Asian range forms (00:00-08:00 UTC): The setup range.
- London manipulates one side (08:00-10:00 UTC): The fake move.
- New York runs the real direction (13:00-16:00 UTC): The money move.
- Trade: If London sweeps Asian low → expect NY to rally. If sweeps high → expect NY to drop.

MACRO EVENTS (calendar trading):
- FOMC (Federal Reserve): Rate decisions. +25bps hawkish = risk off. -25bps dovish = risk on.
- CPI (Consumer Price Index): Higher than expected = hawkish Fed = bearish crypto. Lower = bullish.
- NFP (Non-Farm Payrolls): Strong jobs = hawkish = risk off initially. Weak = dovish = risk on.
- DXY (Dollar Index): Inverse correlation with crypto. DXY rising = crypto falling. DXY falling = crypto rising.
- US10Y (10-Year Yield): Rising yields = competition with risk assets. Falling = flows into risk.
- BTC Halving: Programmed every 210,000 blocks (~4 years). Supply cut 50%. Historically bullish 12-18 months later.

BEFORE MAJOR NEWS:
- Reduce position size by 50% within 2 hours of release.
- Widen stops to avoid stop-hunt spike.
- Or: exit position, re-enter after volatility settles (15-30 minutes post-release).
- Never hold maximum leverage into Fed decisions.

WEEKEND EFFECTS:
- Crypto trades 24/7. Weekend = lower liquidity = more manipulation.
- Sunday evening (23:00-01:00 UTC Monday): Often sees fake moves before real Monday direction.
- Friday NY close: Position squaring. Can reverse intraday trend.`;

// ============================================================
// SECTION 12: SCAM DETECTION & DUE DILIGENCE
// ============================================================
export const SCAM_DETECTION = `
SCAM DETECTION & TOKEN DUE DILIGENCE:

RED FLAGS (the more flags, the more dangerous):
LEVEL 1 (Minor Red Flags, 1-2 = caution):
- Anonymous team without LinkedIn/verifiable history
- Copy-pasted whitepaper from another project
- No GitHub or very little git activity
- Social media accounts <3 months old
- Artificially inflated follower counts (bots)

LEVEL 2 (Serious Red Flags, 3-4 = reduce position 75%):
- Volume <$100K/day: Can't exit large positions without slippage
- 24h price move >50%: Manipulation pump almost certainly
- Token name: SAFE, MOON, ELON, RUG, DOGE-clone variants = meme scam
- Team wallet controls >30% of supply: Can dump on you
- No audit or audit with critical issues unresolved
- Smart contract not verified on block explorer
- Trading history only 1-30 days: No track record

LEVEL 3 (Major Red Flags, 5+ = DO NOT TRADE):
- Liquidity locked <6 months or not locked: Can pull the rug anytime
- Honeypot: Contract doesn't allow selling (test with small amount first on any DEX token)
- Tax >10% on buy/sell: Designed to bleed holders
- Blacklist function in contract: Team can freeze your tokens
- Max wallet limit very small: Artificially controls price/prevents whales
- Promises "guaranteed returns" or "100x guaranteed"
- Celebrity endorsement with no genuine relationship
- Fork of failed project with no improvements
- All marketing, zero utility

LIQUIDITY ANALYSIS:
- DEX: Check pool size on Dexscreener. <$100K = extremely dangerous.
- CEX: Bid-ask spread. >1% = low liquidity. >5% = illiquid.
- Volume to market cap ratio: <0.01 = suspicious low volume. >1 = very active (can be wash trading).
- Wash trading signals: Volume high but all trades similar size, from same wallet clusters.

SMART CONTRACT AUDIT TOOLS:
- GoPlus Security API: Free token risk assessment.
- Token Sniffer: Automated scam detection.
- De.fi: Comprehensive security scanner.
- Etherscan/BSCScan: Always verify contract is verified and check write functions.
- Honeypot.is: Check if token can be sold.`;

// ============================================================
// SECTION 13: TRADING PSYCHOLOGY (DEEP)
// ============================================================
export const TRADING_PSYCHOLOGY = `
TRADING PSYCHOLOGY (professional level):

COGNITIVE BIASES IN TRADING:
- Anchoring: "BTC was $69K, so $40K is cheap." Wrong. Price has no memory. Trade based on current structure.
- Confirmation Bias: Seeking information that confirms existing position. Actively seek DISCONFIRMING evidence.
- Loss Aversion: Pain of loss 2.3x greater than joy of equal gain. Causes holding losers too long, cutting winners short.
- Recency Bias: "It went up the last 5 days so it will continue." Mean reversion is real.
- Overconfidence: After winning streak, risk more. This is when most blow up.
- Gambler's Fallacy: "It's due for a bounce after 5 red days." Markets have no memory.
- Sunk Cost Fallacy: "I'm down 50%, can't sell now." Exit is determined by current structure, not what you paid.
- Narrative Bias: Believing a story too much. Always check price action vs the narrative.
- Herd Mentality: When everyone is bullish → danger. When everyone is bearish → opportunity.

EMOTIONAL STATE PROTOCOLS:
FOMO (Fear of Missing Out):
- Trigger: Price running, fear of missing the move.
- Response: "What is my edge here? Can I define my entry, stop, and target clearly?"
- If no clear edge: DO NOT ENTER. The market will provide another setup.
- If justified: Limit buy at first pullback. Never chase breakouts.
- Recovery: Take a 10-minute break. Write down what you were feeling. Recalculate R:R.

FEAR:
- Trigger: Open loss growing. Uncertainty about direction.
- Response: Validate the feeling. Then: "Is my stop still valid based on structure? If yes, hold. If stop is hit, exit."
- Never freeze. Have a pre-defined exit plan before entering any trade.
- Pre-trade ritual: Before entry, write: Entry=X, Stop=Y, Target=Z. Stick to the plan.

GREED:
- Trigger: Position showing large profit. Reluctance to take profits.
- Response: Challenge position size vs original plan. "Did I size up? Should I?"
- Use pre-defined take profit levels. SCALE OUT, don't exit all or hold all.
- Greedy traders turn winners into losers. Protect profits with trailing stops.

REVENGE TRADING:
- Trigger: Just took a loss. Urge to immediately trade to "get it back."
- Response: STOP TRADING IMMEDIATELY. The market doesn't know or care about your loss.
- Protocol: Take a minimum 30-minute break. Review the losing trade objectively. Only return when calm.
- Rule: Never trade within 30 minutes of a loss >2R.

OVERCONFIDENCE (After Win Streak):
- Most dangerous state. Win streak = skill AND luck combined.
- Response: Reduce position size by 25% after 5 consecutive wins.
- Review if the wins were from your edge or from favorable conditions that may not continue.

BOREDOM TRADING:
- Taking trades just because you're watching charts. No edge.
- Solution: Define minimum criteria for a valid setup. If not met, close charts.
- Remember: Flat (no position) is a valid position.

FLOW STATE (Optimal Trading):
- Calm, objective, following the plan.
- Entry: Only when checklist fully satisfied.
- During trade: Minimal monitoring. Trust the stop.
- Exit: At pre-defined levels. No improvisation.`;

// ============================================================
// MAIN EXPORT: Contextual Knowledge Selector
// ============================================================

interface KnowledgeSections {
  patterns?: string;
  indicators?: string;
  smc?: string;
  wyckoff?: string;
  elliott?: string;
  harmonics?: string;
  onchain?: string;
  risk?: string;
  structure?: string;
  sessions?: string;
  scams?: string;
  psychology?: string;
}

export function getContextualKnowledge(userMessage: string): string {
  const msg = userMessage.toLowerCase();
  const sections: string[] = [];
  
  // Always include core sections for trading coach
  sections.push(CANDLESTICK_PATTERNS);
  sections.push(CHART_PATTERNS);
  
  // Contextual additions based on query
  if (msg.includes('indicator') || msg.includes('rsi') || msg.includes('macd') || 
      msg.includes('bollinger') || msg.includes('stoch') || msg.includes('atr') ||
      msg.includes('fibonacci') || msg.includes('fib') || msg.includes('ichimoku') ||
      msg.includes('moving average') || msg.includes('ema') || msg.includes('sma') ||
      msg.includes('volume profile') || msg.includes('vwap')) {
    sections.push(TECHNICAL_INDICATORS);
  }
  
  if (msg.includes('smart money') || msg.includes('smc') || msg.includes('ict') ||
      msg.includes('order block') || msg.includes('fair value gap') || msg.includes('fvg') ||
      msg.includes('liquidity') || msg.includes('sweep') || msg.includes('choch') ||
      msg.includes('bos') || msg.includes('premium') || msg.includes('discount')) {
    sections.push(SMART_MONEY_CONCEPTS);
  }
  
  if (msg.includes('wyckoff') || msg.includes('accumulation') || msg.includes('distribution') ||
      msg.includes('spring') || msg.includes('upthrust') || msg.includes('buying climax') ||
      msg.includes('selling climax') || msg.includes('sos') || msg.includes('creek')) {
    sections.push(WYCKOFF_METHOD);
  }
  
  if (msg.includes('elliott') || msg.includes('wave') || msg.includes('impulse') ||
      msg.includes('corrective') || msg.includes('abc') || msg.includes('zigzag')) {
    sections.push(ELLIOTT_WAVE);
  }
  
  if (msg.includes('harmonic') || msg.includes('gartley') || msg.includes('bat pattern') ||
      msg.includes('butterfly') || msg.includes('crab') || msg.includes('shark') ||
      msg.includes('cypher') || msg.includes('prz')) {
    sections.push(HARMONIC_PATTERNS);
  }
  
  if (msg.includes('on-chain') || msg.includes('onchain') || msg.includes('mvrv') ||
      msg.includes('sopr') || msg.includes('nvt') || msg.includes('exchange flow') ||
      msg.includes('funding rate') || msg.includes('open interest') || msg.includes('oi') ||
      msg.includes('liquidation') || msg.includes('dominance') || msg.includes('altseason') ||
      msg.includes('unlock') || msg.includes('vesting') || msg.includes('tokenomics')) {
    sections.push(ONCHAIN_ANALYSIS);
  }
  
  if (msg.includes('risk') || msg.includes('position size') || msg.includes('stop loss') ||
      msg.includes('take profit') || msg.includes('drawdown') || msg.includes('leverage') ||
      msg.includes('kelly') || msg.includes('r:r') || msg.includes('reward') ||
      msg.includes('how much') || msg.includes('how many')) {
    sections.push(RISK_MANAGEMENT);
  }
  
  if (msg.includes('structure') || msg.includes('support') || msg.includes('resistance') ||
      msg.includes('timeframe') || msg.includes('trend') || msg.includes('higher high') ||
      msg.includes('lower low') || msg.includes('multi') || msg.includes('4h') ||
      msg.includes('daily') || msg.includes('weekly')) {
    sections.push(MARKET_STRUCTURE_MTF);
  }
  
  if (msg.includes('session') || msg.includes('london') || msg.includes('new york') ||
      msg.includes('asian') || msg.includes('fomc') || msg.includes('cpi') ||
      msg.includes('nfp') || msg.includes('dxy') || msg.includes('macro') ||
      msg.includes('halving') || msg.includes('news') || msg.includes('event') ||
      msg.includes('fed') || msg.includes('powell')) {
    sections.push(MARKET_SESSIONS_MACRO);
  }
  
  if (msg.includes('scam') || msg.includes('rug') || msg.includes('honeypot') ||
      msg.includes('audit') || msg.includes('legit') || msg.includes('safe') ||
      msg.includes('trust') || msg.includes('new token') || msg.includes('dex') ||
      msg.includes('defi')) {
    sections.push(SCAM_DETECTION);
  }
  
  if (msg.includes('psychol') || msg.includes('emotion') || msg.includes('fomo') ||
      msg.includes('fear') || msg.includes('greed') || msg.includes('revenge') ||
      msg.includes('discipline') || msg.includes('bias') || msg.includes('feeling') ||
      msg.includes('stressed') || msg.includes('anxiety') || msg.includes('regret') ||
      msg.includes('blew') || msg.includes('lost') || msg.includes('mistake')) {
    sections.push(TRADING_PSYCHOLOGY);
  }
  
  // If nothing contextual matched beyond basics, add structure and risk as defaults
  if (sections.length === 2) {
    sections.push(MARKET_STRUCTURE_MTF);
    sections.push(RISK_MANAGEMENT);
    sections.push(SMART_MONEY_CONCEPTS);
  }
  
  return sections.join('\n\n---\n\n');
}
