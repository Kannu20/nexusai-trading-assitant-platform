'use client';

// ============================================================
// app/portfolio/page.tsx — Portfolio manager with add/remove
// ============================================================

import { useState } from 'react';
import { Plus, Trash2, Target, Shield, PieChart } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Tooltip,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { usePortfolioStore } from '@/lib/store';
import { ASSETS } from '@/lib/mockData';
import {
  formatCurrency,
  formatPercent,
  diversificationScore,
  riskLabel,
  riskColor,
  cn,
} from '@/lib/utils';

const PIE_COLORS = ['#ffaa00', '#00d4ff', '#9966ff', '#00ff88', '#ff4466', '#00ccff'];

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-3 border border-border rounded-xl px-3 py-2 text-xs shadow-card">
      <p className="text-white font-semibold">{payload[0].name}</p>
      <p className="text-white/60 font-mono">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

export default function PortfolioPage() {
  const { items, addItem, removeItem } = usePortfolioStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ assetId: ASSETS[0].id, amount: '' });
  const [error, setError] = useState('');

  // ── Computed stats ─────────────────────────────────────────
  const totalValue = items.reduce((s, i) => s + i.currentValue, 0);
  const totalInvested = items.reduce((s, i) => s + i.amount, 0);
  const weights = items.map((i) => (i.currentValue / totalValue) * 100);
  const divScore = diversificationScore(weights);
  const risk = riskLabel(100 - divScore);

  // Radar chart data
  const radarData = [
    { metric: 'Diversification', value: divScore },
    { metric: 'Liquidity', value: 72 },
    { metric: 'Stability', value: risk === 'Low' ? 80 : risk === 'Medium' ? 55 : 30 },
    { metric: 'Growth', value: 65 },
    { metric: 'Safety', value: divScore * 0.9 },
  ];

  // ── Add asset handler ─────────────────────────────────────
  const handleAdd = () => {
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) {
      setError('Please enter a valid investment amount.');
      return;
    }
    const asset = ASSETS.find((a) => a.id === form.assetId);
    if (!asset) return;

    const units = amt / asset.price;
    const currentValue = units * asset.price;
    const newItem = {
      id: `p${Date.now()}`,
      assetId: asset.id,
      name: asset.name,
      symbol: asset.symbol,
      amount: amt,
      units,
      currentValue,
      gainLoss: 0,
      gainLossPct: 0,
      color: PIE_COLORS[items.length % PIE_COLORS.length],
    };
    addItem(newItem);
    setForm({ assetId: ASSETS[0].id, amount: '' });
    setError('');
    setShowForm(false);
  };

  return (
    <div className="space-y-5 animate-slide-up">
      {/* ── Header row ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-white/40 font-mono">
            {items.length} positions · Total value{' '}
            <span className="text-accent-cyan">{formatCurrency(totalValue)}</span>
          </p>
        </div>
        <button
          onClick={() => setShowForm((p) => !p)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-cyan/15 border border-accent-cyan/25 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Asset
        </button>
      </div>

      {/* ── Add form ── */}
      {showForm && (
        <div className="bg-surface-2 border border-accent-cyan/25 rounded-2xl p-5 shadow-card animate-slide-up">
          <h3 className="text-sm font-semibold text-white mb-4">Add New Position</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] text-white/40 font-mono uppercase block mb-2">
                Asset
              </label>
              <select
                value={form.assetId}
                onChange={(e) => setForm((f) => ({ ...f, assetId: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-border text-sm text-white focus:outline-none focus:border-accent-cyan/50"
              >
                {ASSETS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.symbol})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-white/40 font-mono uppercase block mb-2">
                Investment (INR)
              </label>
              <input
                type="number"
                placeholder="e.g. 5000"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-border text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-accent-cyan/50"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleAdd}
                className="flex-1 px-4 py-2.5 rounded-xl bg-accent-cyan text-surface font-semibold text-sm hover:bg-accent-cyan/90 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => { setShowForm(false); setError(''); }}
                className="px-4 py-2.5 rounded-xl bg-surface-3 border border-border text-white/50 text-sm hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
          {error && <p className="text-accent-red text-xs mt-3">{error}</p>}
        </div>
      )}

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-2 border border-border rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center">
              <PieChart className="w-4 h-4 text-accent-cyan" />
            </div>
            <p className="text-[11px] text-white/40 font-mono uppercase">Allocation</p>
          </div>
          <p className="text-2xl font-bold text-white">{items.length} assets</p>
          <p className="text-xs text-white/40 mt-1">Across {new Set(items.map(i => {
            const a = ASSETS.find(a => a.id === i.assetId);
            return a?.category;
          })).size} categories</p>
        </div>

        <div className="bg-surface-2 border border-border rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-accent-green/10 border border-accent-green/20 flex items-center justify-center">
              <Target className="w-4 h-4 text-accent-green" />
            </div>
            <p className="text-[11px] text-white/40 font-mono uppercase">Diversification</p>
          </div>
          <p className="text-2xl font-bold text-white">{divScore}<span className="text-base text-white/40">/100</span></p>
          {/* Score bar */}
          <div className="mt-2 h-1.5 rounded-full bg-surface-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-accent-green transition-all duration-700"
              style={{ width: `${divScore}%` }}
            />
          </div>
        </div>

        <div className="bg-surface-2 border border-border rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-accent-amber/10 border border-accent-amber/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-accent-amber" />
            </div>
            <p className="text-[11px] text-white/40 font-mono uppercase">Risk Level</p>
          </div>
          <p className={`text-2xl font-bold ${riskColor(risk)}`}>{risk}</p>
          <p className="text-xs text-white/40 mt-1">
            {risk === 'Low' ? 'Well diversified portfolio' : risk === 'Medium' ? 'Moderate concentration' : 'High concentration risk'}
          </p>
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie chart */}
        <div className="bg-surface-2 border border-border rounded-2xl p-5 shadow-card">
          <h3 className="text-sm font-semibold text-white mb-4">Allocation Breakdown</h3>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-44 h-44 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={items.map((i) => ({ name: i.name, value: i.currentValue }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={72}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="#0f0f17"
                  >
                    {items.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2 w-full">
              {items.map((item, i) => {
                const pct = totalValue ? ((item.currentValue / totalValue) * 100).toFixed(1) : '0.0';
                return (
                  <div key={item.id} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-xs text-white/70 flex-1 truncate">{item.name}</span>
                    <div className="flex-1 h-1 rounded-full bg-surface-3 overflow-hidden mx-2">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    </div>
                    <span className="text-xs text-white/50 font-mono w-10 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Radar chart */}
        <div className="bg-surface-2 border border-border rounded-2xl p-5 shadow-card">
          <h3 className="text-sm font-semibold text-white mb-4">Portfolio Health Radar</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.07)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  dataKey="value"
                  stroke="#00d4ff"
                  fill="#00d4ff"
                  fillOpacity={0.15}
                  strokeWidth={1.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Holdings list ── */}
      <div className="bg-surface-2 border border-border rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Positions</h3>
          <span className="text-[11px] text-white/40 font-mono">{items.length} open</span>
        </div>
        {items.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-white/30 text-sm">No positions yet. Add your first asset above.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {items.map((item, i) => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-colors">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{item.name}</p>
                  <p className="text-[11px] text-white/40 font-mono">{item.units.toFixed(4)} units · {item.symbol}</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-white/40 font-mono">Invested</p>
                  <p className="text-sm font-mono text-white/70">{formatCurrency(item.amount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/40 font-mono">Value</p>
                  <p className="text-sm font-mono font-semibold text-white">{formatCurrency(item.currentValue)}</p>
                </div>
                <div className="text-right hidden md:block">
                  <p className="text-xs text-white/40 font-mono">P&L</p>
                  <p className={`text-sm font-mono ${item.gainLoss >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                    {formatPercent(item.gainLossPct)}
                  </p>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-2 rounded-lg text-white/20 hover:text-accent-red hover:bg-accent-red/10 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
