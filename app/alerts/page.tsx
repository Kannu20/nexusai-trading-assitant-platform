'use client';

// ============================================================
// app/alerts/page.tsx — Alerts management with toggles
// ============================================================

import { useState } from 'react';
import { Bell, BellOff, ShieldAlert, TrendingUp, Newspaper, Check, Trash2, Plus } from 'lucide-react';
import { useAlertStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { Alert } from '@/lib/mockData';

const TYPE_CONFIG = {
  price: { icon: TrendingUp, color: '#00d4ff', bg: 'bg-accent-cyan/10', border: 'border-accent-cyan/20', label: 'Price Alert' },
  risk:  { icon: ShieldAlert, color: '#ff4466', bg: 'bg-accent-red/10', border: 'border-accent-red/20', label: 'Risk Alert' },
  news:  { icon: Newspaper,   color: '#ffaa00', bg: 'bg-accent-amber/10', border: 'border-accent-amber/20', label: 'News Alert' },
};

const SEVERITY_COLORS = {
  low:    'bg-accent-green/10 text-accent-green border-accent-green/20',
  medium: 'bg-accent-amber/10 text-accent-amber border-accent-amber/20',
  high:   'bg-accent-red/10 text-accent-red border-accent-red/20',
};

// New alert form initial state
const EMPTY_FORM = { asset: '', message: '', type: 'price' as Alert['type'], severity: 'medium' as Alert['severity'] };

export default function AlertsPage() {
  const { alerts, priceAlertsEnabled, riskAlertsEnabled, togglePriceAlerts, toggleRiskAlerts, markRead, addAlert } = useAlertStore();
  const [filter, setFilter] = useState<'all' | 'unread' | 'price' | 'risk' | 'news'>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const filtered = alerts.filter((a) => {
    if (filter === 'unread') return !a.read;
    if (filter === 'price') return a.type === 'price';
    if (filter === 'risk') return a.type === 'risk';
    if (filter === 'news') return a.type === 'news';
    return true;
  });

  const unreadCount = alerts.filter((a) => !a.read).length;

  const handleAddAlert = () => {
    if (!form.asset.trim() || !form.message.trim()) return;
    addAlert({
      id: `a${Date.now()}`,
      type: form.type,
      asset: form.asset,
      message: form.message,
      time: 'Just now',
      read: false,
      severity: form.severity,
    });
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  return (
    <div className="space-y-5 animate-slide-up">
      {/* ── Toggle controls ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Price Alerts Toggle */}
        <div className={cn(
          'flex items-center justify-between p-4 rounded-2xl border transition-all',
          priceAlertsEnabled ? 'bg-accent-cyan/8 border-accent-cyan/25' : 'bg-surface-2 border-border'
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center transition-colors',
              priceAlertsEnabled ? 'bg-accent-cyan/15' : 'bg-surface-3'
            )}>
              <TrendingUp className={cn('w-4 h-4', priceAlertsEnabled ? 'text-accent-cyan' : 'text-white/30')} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Price Alerts</p>
              <p className="text-[11px] text-white/40">Notify on price targets</p>
            </div>
          </div>
          <button
            onClick={togglePriceAlerts}
            className={cn(
              'w-12 h-6 rounded-full relative transition-colors duration-300',
              priceAlertsEnabled ? 'bg-accent-cyan' : 'bg-surface-3 border border-border'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300',
                priceAlertsEnabled ? 'translate-x-6' : 'translate-x-0.5'
              )}
            />
          </button>
        </div>

        {/* Risk Alerts Toggle */}
        <div className={cn(
          'flex items-center justify-between p-4 rounded-2xl border transition-all',
          riskAlertsEnabled ? 'bg-accent-red/8 border-accent-red/25' : 'bg-surface-2 border-border'
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center transition-colors',
              riskAlertsEnabled ? 'bg-accent-red/15' : 'bg-surface-3'
            )}>
              <ShieldAlert className={cn('w-4 h-4', riskAlertsEnabled ? 'text-accent-red' : 'text-white/30')} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Risk Alerts</p>
              <p className="text-[11px] text-white/40">Portfolio risk warnings</p>
            </div>
          </div>
          <button
            onClick={toggleRiskAlerts}
            className={cn(
              'w-12 h-6 rounded-full relative transition-colors duration-300',
              riskAlertsEnabled ? 'bg-accent-red' : 'bg-surface-3 border border-border'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300',
                riskAlertsEnabled ? 'translate-x-6' : 'translate-x-0.5'
              )}
            />
          </button>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-2 border border-border text-xs">
          <Bell className="w-3.5 h-3.5 text-accent-cyan" />
          <span className="text-white/60">{alerts.length} total</span>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-accent-red/10 border border-accent-red/20 text-xs">
            <span className="w-2 h-2 rounded-full bg-accent-red animate-pulse" />
            <span className="text-accent-red font-mono">{unreadCount} unread</span>
          </div>
        )}
        <button
          onClick={() => setShowForm((p) => !p)}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-cyan/12 border border-accent-cyan/25 text-accent-cyan text-xs font-medium hover:bg-accent-cyan/20 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          New Alert
        </button>
      </div>

      {/* ── New alert form ── */}
      {showForm && (
        <div className="bg-surface-2 border border-accent-cyan/25 rounded-2xl p-5 shadow-card animate-slide-up">
          <h3 className="text-sm font-semibold text-white mb-4">Create Alert</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[11px] text-white/40 font-mono uppercase block mb-2">Asset Name</label>
              <input
                type="text"
                placeholder="e.g. Gold, NVDA"
                value={form.asset}
                onChange={(e) => setForm((f) => ({ ...f, asset: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-border text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-accent-cyan/50"
              />
            </div>
            <div>
              <label className="text-[11px] text-white/40 font-mono uppercase block mb-2">Alert Message</label>
              <input
                type="text"
                placeholder="e.g. Price target reached"
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-border text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-accent-cyan/50"
              />
            </div>
            <div>
              <label className="text-[11px] text-white/40 font-mono uppercase block mb-2">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as Alert['type'] }))}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-border text-sm text-white focus:outline-none"
              >
                <option value="price">Price Alert</option>
                <option value="risk">Risk Alert</option>
                <option value="news">News Alert</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-white/40 font-mono uppercase block mb-2">Severity</label>
              <select
                value={form.severity}
                onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as Alert['severity'] }))}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-border text-sm text-white focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddAlert}
              className="px-5 py-2.5 rounded-xl bg-accent-cyan text-surface font-semibold text-sm hover:bg-accent-cyan/90 transition-colors"
            >
              Create Alert
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
              className="px-5 py-2.5 rounded-xl bg-surface-3 border border-border text-white/50 text-sm hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Filter tabs ── */}
      <div className="flex gap-1 bg-surface-2 border border-border rounded-xl p-1 w-fit">
        {(['all','unread','price','risk','news'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all',
              filter === f
                ? 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/25'
                : 'text-white/40 hover:text-white/70'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Alert list ── */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="py-16 text-center bg-surface-2 border border-border rounded-2xl">
            <BellOff className="w-8 h-8 text-white/15 mx-auto mb-3" />
            <p className="text-white/30 text-sm">No alerts in this category.</p>
          </div>
        ) : (
          filtered.map((alert) => {
            const cfg = TYPE_CONFIG[alert.type];
            const Icon = cfg.icon;
            return (
              <div
                key={alert.id}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-2xl border transition-all',
                  alert.read
                    ? 'bg-surface-2 border-border opacity-60'
                    : 'bg-surface-2 border-border-bright shadow-card'
                )}
              >
                {/* Unread dot */}
                {!alert.read && (
                  <span className="w-2 h-2 rounded-full bg-accent-cyan flex-shrink-0 mt-1.5 animate-pulse" />
                )}

                {/* Icon */}
                <div
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border',
                    cfg.bg, cfg.border,
                    alert.read && 'ml-0'
                  )}
                  style={alert.read ? { marginLeft: alert.read ? '0.625rem' : 0 } : {}}
                >
                  <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs font-semibold text-white">{alert.asset}</span>
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-mono border', SEVERITY_COLORS[alert.severity])}>
                      {alert.severity}
                    </span>
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-mono', cfg.bg, `text-[${cfg.color}]`)}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">{alert.message}</p>
                  <p className="text-[10px] text-white/25 font-mono mt-1.5">{alert.time}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!alert.read && (
                    <button
                      onClick={() => markRead(alert.id)}
                      className="p-1.5 rounded-lg text-white/25 hover:text-accent-green hover:bg-accent-green/10 transition-all"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
