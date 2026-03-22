'use client';

// ============================================================
// app/dashboard/page.tsx — Main dashboard with portfolio overview
// ============================================================

import { IndianRupee, TrendingUp, TrendingDown, Activity, Wallet } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import AssetCard from '@/components/AssetCard';
import StatCard from '@/components/StatCard';
import { DASHBOARD_ASSETS, PORTFOLIO_HISTORY } from '@/lib/mockData';
import { usePortfolioStore } from '@/lib/store';
import { formatCurrency, formatPercent } from '@/lib/utils';

// Pie chart colors per portfolio item
const PIE_COLORS = ['#ffaa00', '#00d4ff', '#9966ff', '#00ff88'];

// Custom pie tooltip
const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-3 border border-border rounded-xl px-3 py-2 text-xs shadow-card">
      <p className="text-white font-semibold">{payload[0].name}</p>
      <p className="text-white/60 font-mono">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

// Custom area tooltip
const AreaTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-3 border border-border rounded-xl px-3 py-2 text-xs shadow-card">
      <p className="text-white/50 font-mono">{label}</p>
      <p className="text-accent-cyan font-semibold font-mono">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

export default function DashboardPage() {
  const { items } = usePortfolioStore();

  // Compute portfolio totals
  const totalValue = items.reduce((s, i) => s + i.currentValue, 0);
  const totalInvested = items.reduce((s, i) => s + i.amount, 0);
  const totalGainLoss = totalValue - totalInvested;
  const totalGainLossPct = (totalGainLoss / totalInvested) * 100;

  // Pie chart data
  const pieData = items.map((i) => ({ name: i.name, value: i.currentValue }));

  return (
    <div className="space-y-6 animate-slide-up">
      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Portfolio Value"
          value={formatCurrency(totalValue)}
          sub="Total assets"
          icon={Wallet}
          accentColor="#00d4ff"
        />
        <StatCard
          label="Total Invested"
          value={formatCurrency(totalInvested)}
          sub={`${items.length} positions`}
          icon={IndianRupee}
          accentColor="#9966ff"
        />
        <StatCard
          label="Total Gain/Loss"
          value={formatCurrency(totalGainLoss)}
          sub={formatPercent(totalGainLossPct)}
          icon={totalGainLoss >= 0 ? TrendingUp : TrendingDown}
          trend={totalGainLoss >= 0 ? 'up' : 'down'}
          accentColor={totalGainLoss >= 0 ? '#00ff88' : '#ff4466'}
        />
        <StatCard
          label="Day Change"
          value="+₹312.40"
          sub="+0.69% today"
          icon={Activity}
          trend="up"
          accentColor="#ffaa00"
        />
      </div>

      {/* ── Asset cards ── */}
      <div>
        <h2 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent-cyan" />
          Tracked Assets
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-4">
          {DASHBOARD_ASSETS.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Portfolio history chart */}
        <div className="lg:col-span-2 bg-surface-2 border border-border rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-white">Portfolio Performance</h3>
              <p className="text-xs text-white/40 mt-0.5">Last 30 days</p>
            </div>
            <div className="flex gap-2">
              {['1W','1M','3M','1Y'].map((t) => (
                <button
                  key={t}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
                    t === '1M'
                      ? 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/25'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PORTFOLIO_HISTORY} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="day"
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  width={42}
                />
                <Tooltip content={<AreaTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#00d4ff"
                  strokeWidth={2}
                  fill="url(#portfolioGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie chart */}
        <div className="bg-surface-2 border border-border rounded-2xl p-5 shadow-card">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white">Allocation</h3>
            <p className="text-xs text-white/40 mt-0.5">Portfolio breakdown</p>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#0f0f17"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="space-y-2 mt-2">
            {items.map((item, i) => {
              const pct = ((item.currentValue / totalValue) * 100).toFixed(1);
              return (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-white/70">{item.name}</span>
                  </div>
                  <span className="text-white/50 font-mono">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Holdings table ── */}
      <div className="bg-surface-2 border border-border rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-white">Holdings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Asset','Invested','Current Value','Gain/Loss','P&L %'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-mono text-white/40 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr
                  key={item.id}
                  className="border-b border-border/50 hover:bg-white/3 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <div>
                        <p className="font-medium text-white text-[13px]">{item.name}</p>
                        <p className="text-[11px] text-white/40 font-mono">{item.symbol}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-white/70 text-xs">{formatCurrency(item.amount)}</td>
                  <td className="px-5 py-3.5 font-mono text-white text-xs">{formatCurrency(item.currentValue)}</td>
                  <td className={`px-5 py-3.5 font-mono text-xs ${item.gainLoss >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                    {item.gainLoss >= 0 ? '+' : ''}{formatCurrency(item.gainLoss)}
                  </td>
                  <td className={`px-5 py-3.5 text-xs ${item.gainLossPct >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                      item.gainLossPct >= 0 ? 'bg-accent-green/10' : 'bg-accent-red/10'
                    }`}>
                      {formatPercent(item.gainLossPct)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
