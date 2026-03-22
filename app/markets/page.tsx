'use client';

// ============================================================
// app/markets/page.tsx — Market table with search, filter, sort
// ============================================================

import { useState, useMemo } from 'react';
import { Search, SortAsc, SortDesc, Filter } from 'lucide-react';
import { ASSETS, type Asset } from '@/lib/mockData';
import { formatCurrency, formatPercent, cn } from '@/lib/utils';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

type SortKey = keyof Pick<Asset, 'name' | 'price' | 'change' | 'volume'>;
type Category = 'all' | 'stock' | 'commodity';

const CATEGORY_LABELS: Record<Category, string> = {
  all: 'All Assets',
  stock: 'Stocks',
  commodity: 'Commodities',
};

export default function MarketsPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [sortKey, setSortKey] = useState<SortKey>('price');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = useMemo(() => {
    let list = ASSETS;

    // Category filter
    if (category !== 'all') {
      list = list.filter((a) => a.category === category);
    }

    // Search
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.symbol.toLowerCase().includes(q)
      );
    }

    // Sort
    list = [...list].sort((a, b) => {
      let av: number | string = a[sortKey] ?? '';
      let bv: number | string = b[sortKey] ?? '';
      // volume is string like "₹42.3B" — sort by numeric
      if (sortKey === 'volume') {
        av = parseFloat((av as string).replace(/[₹BMK]/g, ''));
        bv = parseFloat((bv as string).replace(/[₹BMK]/g, ''));
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [query, category, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <Filter className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc'
      ? <SortAsc className="w-3 h-3 text-accent-cyan" />
      : <SortDesc className="w-3 h-3 text-accent-cyan" />;
  };

  return (
    <div className="space-y-5 animate-slide-up">
      {/* ── Controls ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search by name or symbol..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-2 border border-border text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-accent-cyan/50 transition-colors"
          />
        </div>

        {/* Category tabs */}
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
      </div>

      {/* ── Market summary row ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Gainers', value: ASSETS.filter(a => a.change > 0).length, color: 'text-accent-green', bg: 'bg-accent-green/10 border-accent-green/20' },
          { label: 'Losers', value: ASSETS.filter(a => a.change < 0).length, color: 'text-accent-red', bg: 'bg-accent-red/10 border-accent-red/20' },
          { label: 'Total Assets', value: ASSETS.length, color: 'text-accent-cyan', bg: 'bg-accent-cyan/10 border-accent-cyan/20' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-xl border px-4 py-3 ${bg}`}>
            <p className="text-[11px] text-white/40 font-mono uppercase">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="bg-surface-2 border border-border rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-surface-3">
                <th className="px-5 py-3.5 text-left text-[11px] font-mono text-white/40 uppercase tracking-wider w-8">#</th>
                {[
                  { label: 'Asset', key: 'name' as SortKey },
                  { label: 'Price', key: 'price' as SortKey },
                  { label: 'Change', key: 'change' as SortKey },
                  { label: 'Volume', key: 'volume' as SortKey },
                ].map(({ label, key }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="px-5 py-3.5 text-left text-[11px] font-mono text-white/40 uppercase tracking-wider cursor-pointer hover:text-white/70 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      {label} <SortIcon k={key} />
                    </div>
                  </th>
                ))}
                <th className="px-5 py-3.5 text-left text-[11px] font-mono text-white/40 uppercase tracking-wider">Trend</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-mono text-white/40 uppercase tracking-wider">Market Cap</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-white/30 text-sm">
                    No assets match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((asset, idx) => {
                  const isPos = asset.change >= 0;
                  const sparkData = asset.sparkline.map((v, i) => ({ i, v }));
                  return (
                    <tr
                      key={asset.id}
                      className="border-b border-border/40 hover:bg-white/3 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3.5 text-white/30 text-xs font-mono">{idx + 1}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0',
                            'bg-surface-3 border border-border'
                          )}>
                            {asset.category === 'stock' ? '📈' : asset.id === 'gold' ? '🥇' : asset.id === 'silver' ? '🥈' : asset.id === 'crude-oil' ? '🛢️' : '🔶'}
                          </div>
                          <div>
                            <p className="font-semibold text-white text-[13px]">{asset.name}</p>
                            <p className="text-[11px] text-white/40 font-mono">{asset.symbol}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-semibold text-white text-sm">
                        {formatCurrency(asset.price)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-mono font-semibold',
                          isPos ? 'bg-accent-green/12 text-accent-green' : 'bg-accent-red/12 text-accent-red'
                        )}>
                          {formatPercent(asset.change)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-white/60 text-xs">{asset.volume}</td>
                      <td className="px-5 py-3.5">
                        <div className="w-24 h-8">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
                              <defs>
                                <linearGradient id={`mktGrad-${asset.id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={isPos ? '#00ff88' : '#ff4466'} stopOpacity={0.3} />
                                  <stop offset="95%" stopColor={isPos ? '#00ff88' : '#ff4466'} stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <Area
                                type="monotone"
                                dataKey="v"
                                stroke={isPos ? '#00ff88' : '#ff4466'}
                                strokeWidth={1.5}
                                fill={`url(#mktGrad-${asset.id})`}
                                dot={false}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-white/50 text-xs">{asset.marketCap}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
