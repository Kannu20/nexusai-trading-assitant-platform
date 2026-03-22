'use client';

// ============================================================
// app/simulator/page.tsx — Scenario stress-test simulator
// ============================================================

import { useState, useMemo } from 'react';
import { FlaskConical, TrendingDown, TrendingUp, AlertTriangle, RotateCcw } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { generateSimulatorData } from '@/lib/mockData';
import { formatCurrency, cn } from '@/lib/utils';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-3 border border-border rounded-xl px-3 py-2.5 text-xs shadow-card space-y-1.5">
      <p className="text-white/50 font-mono mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/60">{p.name}:</span>
          <span className="text-white font-mono font-semibold">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// Preset scenarios
const PRESETS = [
  { label: 'Bull Market', rate: 0, crash: 0, desc: 'Ideal conditions' },
  { label: 'Rate Hike', rate: 3, crash: 0, desc: '+3% interest rate' },
  { label: 'Mild Crash', rate: 1, crash: 15, desc: '−15% market shock' },
  { label: 'Severe Crash', rate: 4, crash: 40, desc: '−40% severe crash' },
];

export default function SimulatorPage() {
  const [interestRate, setInterestRate] = useState(0);
  const [crashPct, setCrashPct] = useState(0);

  const result = useMemo(
    () => generateSimulatorData(interestRate, crashPct),
    [interestRate, crashPct]
  );

  const isLoss = result.change < 0;

  const applyPreset = (rate: number, crash: number) => {
    setInterestRate(rate);
    setCrashPct(crash);
  };

  const reset = () => {
    setInterestRate(0);
    setCrashPct(0);
  };

  return (
    <div className="space-y-5 animate-slide-up">
      {/* ── Preset scenarios ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p.rate, p.crash)}
            className={cn(
              'rounded-xl px-4 py-3 text-left border transition-all',
              interestRate === p.rate && crashPct === p.crash
                ? 'bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan'
                : 'bg-surface-2 border-border text-white/60 hover:border-border-bright hover:text-white/80'
            )}
          >
            <p className="text-sm font-semibold">{p.label}</p>
            <p className="text-[11px] font-mono mt-0.5 opacity-60">{p.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Controls panel ── */}
        <div className="space-y-5">
          <div className="bg-surface-2 border border-border rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-accent-cyan" />
                <h3 className="text-sm font-semibold text-white">Scenario Parameters</h3>
              </div>
              <button onClick={reset} className="text-white/30 hover:text-white transition-colors">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Interest Rate Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-white/50">Interest Rate Hike</label>
                <span className="text-sm font-mono font-bold text-accent-amber">
                  +{interestRate.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={8}
                step={0.5}
                value={interestRate}
                onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-white/25 font-mono">
                <span>0%</span>
                <span>4%</span>
                <span>8%</span>
              </div>
            </div>

            <div className="h-px bg-border my-5" />

            {/* Market Crash Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-white/50">Market Crash Scenario</label>
                <span className="text-sm font-mono font-bold text-accent-red">
                  -{crashPct.toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={60}
                step={5}
                value={crashPct}
                onChange={(e) => setCrashPct(parseFloat(e.target.value))}
                className="w-full"
                style={{ '--tw-gradient-from': '#ff4466' } as any}
              />
              <div className="flex justify-between text-[10px] text-white/25 font-mono">
                <span>0%</span>
                <span>−30%</span>
                <span>−60%</span>
              </div>
            </div>

            {/* Risk warning */}
            {crashPct >= 30 && (
              <div className="mt-4 p-3 rounded-xl bg-accent-red/10 border border-accent-red/20 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-accent-red flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-accent-red/80 leading-relaxed">
                  Severe crash scenario. Real-world portfolios should maintain 10-20% in hedging assets.
                </p>
              </div>
            )}
          </div>

          {/* ── Result cards ── */}
          <div className="bg-surface-2 border border-border rounded-2xl p-5 shadow-card space-y-4">
            <h3 className="text-sm font-semibold text-white">Projected Impact</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2.5 border-b border-border">
                <span className="text-xs text-white/40">Base Portfolio Value</span>
                <span className="text-sm font-mono text-white">{formatCurrency(result.baseValue)}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 border-b border-border">
                <span className="text-xs text-white/40">Projected Value</span>
                <span className={`text-sm font-mono font-bold ${isLoss ? 'text-accent-red' : 'text-accent-green'}`}>
                  {formatCurrency(result.newValue)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5 border-b border-border">
                <span className="text-xs text-white/40">Total Change</span>
                <div className={`flex items-center gap-1.5 text-sm font-mono font-bold ${isLoss ? 'text-accent-red' : 'text-accent-green'}`}>
                  {isLoss ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  {isLoss ? '' : '+'}{formatCurrency(result.change)}
                </div>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-xs text-white/40">Change %</span>
                <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                  isLoss ? 'bg-accent-red/12 text-accent-red' : 'bg-accent-green/12 text-accent-green'
                }`}>
                  {parseFloat(result.changePct) >= 0 ? '+' : ''}{result.changePct}%
                </span>
              </div>
            </div>

            {/* Portfolio value meter */}
            <div>
              <div className="flex justify-between text-[10px] text-white/30 font-mono mb-1.5">
                <span>₹0</span>
                <span>{formatCurrency(result.baseValue)}</span>
              </div>
              <div className="h-2 rounded-full bg-surface-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${isLoss ? 'bg-accent-red' : 'bg-accent-green'}`}
                  style={{ width: `${Math.max(5, (result.newValue / result.baseValue) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-white/25 font-mono text-right mt-1">
                {((result.newValue / result.baseValue) * 100).toFixed(1)}% of base value
              </p>
            </div>
          </div>
        </div>

        {/* ── Chart ── */}
        <div className="lg:col-span-2 bg-surface-2 border border-border rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-white">12-Month Simulation</h3>
              <p className="text-xs text-white/40 mt-0.5">Baseline vs simulated scenario</p>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-accent-cyan rounded" />
                <span className="text-white/40">Baseline</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-accent-red rounded" style={{ background: isLoss ? '#ff4466' : '#00ff88' }} />
                <span className="text-white/40">Simulated</span>
              </div>
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={result.chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="simGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isLoss ? '#ff4466' : '#00ff88'} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={isLoss ? '#ff4466' : '#00ff88'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  width={46}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="baseline"
                  name="Baseline"
                  stroke="#00d4ff"
                  strokeWidth={2}
                  fill="url(#baseGrad)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="simulated"
                  name="Simulated"
                  stroke={isLoss ? '#ff4466' : '#00ff88'}
                  strokeWidth={2}
                  fill="url(#simGrad)"
                  strokeDasharray={isLoss ? '6 3' : undefined}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom info strip */}
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[11px] text-white/30 font-mono uppercase">Interest Impact</p>
              <p className="text-sm font-mono text-accent-amber mt-1">-₹{(interestRate * 800).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[11px] text-white/30 font-mono uppercase">Crash Impact</p>
              <p className="text-sm font-mono text-accent-red mt-1">-₹{Math.round((crashPct / 100) * result.baseValue).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[11px] text-white/30 font-mono uppercase">Net Drawdown</p>
              <p className={`text-sm font-mono mt-1 ₹{isLoss ? 'text-accent-red' : 'text-accent-green'}`}>
                {result.changePct}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
