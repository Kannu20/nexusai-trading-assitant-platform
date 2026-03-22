'use client';

// ============================================================
// components/AssetCard.tsx — Individual asset card with mini chart
// ============================================================

import { TrendingUp, TrendingDown } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';
import { cn, formatCurrency, formatPercent } from '@/lib/utils';
import type { Asset } from '@/lib/mockData';

// Icon map for asset categories
const ASSET_ICONS: Record<string, string> = {
  gold: '🥇',
  silver: '🥈',
  'crude-oil': '🛢️',
  copper: '🔶',
  aapl: '🍎',
  msft: '💻',
  nvda: '⚡',
  tsla: '⚡',
};

interface AssetCardProps {
  asset: Asset;
  className?: string;
}

export default function AssetCard({ asset, className }: AssetCardProps) {
  const isPositive = asset.change >= 0;

  // Build sparkline data for Recharts
  const chartData = asset.sparkline.map((v, i) => ({ i, v }));

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-5',
        'bg-surface-2 border border-border',
        'hover:border-border-bright hover:bg-surface-3',
        'transition-all duration-200 cursor-pointer group',
        'shadow-card',
        className
      )}
    >
      {/* ── Background glow ── */}
      <div
        className={cn(
          'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300',
          isPositive ? 'bg-glow-green' : 'bg-glow-cyan'
        )}
      />

      {/* ── Header ── */}
      <div className="relative flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center text-lg',
            'bg-surface-3 border border-border-bright flex-shrink-0'
          )}>
            {ASSET_ICONS[asset.id] ?? '📈'}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{asset.name}</p>
            <p className="text-[11px] text-white/40 font-mono">{asset.symbol}</p>
          </div>
        </div>

        {/* Change badge */}
        <div
          className={cn(
            'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
            isPositive
              ? 'bg-accent-green/15 text-accent-green'
              : 'bg-accent-red/15 text-accent-red'
          )}
        >
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {formatPercent(asset.change)}
        </div>
      </div>

      {/* ── Price ── */}
      <div className="relative mb-4">
        <p className="text-2xl font-bold text-white font-display">
          {formatCurrency(asset.price)}
        </p>
        <p className={cn(
          'text-xs mt-0.5 font-mono',
          isPositive ? 'text-accent-green' : 'text-accent-red'
        )}>
          {isPositive ? '+' : ''}{formatCurrency(asset.changeAbs)} today
        </p>
      </div>

      {/* ── Mini sparkline chart ── */}
      <div className="relative h-16 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
            <defs>
              <linearGradient id={`grad-${asset.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={isPositive ? '#00ff88' : '#ff4466'}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={isPositive ? '#00ff88' : '#ff4466'}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <Tooltip
              content={() => null}
              cursor={false}
            />
            <Area
              type="monotone"
              dataKey="v"
              stroke={isPositive ? '#00ff88' : '#ff4466'}
              strokeWidth={1.5}
              fill={`url(#grad-${asset.id})`}
              dot={false}
              activeDot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Footer stats ── */}
      <div className="relative flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div>
          <p className="text-[10px] text-white/30 font-mono uppercase">24h High</p>
          <p className="text-xs text-white/70 font-mono">${asset.high24h.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/30 font-mono uppercase">24h Low</p>
          <p className="text-xs text-white/70 font-mono">${asset.low24h.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-white/30 font-mono uppercase">Volume</p>
          <p className="text-xs text-white/70 font-mono">{asset.volume}</p>
        </div>
      </div>
    </div>
  );
}
