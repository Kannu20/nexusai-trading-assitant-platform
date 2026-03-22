'use client';

// ================================================================
// app/asset/[id]/page.tsx — Full asset analysis page
// Includes: live price, OHLCV chart, technicals, news, AI analysis
// ================================================================

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, TrendingUp, TrendingDown, RefreshCw,
  Newspaper, Brain, Activity, BarChart2, Minus,
  ExternalLink, AlertCircle, Loader2, Zap, Target,
  ShieldAlert, CheckCircle2, ChevronUp, ChevronDown,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, ComposedChart,
  Bar, Line,
} from 'recharts';
import { ASSETS } from '@/lib/mockData';
import { cn, formatCurrency, formatPercent } from '@/lib/utils';
import type { AnalysisResult } from '@/lib/openrouter';

// ── Types ─────────────────────────────────────────────────────────
interface CandleBar {
  timestamp: number; date: string;
  open: number; high: number; low: number; close: number; volume: number;
}
interface IndicatorBar {
  sma20: number | null; sma50: number | null;
  rsi14: number | null; bbUpper: number | null; bbLower: number | null;
}
interface NewsItem {
  id: number; headline: string; summary: string;
  source: string; url: string; image: string | null;
  datetime: number; timeAgo: string;
}

// ── Resolution options ────────────────────────────────────────────
const RESOLUTIONS = [
  { label: '1D',  value: '60', days: 4 },
  { label: '1W',  value: 'D',  days: 7 },
  { label: '1M',  value: 'D',  days: 30 },
  { label: '3M',  value: 'D',  days: 90 },
  { label: '1Y',  value: 'D',  days: 365 },
] as const;

// ── Sentiment colors ───────────────────────────────────────────────
const SENTIMENT_CONFIG = {
  bullish: { color: '#00ff88', bg: 'bg-accent-green/10',  border: 'border-accent-green/25', icon: TrendingUp,   label: 'Bullish' },
  neutral: { color: '#00d4ff', bg: 'bg-accent-cyan/10',   border: 'border-accent-cyan/25',  icon: Minus,        label: 'Neutral' },
  bearish: { color: '#ff4466', bg: 'bg-accent-red/10',    border: 'border-accent-red/25',   icon: TrendingDown, label: 'Bearish' },
};

const REC_COLORS: Record<string, string> = {
  'Strong Buy': '#00ff88', 'Buy': '#00d4ff', 'Hold': '#ffaa00', 'Sell': '#ff8844', 'Strong Sell': '#ff4466',
};

// ── Custom Tooltip ─────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const bar = payload[0]?.payload;
  return (
    <div className="bg-surface-3 border border-border rounded-xl px-3 py-2.5 text-xs shadow-card space-y-1 min-w-[140px]">
      <p className="text-white/50 font-mono mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => p.value != null && (
        <div key={i} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.stroke }} />
            <span className="text-white/50">{p.name}</span>
          </span>
          <span className="font-mono text-white font-semibold">${Number(p.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
        </div>
      ))}
    </div>
  );
};

const RSITooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length || payload[0]?.value == null) return null;
  const v = payload[0].value;
  const zone = v > 70 ? 'text-accent-red' : v < 30 ? 'text-accent-green' : 'text-white/70';
  return (
    <div className="bg-surface-3 border border-border rounded-xl px-3 py-2 text-xs shadow-card">
      <p className="text-white/40 font-mono mb-1">{label}</p>
      <p className={`font-mono font-bold ${zone}`}>RSI {v.toFixed(1)}</p>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────
export default function AssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router  = useRouter();

  const mockAsset = ASSETS.find((a) => a.id === id);

  // State
  const [quote,       setQuote]       = useState<any>(null);
  const [resolution,  setResolution]  = useState<typeof RESOLUTIONS[number]>(RESOLUTIONS[2]);
  const [bars,        setBars]        = useState<(CandleBar & IndicatorBar)[]>([]);
  const [news,        setNews]        = useState<NewsItem[]>([]);
  const [analysis,    setAnalysis]    = useState<AnalysisResult | null>(null);
  const [activeTab,   setActiveTab]   = useState<'chart' | 'news' | 'analysis'>('chart');

  const [loadingQuote,    setLoadingQuote]    = useState(true);
  const [loadingCandle,   setLoadingCandle]   = useState(true);
  const [loadingNews,     setLoadingNews]     = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analyzeError,    setAnalyzeError]    = useState<string | null>(null);
  const [showBB,          setShowBB]          = useState(false);
  const [showSMAs,        setShowSMAs]        = useState(true);
  const [lastRefreshed,   setLastRefreshed]   = useState<string>('');

  // ── Fetch live quote ──────────────────────────────────────────
  const fetchQuote = useCallback(async () => {
    setLoadingQuote(true);
    try {
      const res = await fetch(`/api/market/quotes?ids=${id}`);
      const data = await res.json();
      const asset = data.assets?.[0];
      if (asset) { setQuote(asset); setLastRefreshed(new Date().toLocaleTimeString()); }
    } catch { /* use mock */ }
    finally { setLoadingQuote(false); }
  }, [id]);

  // ── Fetch candles ─────────────────────────────────────────────
  const fetchCandles = useCallback(async () => {
    setLoadingCandle(true);
    setBars([]);
    try {
      const to   = Math.floor(Date.now() / 1000);
      const from = to - resolution.days * 86400;
      const res  = await fetch(`/api/market/candle?id=${id}&resolution=${resolution.value}&from=${from}&to=${to}`);
      const data = await res.json();
      if (data.bars) {
        const merged = data.bars.map((b: Bar, i: number) => ({
          ...b,
          ...(data.indicators[i] ?? {}),
        }));
        setBars(merged);
      }
    } catch { /* silently fail */ }
    finally { setLoadingCandle(false); }
  }, [id, resolution]);

  // ── Fetch news ────────────────────────────────────────────────
  const fetchNews = useCallback(async () => {
    setLoadingNews(true);
    try {
      const res  = await fetch(`/api/market/news?id=${id}&limit=10`);
      const data = await res.json();
      if (data.items) setNews(data.items);
    } catch { /* silently fail */ }
    finally { setLoadingNews(false); }
  }, [id]);

  // ── Run AI analysis ───────────────────────────────────────────
  const runAnalysis = useCallback(async () => {
    if (!quote && !mockAsset) return;
    setLoadingAnalysis(true);
    setAnalyzeError(null);
    const asset = quote ?? mockAsset;

    try {
      const priceHistory = bars.slice(-60).map((b) => ({
        date:  b.date,
        close: b.close,
      }));

      const lastBar  = bars[bars.length - 1];
      const rsi14    = lastBar?.rsi14  ?? 50;
      const sma20    = lastBar?.sma20  ?? asset.price;
      const sma50    = lastBar?.sma50  ?? asset.price;

      const res = await fetch('/api/market/analyze', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetName:    asset.name,
          symbol:       asset.symbol,
          currentPrice: asset.price,
          change24h:    asset.change,
          high24h:      asset.high24h,
          low24h:       asset.low24h,
          priceHistory,
          rsi14,
          sma20,
          sma50,
          newsHeadlines: news.slice(0, 5).map((n) => n.headline),
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const result = await res.json();
      setAnalysis(result);
    } catch (err: any) {
      setAnalyzeError(err.message ?? 'Analysis failed');
    } finally {
      setLoadingAnalysis(false);
    }
  }, [quote, mockAsset, bars, news]);

  useEffect(() => { fetchQuote(); fetchNews(); }, [fetchQuote, fetchNews]);
  useEffect(() => { fetchCandles(); }, [fetchCandles]);

  // Auto-refresh quote every 30s
  useEffect(() => {
    const id = setInterval(fetchQuote, 30_000);
    return () => clearInterval(id);
  }, [fetchQuote]);

  const asset     = quote ?? mockAsset;
  const isPos     = (asset?.change ?? 0) >= 0;
  const latestBar = bars[bars.length - 1];
  const rsiNow    = latestBar?.rsi14;
  const sma20Now  = latestBar?.sma20;
  const sma50Now  = latestBar?.sma50;

  if (!asset && !loadingQuote) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-white/30">
        <AlertCircle className="w-10 h-10 mb-4" />
        <p className="text-sm">Asset not found: <code>{id}</code></p>
        <button onClick={() => router.back()} className="mt-4 text-accent-cyan text-sm hover:underline">← Go back</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-slide-up">

      {/* ── Back + header ── */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-surface-2 border border-border text-white/40 hover:text-white hover:border-border-bright transition-all mt-1 flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          {/* Asset name row */}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-white font-display">
              {asset?.name ?? '...'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-2 border border-border text-white/40 text-xs font-mono">
              {asset?.symbol ?? ''}
            </span>
            {quote?.isLive && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent-green/10 border border-accent-green/20 text-accent-green text-[10px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
                LIVE
              </span>
            )}
          </div>

          {/* Price row */}
          <div className="flex flex-wrap items-end gap-3 mt-1">
            {loadingQuote && !asset ? (
              <div className="h-9 w-40 bg-surface-3 rounded-lg animate-pulse" />
            ) : (
              <>
                <span className="text-3xl font-bold text-white font-mono">
                  {formatCurrency(asset?.price ?? 0)}
                </span>
                <div className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold',
                  isPos ? 'bg-accent-green/12 text-accent-green' : 'bg-accent-red/12 text-accent-red'
                )}>
                  {isPos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {formatPercent(asset?.change ?? 0)}
                  <span className="text-xs opacity-70">({isPos ? '+' : ''}{formatCurrency(asset?.changeAbs ?? 0)})</span>
                </div>
                {lastRefreshed && (
                  <span className="text-[10px] text-white/25 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Updated {lastRefreshed}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="hidden lg:grid grid-cols-4 gap-3 flex-shrink-0">
          {[
            { label: 'Open',       value: formatCurrency(asset?.open ?? asset?.prevClose ?? 0) },
            { label: '24h High',   value: formatCurrency(asset?.high24h ?? 0) },
            { label: '24h Low',    value: formatCurrency(asset?.low24h ?? 0) },
            { label: 'Prev Close', value: formatCurrency(asset?.prevClose ?? 0) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface-2 border border-border rounded-xl px-3 py-2 text-center min-w-[88px]">
              <p className="text-[9px] text-white/30 font-mono uppercase">{label}</p>
              <p className="text-sm font-mono font-semibold text-white mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Technical indicators strip ── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { label: 'RSI 14', value: rsiNow != null ? rsiNow.toFixed(1) : '—', sub: rsiNow != null ? (rsiNow > 70 ? 'Overbought' : rsiNow < 30 ? 'Oversold' : 'Neutral') : '', color: rsiNow != null ? (rsiNow > 70 ? '#ff4466' : rsiNow < 30 ? '#00ff88' : '#00d4ff') : '#666' },
          { label: 'SMA 20', value: sma20Now != null ? formatCurrency(sma20Now) : '—', sub: sma20Now != null ? (asset?.price > sma20Now ? '▲ Above' : '▼ Below') : '', color: sma20Now != null ? (asset?.price > sma20Now ? '#00ff88' : '#ff4466') : '#666' },
          { label: 'SMA 50', value: sma50Now != null ? formatCurrency(sma50Now) : '—', sub: sma50Now != null ? (asset?.price > sma50Now ? '▲ Above' : '▼ Below') : '', color: sma50Now != null ? (asset?.price > sma50Now ? '#00ff88' : '#ff4466') : '#666' },
          { label: 'Volume',  value: asset?.volume ?? 'N/A',   sub: '24h traded',   color: '#ffaa00' },
          { label: 'Mkt Cap', value: asset?.marketCap ?? 'N/A', sub: 'Market cap',  color: '#9966ff' },
          { label: 'Category', value: asset?.category === 'stock' ? 'Equity' : 'Commodity', sub: 'Asset class', color: '#00d4ff' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-surface-2 border border-border rounded-xl px-3 py-2.5">
            <p className="text-[9px] text-white/30 font-mono uppercase">{label}</p>
            <p className="text-sm font-mono font-semibold mt-0.5" style={{ color }}>{value}</p>
            {sub && <p className="text-[9px] text-white/30 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 bg-surface-2 border border-border rounded-2xl p-1">
        {[
          { id: 'chart',    label: 'Chart & Technicals', icon: BarChart2 },
          { id: 'news',     label: 'Market News',        icon: Newspaper },
          { id: 'analysis', label: 'AI Analysis',        icon: Brain },
        ].map(({ id: tid, label, icon: Icon }) => (
          <button
            key={tid}
            onClick={() => {
              setActiveTab(tid as any);
              if (tid === 'analysis' && !analysis && !loadingAnalysis) runAnalysis();
            }}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium flex-1 justify-center transition-all',
              activeTab === tid
                ? 'bg-accent-cyan/12 text-accent-cyan border border-accent-cyan/25'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          TAB: CHART
      ══════════════════════════════════════════ */}
      {activeTab === 'chart' && (
        <div className="space-y-4">
          {/* Chart controls */}
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex gap-1 bg-surface-2 border border-border rounded-xl p-1">
              {RESOLUTIONS.map((r) => (
                <button
                  key={r.label}
                  onClick={() => setResolution(r)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-mono transition-all',
                    resolution.label === r.label
                      ? 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/25'
                      : 'text-white/40 hover:text-white/70'
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSMAs((p) => !p)}
                className={cn('px-3 py-1.5 rounded-lg text-[11px] font-mono border transition-all', showSMAs ? 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/25' : 'text-white/40 border-border hover:border-border-bright')}
              >MA 20/50</button>
              <button
                onClick={() => setShowBB((p) => !p)}
                className={cn('px-3 py-1.5 rounded-lg text-[11px] font-mono border transition-all', showBB ? 'bg-purple-500/10 text-purple-400 border-purple-500/25' : 'text-white/40 border-border hover:border-border-bright')}
              >Bollinger</button>
              <button onClick={fetchCandles} className="p-1.5 rounded-lg text-white/30 hover:text-white border border-border hover:border-border-bright transition-all">
                <RefreshCw className={cn('w-3.5 h-3.5', loadingCandle && 'animate-spin')} />
              </button>
            </div>
          </div>

          {/* Main price chart */}
          <div className="bg-surface-2 border border-border rounded-2xl p-4 shadow-card">
            <div className="h-72 sm:h-96">
              {loadingCandle ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-accent-cyan animate-spin" />
                </div>
              ) : bars.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-white/25">
                  <BarChart2 className="w-8 h-8 mb-2" />
                  <p className="text-sm">No candle data available</p>
                  <p className="text-xs mt-1 text-white/15">API key may be needed — showing mock sparkline</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={bars} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={isPos ? '#00ff88' : '#ff4466'} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={isPos ? '#00ff88' : '#ff4466'} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="bbGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#9966ff" stopOpacity={0.08} />
                        <stop offset="95%" stopColor="#9966ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" />
                    <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => v >= 1000 ? `$${(v/1000).toFixed(1)}k` : `$${v.toFixed(2)}`}
                      width={60} domain={['auto','auto']} />
                    <Tooltip content={<ChartTooltip />} />

                    {showBB && (
                      <>
                        <Area dataKey="bbUpper" name="BB Upper" stroke="#9966ff" strokeWidth={1} strokeDasharray="3 3" fill="url(#bbGrad)" dot={false} connectNulls />
                        <Area dataKey="bbLower" name="BB Lower" stroke="#9966ff" strokeWidth={1} strokeDasharray="3 3" fill="none" dot={false} connectNulls />
                      </>
                    )}

                    <Area dataKey="close" name="Price" stroke={isPos ? '#00ff88' : '#ff4466'} strokeWidth={2} fill="url(#priceGrad)" dot={false} connectNulls />

                    {showSMAs && (
                      <>
                        <Line dataKey="sma20" name="SMA 20" stroke="#00d4ff" strokeWidth={1.5} dot={false} connectNulls strokeDasharray="5 3" />
                        <Line dataKey="sma50" name="SMA 50" stroke="#ffaa00" strokeWidth={1.5} dot={false} connectNulls strokeDasharray="5 3" />
                      </>
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* RSI chart */}
          {bars.length > 0 && (
            <div className="bg-surface-2 border border-border rounded-2xl p-4 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-white/40">RSI (14)</span>
                {rsiNow != null && (
                  <span className={cn('text-xs font-mono font-bold', rsiNow > 70 ? 'text-accent-red' : rsiNow < 30 ? 'text-accent-green' : 'text-white/60')}>
                    {rsiNow.toFixed(1)} · {rsiNow > 70 ? 'Overbought' : rsiNow < 30 ? 'Oversold' : 'Neutral'}
                  </span>
                )}
              </div>
              <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={bars} margin={{ top: 2, right: 10, left: 0, bottom: 2 }}>
                    <defs>
                      <linearGradient id="rsiGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#9966ff" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#9966ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" />
                    <XAxis dataKey="date" hide />
                    <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9 }} axisLine={false} tickLine={false} width={28} ticks={[30, 50, 70]} />
                    <Tooltip content={<RSITooltip />} />
                    <ReferenceLine y={70} stroke="#ff4466" strokeDasharray="3 3" strokeOpacity={0.4} />
                    <ReferenceLine y={30} stroke="#00ff88" strokeDasharray="3 3" strokeOpacity={0.4} />
                    <ReferenceLine y={50} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                    <Area dataKey="rsi14" name="RSI" stroke="#9966ff" strokeWidth={1.5} fill="url(#rsiGrad)" dot={false} connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Volume bars */}
          {bars.length > 0 && bars.some((b) => b.volume > 0) && (
            <div className="bg-surface-2 border border-border rounded-2xl p-4 shadow-card">
              <p className="text-xs font-mono text-white/40 mb-2">Volume</p>
              <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={bars} margin={{ top: 2, right: 10, left: 0, bottom: 2 }}>
                    <XAxis dataKey="date" hide />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }} axisLine={false} tickLine={false} width={36} tickFormatter={(v) => v > 1e6 ? `${(v/1e6).toFixed(0)}M` : v > 1e3 ? `${(v/1e3).toFixed(0)}K` : `${v}`} />
                    <Tooltip content={({ active, payload, label }: any) => active && payload?.[0]?.value ? (
                      <div className="bg-surface-3 border border-border rounded-xl px-3 py-2 text-xs">
                        <p className="text-white/40 font-mono">{label}</p>
                        <p className="text-white font-mono">{Number(payload[0].value).toLocaleString()}</p>
                      </div>
                    ) : null} />
                    <Bar dataKey="volume" name="Volume" fill={isPos ? 'rgba(0,255,136,0.3)' : 'rgba(255,68,102,0.3)'} radius={[2,2,0,0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB: NEWS
      ══════════════════════════════════════════ */}
      {activeTab === 'news' && (
        <div className="space-y-3">
          {loadingNews ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-surface-2 border border-border rounded-2xl p-5 animate-pulse">
                <div className="h-4 bg-surface-3 rounded w-3/4 mb-2" />
                <div className="h-3 bg-surface-3 rounded w-1/2" />
              </div>
            ))
          ) : news.length === 0 ? (
            <div className="py-16 text-center text-white/25">
              <Newspaper className="w-8 h-8 mx-auto mb-3" />
              <p>No news available</p>
            </div>
          ) : (
            news.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="block bg-surface-2 border border-border rounded-2xl p-5 hover:border-border-bright hover:bg-surface-3 transition-all shadow-card group"
              >
                <div className="flex gap-4">
                  {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" className="w-20 h-16 rounded-xl object-cover flex-shrink-0 hidden sm:block" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-white group-hover:text-accent-cyan transition-colors leading-snug line-clamp-2">
                        {item.headline}
                      </h3>
                      <ExternalLink className="w-3.5 h-3.5 text-white/20 group-hover:text-accent-cyan flex-shrink-0 mt-0.5 transition-colors" />
                    </div>
                    <p className="text-xs text-white/40 mt-1.5 line-clamp-2 leading-relaxed">{item.summary}</p>
                    <div className="flex items-center gap-2 mt-2.5 text-[10px] font-mono text-white/25">
                      <span className="px-1.5 py-0.5 rounded-full bg-surface-3 border border-border">{item.source}</span>
                      <Clock className="w-3 h-3" />
                      <span>{item.timeAgo}</span>
                    </div>
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB: AI ANALYSIS
      ══════════════════════════════════════════ */}
      {activeTab === 'analysis' && (
        <div className="space-y-4">
          {loadingAnalysis ? (
            <div className="bg-surface-2 border border-border rounded-2xl p-10 flex flex-col items-center gap-4 shadow-card">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-cyan to-purple-500 flex items-center justify-center animate-pulse-glow">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-white">Analyzing {asset?.name}...</p>
                <p className="text-xs text-white/40 mt-1">Processing price history, technicals & news</p>
              </div>
              <div className="flex gap-1.5">
                {[0, 150, 300].map((d) => (
                  <div key={d} className="w-2 h-2 rounded-full bg-accent-cyan animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          ) : analyzeError ? (
            <div className="bg-accent-red/5 border border-accent-red/25 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-accent-red flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">Analysis failed</p>
                  <p className="text-xs text-white/50 mt-1">{analyzeError}</p>
                  <p className="text-[11px] text-white/30 mt-1">Check that OPENROUTER_API_KEY is set in .env.local</p>
                </div>
              </div>
              <button onClick={runAnalysis} className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-3 border border-border text-white/60 hover:text-white text-sm transition-all">
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Analysis
              </button>
            </div>
          ) : !analysis ? (
            <div className="bg-surface-2 border border-border rounded-2xl p-10 flex flex-col items-center gap-4 shadow-card">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-cyan/20 to-purple-500/20 border border-accent-cyan/25 flex items-center justify-center">
                <Brain className="w-7 h-7 text-accent-cyan" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-white">AI Market Analysis</p>
                <p className="text-xs text-white/40 mt-1 max-w-xs">
                  Get an AI-powered prediction based on {resolution.label} price history, technical indicators, and latest news.
                </p>
              </div>
              <button
                onClick={runAnalysis}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-accent-cyan to-blue-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-glow-cyan"
              >
                <Zap className="w-4 h-4" />
                Generate AI Analysis
              </button>
            </div>
          ) : (
            <>
              {/* ── Sentiment + recommendation banner ── */}
              {(() => {
                const cfg = SENTIMENT_CONFIG[analysis.sentiment];
                const SentIcon = cfg.icon;
                return (
                  <div className={cn('rounded-2xl p-5 border flex flex-col sm:flex-row items-start sm:items-center gap-4', cfg.bg, cfg.border)}>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${cfg.color}20` }}>
                        <SentIcon className="w-6 h-6" style={{ color: cfg.color }} />
                      </div>
                      <div>
                        <p className="text-xs text-white/40 font-mono uppercase">Market Sentiment</p>
                        <p className="text-xl font-bold" style={{ color: cfg.color }}>{cfg.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="text-center">
                        <p className="text-[9px] text-white/30 font-mono uppercase mb-1">Score</p>
                        <div className="relative w-12 h-12">
                          <svg className="w-12 h-12 -rotate-90">
                            <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.08)" strokeWidth="4" fill="none" />
                            <circle cx="24" cy="24" r="20" stroke={cfg.color} strokeWidth="4" fill="none"
                              strokeDasharray={`${2 * Math.PI * 20}`}
                              strokeDashoffset={`${2 * Math.PI * 20 * (1 - analysis.score / 100)}`}
                              strokeLinecap="round" />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: cfg.color }}>{analysis.score}</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-white/30 font-mono uppercase mb-1">Confidence</p>
                        <p className="text-xl font-bold text-white">{analysis.confidence}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-white/30 font-mono uppercase mb-1">Recommendation</p>
                        <p className="text-lg font-bold" style={{ color: REC_COLORS[analysis.recommendation] ?? '#fff' }}>
                          {analysis.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── Summary ── */}
              <div className="bg-surface-2 border border-border rounded-2xl p-5 shadow-card">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-accent-cyan" />
                  <h3 className="text-sm font-semibold text-white">Executive Summary</h3>
                  <span className="ml-auto text-[10px] text-white/25 font-mono">Generated {new Date(analysis.generatedAt).toLocaleTimeString()}</span>
                </div>
                <p className="text-sm text-white/70 leading-relaxed">{analysis.summary}</p>
              </div>

              {/* ── Price targets ── */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: '7-Day Target', value: analysis.target7d, icon: Target },
                  { label: '30-Day Target', value: analysis.target30d, icon: Target },
                ].map(({ label, value, icon: Icon }) => {
                  const curr = asset?.price ?? 0;
                  const diff = value - curr;
                  const pct  = ((diff / curr) * 100).toFixed(2);
                  const pos  = diff >= 0;
                  return (
                    <div key={label} className="bg-surface-2 border border-border rounded-2xl p-5 shadow-card">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4 text-accent-cyan" />
                        <p className="text-xs text-white/40 font-mono uppercase">{label}</p>
                      </div>
                      <p className="text-2xl font-bold text-white font-mono">{formatCurrency(value)}</p>
                      <div className={cn('flex items-center gap-1 mt-1.5 text-xs font-mono', pos ? 'text-accent-green' : 'text-accent-red')}>
                        {pos ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {pos ? '+' : ''}{formatCurrency(diff)} ({pos ? '+' : ''}{pct}%)
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Key factors ── */}
              <div className="bg-surface-2 border border-border rounded-2xl p-5 shadow-card">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-accent-amber" />
                  <h3 className="text-sm font-semibold text-white">Key Factors</h3>
                  <span className={cn('ml-auto px-2.5 py-0.5 rounded-full text-[10px] font-mono border',
                    analysis.riskLevel === 'Low'  ? 'bg-accent-green/10 text-accent-green border-accent-green/25' :
                    analysis.riskLevel === 'Medium'? 'bg-accent-amber/10 text-accent-amber border-accent-amber/25' :
                                                     'bg-accent-red/10 text-accent-red border-accent-red/25'
                  )}>
                    {analysis.riskLevel} Risk
                  </span>
                </div>
                <div className="space-y-2.5">
                  {analysis.keyFactors.map((factor, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent-cyan flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-white/70 leading-relaxed">{factor}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Technicals + Fundamentals ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-surface-2 border border-border rounded-2xl p-5 shadow-card">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart2 className="w-4 h-4 text-accent-cyan" />
                    <h3 className="text-sm font-semibold text-white">Technical Analysis</h3>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed">{analysis.technicals}</p>
                </div>
                <div className="bg-surface-2 border border-border rounded-2xl p-5 shadow-card">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldAlert className="w-4 h-4 text-accent-amber" />
                    <h3 className="text-sm font-semibold text-white">Macro / Fundamentals</h3>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed">{analysis.fundamentals}</p>
                </div>
              </div>

              {/* Re-analyze button */}
              <div className="flex justify-end">
                <button
                  onClick={runAnalysis}
                  disabled={loadingAnalysis}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-2 border border-border text-white/40 hover:text-white hover:border-border-bright text-xs transition-all"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5', loadingAnalysis && 'animate-spin')} />
                  Refresh Analysis
                </button>
              </div>

              {/* Disclaimer */}
              <p className="text-[10px] text-white/20 text-center font-mono px-4">
                ⚠️ AI predictions are for informational purposes only. Not financial advice. Past performance does not guarantee future results.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}