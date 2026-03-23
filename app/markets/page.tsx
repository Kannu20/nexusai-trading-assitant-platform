'use client'
// ================================================================
// app/markets/page.tsx — Live markets with real-time Finnhub data
// ================================================================

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, SortAsc, SortDesc, Filter, RefreshCw,
  TrendingUp, TrendingDown, Wifi, WifiOff, Star,
  StarOff, ArrowUpRight, Clock, BarChart2, Zap,
  ChevronUp, ChevronDown, Minus,
} from 'lucide-react';
import { ASSETS, type Asset } from '@/lib/mockData';
import { formatCurrency, formatPercent, cn } from '@/lib/utils';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

// ── Types ─────────────────────────────────────────────────────────
type SortKey = 'name' | 'price' | 'change' | 'volume' | 'marketCap' | 'high24h' | 'low24h';
type Category = 'all' | 'stock' | 'commodity';
type ViewMode = 'table' | 'grid';

interface LiveAsset extends Asset {
  isLive?:    boolean;
  prevClose?: number;
  open?:      number;
  timestamp?: number;
}

// ── Constants ─────────────────────────────────────────────────────
const ASSET_ICONS: Record<string, string> = {
  gold: '🥇', silver: '🥈', 'crude-oil': '🛢️',
  copper: '🔶', aapl: '🍎', msft: '💻', nvda: '⚡', tsla: '🚗',
};

const CATEGORY_LABELS: Record<Category, string> = {
  all: 'All', stock: 'Stocks', commodity: 'Commodities',
};

// ── Local storage key for watchlist ───────────────────────────────
const WL_KEY = 'nexusai-watchlist';

// ── Sparkline mini chart ──────────────────────────────────────────
function Sparkline({ data, isPos, id }: { data: number[]; isPos: boolean; id: string }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <div className="w-24 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={`sg-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={isPos ? '#00ff88' : '#ff4466'} stopOpacity={0.3} />
              <stop offset="95%" stopColor={isPos ? '#00ff88' : '#ff4466'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={isPos ? '#00ff88' : '#ff4466'} strokeWidth={1.5} fill={`url(#sg-${id})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Pulsing live dot ──────────────────────────────────────────────
function LiveDot({ isLive }: { isLive: boolean }) {
  if (!isLive) return <span className="w-1.5 h-1.5 rounded-full bg-white/20 inline-block" />;
  return (
    <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-green" />
    </span>
  );
}

// ── Change arrow icon ─────────────────────────────────────────────
function ChangeIcon({ pct }: { pct: number }) {
  if (pct > 0.5) return <TrendingUp className="w-3 h-3" />;
  if (pct < -0.5) return <TrendingDown className="w-3 h-3" />;
  return <Minus className="w-3 h-3" />;
}

// ── Grid card component ───────────────────────────────────────────
function AssetGridCard({ asset, isPos, onWatchlist, onToggleWL, onClick }: {
  asset: LiveAsset; isPos: boolean;
  onWatchlist: boolean; onToggleWL: (e: React.MouseEvent) => void; onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="relative bg-surface-2 border border-border rounded-2xl p-4 hover:border-border-bright hover:bg-surface-3 transition-all cursor-pointer group shadow-card"
    >
      {/* Watchlist star */}
      <button
        onClick={onToggleWL}
        className="absolute top-3 right-3 p-1 rounded-lg text-white/20 hover:text-accent-amber hover:bg-accent-amber/10 transition-all z-10"
      >
        {onWatchlist
          ? <Star className="w-3.5 h-3.5 text-accent-amber fill-accent-amber" />
          : <StarOff className="w-3.5 h-3.5" />
        }
      </button>

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-xl bg-surface-3 border border-border flex items-center justify-center text-lg flex-shrink-0">
          {ASSET_ICONS[asset.id] ?? '📊'}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white truncate">{asset.name}</p>
          <div className="flex items-center gap-1.5">
            <LiveDot isLive={asset.isLive ?? false} />
            <p className="text-[10px] text-white/35 font-mono">{asset.symbol}</p>
          </div>
        </div>
      </div>

      {/* Price */}
      <p className="text-xl font-bold text-white font-mono mb-1">
        {formatCurrency(asset.price)}
      </p>

      {/* Change badge */}
      <div className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold mb-3',
        isPos ? 'bg-accent-green/12 text-accent-green' : 'bg-accent-red/12 text-accent-red'
      )}>
        <ChangeIcon pct={asset.change} />
        {formatPercent(asset.change)}
      </div>

      {/* Sparkline */}
      <Sparkline data={asset.sparkline} isPos={isPos} id={asset.id} />

      {/* Footer */}
      <div className="flex justify-between mt-2 pt-2 border-t border-border/50 text-[10px] font-mono text-white/30">
        <span>H: {formatCurrency(asset.high24h, 0)}</span>
        <span>L: {formatCurrency(asset.low24h, 0)}</span>
        <span>{asset.volume}</span>
      </div>

      {/* Hover arrow */}
      <ArrowUpRight className="absolute bottom-3 right-3 w-3.5 h-3.5 text-white/10 group-hover:text-accent-cyan transition-colors" />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function MarketsPage() {
  const router = useRouter();

  // State
  const [assets, setAssets]             = useState<LiveAsset[]>(ASSETS);
  const [query, setQuery]               = useState('');
  const [category, setCategory]         = useState<Category>('all');
  const [sortKey, setSortKey]           = useState<SortKey>('price');
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode]         = useState<ViewMode>('table');
  const [watchlist, setWatchlist]       = useState<Set<string>>(new Set());
  const [filterWL, setFilterWL]         = useState(false);
  const [isLive, setIsLive]             = useState(false);
  const [loading, setLoading]           = useState(false);
  const [lastUpdated, setLastUpdated]   = useState('');
  const [countdown, setCountdown]       = useState(30);
  const timerRef                        = useRef<NodeJS.Timeout | null>(null);

  // Load watchlist from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(WL_KEY);
      if (stored) setWatchlist(new Set(JSON.parse(stored)));
    } catch { /* ignore */ }
  }, []);

  const toggleWatchlist = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWatchlist((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem(WL_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // ── Fetch live data ───────────────────────────────────────────
  const fetchLive = useCallback(async () => {
    setLoading(true);
    setCountdown(30);
    try {
      const ids = ASSETS.map((a) => a.id).join(',');
      const res = await fetch(`/api/market/quotes?ids=${ids}`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (data.assets?.length) {
        setAssets(data.assets.map((a: LiveAsset) => ({
          ...a,
          sparkline: ASSETS.find((m) => m.id === a.id)?.sparkline ?? [],
        })));
        setIsLive(data.assets[0]?.isLive ?? false);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch {
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + 30s auto-refresh
  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 30_000);
    return () => clearInterval(interval);
  }, [fetchLive]);

  // Countdown timer (visual)
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((p) => (p <= 1 ? 30 : p - 1));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [lastUpdated]);

  // ── Filter + sort ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = assets;
    if (filterWL) list = list.filter((a) => watchlist.has(a.id));
    if (category !== 'all') list = list.filter((a) => a.category === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((a) =>
        a.name.toLowerCase().includes(q) ||
        a.symbol.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      let av: number | string = 0, bv: number | string = 0;
      if (sortKey === 'volume') {
        av = parseFloat((a.volume ?? '0').replace(/[$BMK]/g, ''));
        bv = parseFloat((b.volume ?? '0').replace(/[$BMK]/g, ''));
      } else if (sortKey === 'marketCap') {
        const parse = (s: string) => {
          if (s === 'N/A') return 0;
          const n = parseFloat(s.replace(/[$BMK,T]/g, ''));
          if (s.includes('T')) return n * 1e12;
          if (s.includes('B')) return n * 1e9;
          return n;
        };
        av = parse(a.marketCap ?? '0');
        bv = parse(b.marketCap ?? '0');
      } else {
        av = (a as any)[sortKey] ?? 0;
        bv = (b as any)[sortKey] ?? 0;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [assets, query, category, sortKey, sortDir, filterWL, watchlist]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <Filter className="w-3 h-3 opacity-25" />;
    return sortDir === 'asc'
      ? <SortAsc className="w-3 h-3 text-accent-cyan" />
      : <SortDesc className="w-3 h-3 text-accent-cyan" />;
  };

  // Summary stats
  const gainers  = assets.filter((a) => a.change > 0).length;
  const losers   = assets.filter((a) => a.change < 0).length;
  const avgChg   = (assets.reduce((s, a) => s + a.change, 0) / assets.length).toFixed(2);
  const topMover = [...assets].sort((a, b) => Math.abs(b.change) - Math.abs(a.change))[0];

  // Table columns
  const COLUMNS: { label: string; key: SortKey; align?: string }[] = [
    { label: 'Asset',    key: 'name' },
    { label: 'Price',    key: 'price' },
    { label: '24h Chg',  key: 'change' },
    { label: '24h High', key: 'high24h' },
    { label: '24h Low',  key: 'low24h' },
    { label: 'Volume',   key: 'volume' },
    { label: 'Mkt Cap',  key: 'marketCap' },
  ];

  return (
    <div className="space-y-4 animate-slide-up">

      {/* ── Live status bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {isLive ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-accent-green/8 border border-accent-green/20 text-[11px] font-mono text-accent-green">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-green" />
              </span>
              <Wifi className="w-3 h-3" />
              Live · Finnhub
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-2 border border-border text-[11px] font-mono text-white/35">
              <WifiOff className="w-3 h-3" />
              Demo data — add FINNHUB_API_KEY for live prices
            </div>
          )}
          {lastUpdated && (
            <span className="flex items-center gap-1 text-[10px] text-white/25 font-mono">
              <Clock className="w-3 h-3" />
              {lastUpdated} · refresh in {countdown}s
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex gap-0.5 bg-surface-2 border border-border rounded-lg p-0.5">
            {(['table', 'grid'] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5',
                  viewMode === v
                    ? 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/25'
                    : 'text-white/35 hover:text-white/70'
                )}
              >
                {v === 'table'
                  ? <><BarChart2 className="w-3 h-3" />Table</>
                  : <><Zap className="w-3 h-3" />Grid</>
                }
              </button>
            ))}
          </div>
          <button
            onClick={fetchLive}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 border border-border text-white/40 hover:text-white hover:border-border-bright text-xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-accent-green/8 border border-accent-green/20 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-accent-green" />
            <p className="text-[10px] text-white/40 font-mono uppercase">Gainers</p>
          </div>
          <p className="text-2xl font-bold text-accent-green">{gainers}</p>
          <p className="text-[10px] text-white/25 mt-0.5 font-mono">{assets.length} tracked</p>
        </div>
        <div className="bg-accent-red/8 border border-accent-red/20 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-accent-red" />
            <p className="text-[10px] text-white/40 font-mono uppercase">Losers</p>
          </div>
          <p className="text-2xl font-bold text-accent-red">{losers}</p>
          <p className="text-[10px] text-white/25 mt-0.5 font-mono">{((losers/assets.length)*100).toFixed(0)}% declining</p>
        </div>
        <div className="bg-surface-2 border border-border rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="w-3.5 h-3.5 text-accent-cyan" />
            <p className="text-[10px] text-white/40 font-mono uppercase">Avg Change</p>
          </div>
          <p className={cn('text-2xl font-bold', parseFloat(avgChg) >= 0 ? 'text-accent-green' : 'text-accent-red')}>
            {parseFloat(avgChg) >= 0 ? '+' : ''}{avgChg}%
          </p>
          <p className="text-[10px] text-white/25 mt-0.5 font-mono">market average</p>
        </div>
        <div className="bg-surface-2 border border-border rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-3.5 h-3.5 text-accent-amber" />
            <p className="text-[10px] text-white/40 font-mono uppercase">Top Mover</p>
          </div>
          {topMover && (
            <>
              <p className="text-sm font-bold text-white">{topMover.name}</p>
              <p className={cn('text-xs font-mono mt-0.5', topMover.change >= 0 ? 'text-accent-green' : 'text-accent-red')}>
                {formatPercent(topMover.change)}
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search by name, symbol..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-2 border border-border text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-accent-cyan/50 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="flex gap-1 bg-surface-2 border border-border rounded-xl p-1">
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                category === c
                  ? 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/25'
                  : 'text-white/40 hover:text-white/70'
              )}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>

        {/* Watchlist filter */}
        <button
          onClick={() => setFilterWL((p) => !p)}
          className={cn(
            'flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all whitespace-nowrap',
            filterWL
              ? 'bg-accent-amber/10 border-accent-amber/30 text-accent-amber'
              : 'bg-surface-2 border-border text-white/40 hover:text-white/70 hover:border-border-bright'
          )}
        >
          <Star className={cn('w-3.5 h-3.5', filterWL && 'fill-accent-amber')} />
          Watchlist {watchlist.size > 0 && `(${watchlist.size})`}
        </button>
      </div>

      {/* ── Results count ── */}
      <div className="flex items-center justify-between text-[11px] font-mono text-white/30">
        <span>{filtered.length} assets{query ? ` matching "${query}"` : ''}</span>
        {filtered.length === 0 && query && (
          <button onClick={() => setQuery('')} className="text-accent-cyan hover:underline">Clear search</button>
        )}
      </div>

      {/* ══ TABLE VIEW ══════════════════════════════════════════ */}
      {viewMode === 'table' && (
        <div className="bg-surface-2 border border-border rounded-2xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-surface-3/60">
                  <th className="px-4 py-3.5 text-left text-[10px] font-mono text-white/30 uppercase w-10">#</th>
                  <th className="px-2 py-3.5 w-8" />
                  {COLUMNS.map(({ label, key }) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className="px-4 py-3.5 text-left text-[10px] font-mono text-white/40 uppercase tracking-wider cursor-pointer hover:text-white/70 transition-colors select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        {label}
                        <SortIcon k={key} />
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3.5 text-left text-[10px] font-mono text-white/40 uppercase tracking-wider">
                    7D Trend
                  </th>
                  <th className="px-4 py-3.5 text-[10px] font-mono text-white/30 uppercase" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-white/25">
                        <Search className="w-7 h-7" />
                        <p className="text-sm">No assets match your filters</p>
                        <button onClick={() => { setQuery(''); setCategory('all'); setFilterWL(false); }} className="text-accent-cyan text-xs hover:underline">Reset filters</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((asset, idx) => {
                    const isPos   = asset.change >= 0;
                    const inWL    = watchlist.has(asset.id);

                    return (
                      <tr
                        key={asset.id}
                        onClick={() => router.push(`/asset/${asset.id}`)}
                        className="border-b border-border/40 hover:bg-white/3 transition-all cursor-pointer group"
                      >
                        {/* Rank */}
                        <td className="px-4 py-3.5 text-white/25 text-xs font-mono">{idx + 1}</td>

                        {/* Watchlist star */}
                        <td className="px-2 py-3.5">
                          <button
                            onClick={(e) => toggleWatchlist(asset.id, e)}
                            className="p-1 rounded-lg text-white/15 hover:text-accent-amber hover:bg-accent-amber/10 transition-all"
                          >
                            {inWL
                              ? <Star className="w-3.5 h-3.5 text-accent-amber fill-accent-amber" />
                              : <StarOff className="w-3.5 h-3.5" />
                            }
                          </button>
                        </td>

                        {/* Asset name */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-surface-3 border border-border flex items-center justify-center text-base flex-shrink-0">
                              {ASSET_ICONS[asset.id] ?? '📊'}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-semibold text-white text-[13px] group-hover:text-accent-cyan transition-colors">{asset.name}</p>
                                <LiveDot isLive={asset.isLive ?? false} />
                              </div>
                              <p className="text-[10px] text-white/35 font-mono">{asset.symbol}</p>
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="px-4 py-3.5">
                          <p className="font-mono font-bold text-white text-sm tabular-nums">{formatCurrency(asset.price)}</p>
                        </td>

                        {/* 24h Change */}
                        <td className="px-4 py-3.5">
                          <div className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold',
                            isPos ? 'bg-accent-green/12 text-accent-green' : 'bg-accent-red/12 text-accent-red'
                          )}>
                            {isPos ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {formatPercent(asset.change)}
                          </div>
                        </td>

                        {/* High */}
                        <td className="px-4 py-3.5 font-mono text-white/60 text-xs tabular-nums">
                          {formatCurrency(asset.high24h)}
                        </td>

                        {/* Low */}
                        <td className="px-4 py-3.5 font-mono text-white/60 text-xs tabular-nums">
                          {formatCurrency(asset.low24h)}
                        </td>

                        {/* Volume */}
                        <td className="px-4 py-3.5 font-mono text-white/50 text-xs">{asset.volume}</td>

                        {/* Market Cap */}
                        <td className="px-4 py-3.5 font-mono text-white/50 text-xs">{asset.marketCap}</td>

                        {/* Sparkline */}
                        <td className="px-4 py-3.5">
                          <Sparkline data={asset.sparkline} isPos={isPos} id={`t-${asset.id}`} />
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface-3 border border-border group-hover:bg-accent-cyan/10 group-hover:border-accent-cyan/25 transition-all">
                            <ArrowUpRight className="w-3.5 h-3.5 text-white/25 group-hover:text-accent-cyan transition-colors" />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-border flex items-center justify-between text-[10px] font-mono text-white/25">
              <span>Showing {filtered.length} of {assets.length} assets</span>
              <span>{isLive ? '🟢 Prices updating every 30s via Finnhub' : '⚪ Demo mode — configure FINNHUB_API_KEY'}</span>
            </div>
          )}
        </div>
      )}

      {/* ══ GRID VIEW ════════════════════════════════════════════ */}
      {viewMode === 'grid' && (
        <>
          {filtered.length === 0 ? (
            <div className="py-16 text-center bg-surface-2 border border-border rounded-2xl">
              <div className="flex flex-col items-center gap-2 text-white/25">
                <Search className="w-7 h-7" />
                <p className="text-sm">No assets match your filters</p>
                <button
                  onClick={() => { setQuery(''); setCategory('all'); setFilterWL(false); }}
                  className="text-accent-cyan text-xs hover:underline"
                >
                  Reset filters
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map((asset) => (
                <AssetGridCard
                  key={asset.id}
                  asset={asset}
                  isPos={asset.change >= 0}
                  onWatchlist={watchlist.has(asset.id)}
                  onToggleWL={(e) => toggleWatchlist(asset.id, e)}
                  onClick={() => router.push(`/asset/${asset.id}`)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}