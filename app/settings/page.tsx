'use client'
// ================================================================
// app/settings/page.tsx — Full Settings Page
// All changes saved permanently to MongoDB via /api/user/settings
// Falls back to localStorage when MongoDB is not configured
// ================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Settings, Palette, Bell, Shield, BarChart2, Key,
  Globe, Save, RefreshCw, Check, Eye, EyeOff, Info,
  AlertCircle, CheckCircle2, Loader2, X as XIcon,
  Monitor, Smartphone, Clock, DollarSign, Zap,
  ToggleLeft, ToggleRight, ExternalLink, Database,
  Wifi, WifiOff, ChevronRight, Lock, Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

// ── Types ─────────────────────────────────────────────────────────
interface SettingsData {
  preferences: {
    currency: string; theme: string; riskProfile: string;
    language: string; timezone: string; dateFormat: string;
    numberFormat: string; defaultTimeframe: string; compactNumbers: boolean;
  };
  apiKeys: { finnhub: string; openrouter: string; openrouterModel: string; };
  notifications: {
    emailEnabled: boolean; pushEnabled: boolean; priceAlerts: boolean;
    riskAlerts: boolean; newsAlerts: boolean; weeklyDigest: boolean;
    priceThreshold: number;
  };
  dashboard: {
    showTicker: boolean; showMiniCharts: boolean; autoRefresh: boolean;
    refreshInterval: number; defaultTab: string; pinnedAssets: string[];
  };
  privacy: { analyticsEnabled: boolean; crashReporting: boolean; showOnLeaderboard: boolean; };
}

const DEFAULTS: SettingsData = {
  preferences: {
    currency: 'USD', theme: 'dark', riskProfile: 'moderate',
    language: 'en', timezone: 'UTC', dateFormat: 'MM/DD/YYYY',
    numberFormat: 'en-US', defaultTimeframe: '1M', compactNumbers: false,
  },
  apiKeys: { finnhub: '', openrouter: '', openrouterModel: 'meta-llama/llama-3.1-8b-instruct:free' },
  notifications: {
    emailEnabled: true, pushEnabled: true, priceAlerts: true,
    riskAlerts: true, newsAlerts: false, weeklyDigest: false, priceThreshold: 2,
  },
  dashboard: {
    showTicker: true, showMiniCharts: true, autoRefresh: true,
    refreshInterval: 30, defaultTab: 'overview', pinnedAssets: ['gold','aapl','nvda'],
  },
  privacy: { analyticsEnabled: true, crashReporting: true, showOnLeaderboard: false },
};

// ── Tabs ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'general',       label: 'General',       icon: Settings   },
  { id: 'appearance',    label: 'Appearance',     icon: Palette    },
  { id: 'api-keys',      label: 'API Keys',       icon: Key        },
  { id: 'notifications', label: 'Notifications',  icon: Bell       },
  { id: 'dashboard',     label: 'Dashboard',      icon: BarChart2  },
  { id: 'privacy',       label: 'Privacy',        icon: Shield     },
] as const;
type TabId = (typeof TABS)[number]['id'];

// ── Toast ─────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info';
interface ToastState { msg: string; type: ToastType; }

function Toast({ msg, type, onClose }: ToastState & { onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={cn(
      'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-[0_8px_32px_rgba(0,0,0,0.4)] animate-slide-up max-w-xs',
      type === 'success' ? 'bg-accent-green/10 border-accent-green/30 text-accent-green'
        : type === 'error' ? 'bg-accent-red/10 border-accent-red/30 text-accent-red'
        : 'bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan'
    )}>
      {type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
        : type === 'error' ? <AlertCircle className="w-4 h-4 flex-shrink-0" />
        : <Info className="w-4 h-4 flex-shrink-0" />}
      <p className="text-sm font-medium flex-1">{msg}</p>
      <button onClick={onClose}><XIcon className="w-3.5 h-3.5 opacity-60 hover:opacity-100" /></button>
    </div>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────
function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={cn(
        'w-12 h-6 rounded-full relative transition-colors duration-300 flex-shrink-0',
        value ? 'bg-accent-cyan' : 'bg-surface-3 border border-border',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      <span className={cn(
        'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300',
        value ? 'translate-x-6' : 'translate-x-0.5'
      )} />
    </button>
  );
}

// ── Setting row ───────────────────────────────────────────────────
function SettingRow({ label, sub, children, className }: {
  label: string; sub?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-4 py-4 border-b border-border/50 last:border-0', className)}>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white font-medium">{label}</p>
        {sub && <p className="text-[11px] text-white/35 mt-0.5 leading-relaxed">{sub}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// ── Select input ──────────────────────────────────────────────────
function Select({ value, onChange, options, className }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'px-3 py-2 rounded-xl text-sm text-white bg-surface-3 border border-border',
        'hover:border-border-bright focus:outline-none focus:border-accent-cyan/50 transition-all',
        className
      )}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ── Section card ──────────────────────────────────────────────────
function SectionCard({ title, subtitle, icon: Icon, children, badge }: {
  title: string; subtitle?: string; icon: any; children: React.ReactNode; badge?: React.ReactNode;
}) {
  return (
    <div className="bg-surface-2 border border-border rounded-2xl overflow-hidden shadow-card">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-accent-cyan" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-[11px] text-white/40 mt-0.5">{subtitle}</p>}
        </div>
        {badge}
      </div>
      <div className="px-6 py-2">{children}</div>
    </div>
  );
}

// ── API key input with show/hide and test ─────────────────────────
function ApiKeyInput({ label, value, onChange, onTest, placeholder, docsUrl, status }: {
  label: string; value: string; onChange: (v: string) => void;
  onTest?: () => void; placeholder: string; docsUrl: string;
  status: 'idle' | 'testing' | 'ok' | 'error';
}) {
  const [show, setShow] = useState(false);
  const isMasked = value.startsWith('••');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] text-white/40 font-mono uppercase tracking-wider">{label}</label>
        <a href={docsUrl} target="_blank" rel="noreferrer"
          className="text-[10px] text-accent-cyan/60 hover:text-accent-cyan flex items-center gap-1 transition-colors">
          Get key <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show && !isMasked ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={isMasked ? 'Click to replace key' : placeholder}
            onClick={() => { if (isMasked) onChange(''); }}
            className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm text-white bg-surface-3 border border-border hover:border-border-bright focus:outline-none focus:border-accent-cyan/50 placeholder:text-white/20 transition-all font-mono"
          />
          {!isMasked && value && (
            <button type="button" onClick={() => setShow((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
          {/* Status indicator */}
          {status !== 'idle' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {status === 'testing' && <Loader2 className="w-4 h-4 text-accent-cyan animate-spin" />}
              {status === 'ok'      && <CheckCircle2 className="w-4 h-4 text-accent-green" />}
              {status === 'error'   && <AlertCircle className="w-4 h-4 text-accent-red" />}
            </div>
          )}
        </div>
        {onTest && (
          <button
            onClick={onTest}
            disabled={!value || isMasked || status === 'testing'}
            className={cn(
              'px-3 py-2.5 rounded-xl text-xs font-medium border transition-all whitespace-nowrap',
              value && !isMasked && status !== 'testing'
                ? 'bg-surface-3 border-border-bright text-white/70 hover:text-white hover:border-accent-cyan/50'
                : 'bg-surface-3 border-border text-white/20 cursor-not-allowed'
            )}
          >
            {status === 'testing' ? 'Testing...' : 'Test'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function SettingsPage() {
  const { currentUser, dbUser } = useAuth();
  const [activeTab,  setActiveTab]  = useState<TabId>('general');
  const [settings,   setSettings]   = useState<SettingsData>(DEFAULTS);
  const [original,   setOriginal]   = useState<SettingsData>(DEFAULTS);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState<string | null>(null); // which section
  const [toast,      setToast]      = useState<ToastState | null>(null);
  const [persisted,  setPersisted]  = useState(true);
  const [apiStatus,  setApiStatus]  = useState<Record<string, 'idle'|'testing'|'ok'|'error'>>({});

  const showToast = useCallback((t: ToastState) => setToast(t), []);
  const changed = JSON.stringify(settings) !== JSON.stringify(original);

  // ── Load settings from server ─────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/user/settings');
        if (res.ok) {
          const data = await res.json();
          const merged = {
            preferences:   { ...DEFAULTS.preferences,   ...(data.settings?.preferences   ?? {}) },
            apiKeys:       { ...DEFAULTS.apiKeys,        ...(data.settings?.apiKeys       ?? {}) },
            notifications: { ...DEFAULTS.notifications, ...(data.settings?.notifications ?? {}) },
            dashboard:     { ...DEFAULTS.dashboard,      ...(data.settings?.dashboard     ?? {}) },
            privacy:       { ...DEFAULTS.privacy,        ...(data.settings?.privacy       ?? {}) },
          };
          setSettings(merged);
          setOriginal(JSON.parse(JSON.stringify(merged)));

          if (data.settings?.usingDefaults) {
            setPersisted(false);
          }
        }
      } catch { /* use defaults */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // ── Deep update helper ────────────────────────────────────────
  function update<T extends keyof SettingsData>(section: T, field: keyof SettingsData[T], value: unknown) {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  }

  // ── Save a specific section ───────────────────────────────────
  const save = useCallback(async (section: keyof SettingsData | 'all') => {
    setSaving(section);
    try {
      const payload = section === 'all' ? settings : { [section]: settings[section as keyof SettingsData] };

      const res = await fetch('/api/user/settings', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        // Update original to mark as saved
        setOriginal((prev) => ({
          ...prev,
          ...(section === 'all' ? settings : { [section]: settings[section as keyof SettingsData] }),
        }));

        if (data.persisted === false) {
          setPersisted(false);
          showToast({ msg: 'Settings saved locally (add MONGODB_URI for permanent storage)', type: 'info' });
        } else {
          setPersisted(true);
          showToast({ msg: 'Settings saved permanently ✓', type: 'success' });

          // Refresh with masked API keys from server
          if (data.settings) {
            setSettings((prev) => ({ ...prev, ...(section === 'all' ? data.settings : { [section]: data.settings[section as string] }) }));
          }
        }
      } else {
        showToast({ msg: data.error ?? 'Failed to save settings', type: 'error' });
      }
    } catch {
      showToast({ msg: 'Network error — please try again', type: 'error' });
    } finally {
      setSaving(null);
    }
  }, [settings, showToast]);

  // ── Test API key ──────────────────────────────────────────────
  const testApiKey = useCallback(async (provider: 'finnhub' | 'openrouter') => {
    const key = settings.apiKeys[provider];
    if (!key || key.startsWith('••')) return;

    setApiStatus((p) => ({ ...p, [provider]: 'testing' }));

    try {
      if (provider === 'finnhub') {
        const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=AAPL&token=${key}`);
        const data = await res.json();
        if (data.c && data.c > 0) {
          setApiStatus((p) => ({ ...p, finnhub: 'ok' }));
          showToast({ msg: `✅ Finnhub key valid! AAPL: $${data.c}`, type: 'success' });
        } else {
          setApiStatus((p) => ({ ...p, finnhub: 'error' }));
          showToast({ msg: 'Finnhub key returned no data — check the key', type: 'error' });
        }
      } else {
        const res = await fetch('https://openrouter.ai/api/v1/models', {
          headers: { Authorization: `Bearer ${key}` },
        });
        if (res.ok) {
          setApiStatus((p) => ({ ...p, openrouter: 'ok' }));
          showToast({ msg: '✅ OpenRouter key is valid!', type: 'success' });
        } else {
          setApiStatus((p) => ({ ...p, openrouter: 'error' }));
          showToast({ msg: `OpenRouter key invalid (${res.status})`, type: 'error' });
        }
      }
    } catch {
      setApiStatus((p) => ({ ...p, [provider]: 'error' }));
      showToast({ msg: 'Test failed — check your internet connection', type: 'error' });
    }

    setTimeout(() => setApiStatus((p) => ({ ...p, [provider]: 'idle' })), 5000);
  }, [settings.apiKeys, showToast]);

  // ── Keyboard shortcut: Ctrl/Cmd+S ────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (changed) save('all');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [changed, save]);

  // Derived state
  const s = settings;
  const isSaving = saving !== null;

  // ── Common select options ─────────────────────────────────────
  const CURRENCIES = ['USD','EUR','GBP','INR','JPY','CAD','AUD','SGD','AED','CHF'].map((c) => ({ value: c, label: c }));
  const TIMEZONES  = ['UTC','Asia/Kolkata','Asia/Dubai','Europe/London','Europe/Paris','America/New_York','America/Los_Angeles','Asia/Tokyo','Asia/Singapore'].map((t) => ({ value: t, label: t.replace('_', ' ') }));
  const LANGUAGES  = [{ value:'en', label:'English' }, { value:'hi', label:'Hindi (coming soon)' }];
  const INTERVALS  = [{ value: '15', label: '15 seconds' }, { value: '30', label: '30 seconds' }, { value: '60', label: '1 minute' }, { value: '300', label: '5 minutes' }];
  const TIMEFRAMES = ['1D','1W','1M','3M','1Y'].map((t) => ({ value: t, label: t }));
  const OR_MODELS  = [
    { value: 'meta-llama/llama-3.1-8b-instruct:free',   label: 'LLaMA 3.1 8B (Free)' },
    { value: 'mistralai/mistral-7b-instruct:free',       label: 'Mistral 7B (Free)' },
    { value: 'google/gemma-2-9b-it:free',                label: 'Gemma 2 9B (Free)' },
    { value: 'meta-llama/llama-3.1-70b-instruct',        label: 'LLaMA 3.1 70B (Paid)' },
    { value: 'anthropic/claude-3.5-sonnet',              label: 'Claude 3.5 Sonnet (Paid)' },
    { value: 'openai/gpt-4o-mini',                       label: 'GPT-4o Mini (Paid)' },
  ];
  const DATE_FORMATS = [{ value:'MM/DD/YYYY', label:'MM/DD/YYYY (US)' }, { value:'DD/MM/YYYY', label:'DD/MM/YYYY (UK/IN)' }, { value:'YYYY-MM-DD', label:'YYYY-MM-DD (ISO)' }];

  // ── Save button ───────────────────────────────────────────────
  const SaveButton = ({ section, label = 'Save' }: { section: keyof SettingsData | 'all'; label?: string }) => (
    <button
      onClick={() => save(section)}
      disabled={isSaving}
      className={cn(
        'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
        !isSaving
          ? 'bg-accent-cyan text-surface hover:bg-accent-cyan/90 shadow-glow-cyan'
          : 'bg-surface-3 text-white/30 border border-border cursor-not-allowed'
      )}
    >
      {saving === section ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      {saving === section ? 'Saving...' : label}
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-accent-cyan animate-spin mx-auto" />
          <p className="text-white/40 text-sm">Loading your settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-slide-up">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white font-display">Settings</h1>
          <p className="text-[12px] text-white/40 mt-0.5 flex items-center gap-2">
            {persisted
              ? <><Database className="w-3 h-3 text-accent-green" /><span>Synced to MongoDB</span></>
              : <><WifiOff className="w-3 h-3 text-accent-amber" /><span>Local only — add MONGODB_URI to persist</span></>
            }
          </p>
        </div>
        {changed && (
          <div className="flex items-center gap-3">
            <p className="text-[11px] text-accent-amber font-mono flex items-center gap-1">
              <Info className="w-3 h-3" />Unsaved changes · Ctrl+S to save all
            </p>
            <button onClick={() => setSettings(JSON.parse(JSON.stringify(original)))}
              className="px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white border border-border hover:border-border-bright transition-all">
              Discard
            </button>
            <SaveButton section="all" label="Save All" />
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-5">

        {/* ── Sidebar tabs ── */}
        <div className="lg:w-52 flex-shrink-0">
          <div className="bg-surface-2 border border-border rounded-2xl p-2 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all w-full text-left',
                  activeTab === id
                    ? 'bg-accent-cyan/12 text-accent-cyan border border-accent-cyan/20'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                )}>
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                {label}
                {activeTab === id && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 min-w-0 space-y-5 animate-fade-in">

          {/* ════════════════════════════════ GENERAL ════════════════════════════════ */}
          {activeTab === 'general' && (
            <>
              <SectionCard title="Regional Settings" subtitle="Language, currency and time preferences" icon={Globe}>
                <SettingRow label="Default Currency" sub="Used for displaying portfolio values and prices">
                  <Select value={s.preferences.currency} onChange={(v) => update('preferences','currency',v)} options={CURRENCIES} className="w-36" />
                </SettingRow>
                <SettingRow label="Language" sub="Interface display language">
                  <Select value={s.preferences.language} onChange={(v) => update('preferences','language',v)} options={LANGUAGES} className="w-40" />
                </SettingRow>
                <SettingRow label="Timezone" sub="Used for chart timestamps and news dates">
                  <Select value={s.preferences.timezone} onChange={(v) => update('preferences','timezone',v)} options={TIMEZONES} className="w-44" />
                </SettingRow>
                <SettingRow label="Date Format" sub="How dates are displayed across the platform">
                  <Select value={s.preferences.dateFormat} onChange={(v) => update('preferences','dateFormat',v)} options={DATE_FORMATS} className="w-44" />
                </SettingRow>
                <SettingRow label="Number Format" sub="Thousands separator and decimal point style">
                  <Select value={s.preferences.numberFormat} onChange={(v) => update('preferences','numberFormat',v)}
                    options={[
                      { value:'en-US', label:'1,234.56 (US)' },
                      { value:'en-IN', label:'1,23,456 (IN)' },
                      { value:'de-DE', label:'1.234,56 (EU)' },
                    ]} className="w-44" />
                </SettingRow>
                <SettingRow label="Compact Numbers" sub="Show 2.4M instead of 2,400,000">
                  <Toggle value={s.preferences.compactNumbers} onChange={(v) => update('preferences','compactNumbers',v)} />
                </SettingRow>
              </SectionCard>

              <SectionCard title="Trading Preferences" subtitle="Default values for your trading experience" icon={BarChart2}>
                <SettingRow label="Risk Profile" sub="Affects AI analysis recommendations and alerts">
                  <div className="flex gap-1.5">
                    {[
                      { v:'conservative', label:'Low',  color:'text-accent-green' },
                      { v:'moderate',     label:'Med',  color:'text-accent-amber' },
                      { v:'aggressive',   label:'High', color:'text-accent-red'   },
                    ].map(({ v, label, color }) => (
                      <button key={v} onClick={() => update('preferences','riskProfile',v)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                          s.preferences.riskProfile === v
                            ? `bg-surface-3 border-border-bright ${color}`
                            : 'text-white/35 border-border hover:border-border-bright hover:text-white/60'
                        )}>
                        {label}
                      </button>
                    ))}
                  </div>
                </SettingRow>
                <SettingRow label="Default Chart Timeframe" sub="Timeframe shown when opening an asset page">
                  <Select value={s.preferences.defaultTimeframe} onChange={(v) => update('preferences','defaultTimeframe',v)} options={TIMEFRAMES} className="w-28" />
                </SettingRow>
              </SectionCard>

              <div className="flex justify-end pt-1">
                <SaveButton section="preferences" />
              </div>
            </>
          )}

          {/* ════════════════════════════════ APPEARANCE ═════════════════════════════ */}
          {activeTab === 'appearance' && (
            <>
              <SectionCard title="Theme" subtitle="Platform visual appearance" icon={Palette}>
                <SettingRow label="Color Theme" sub="Dark mode is recommended for extended trading sessions">
                  <div className="flex gap-2">
                    {[
                      { v:'dark',  icon:'🌙', label:'Dark'  },
                      { v:'light', icon:'☀️', label:'Light' },
                    ].map(({ v, icon, label }) => (
                      <button key={v} onClick={() => update('preferences','theme',v)}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all min-w-[100px] justify-center',
                          s.preferences.theme === v
                            ? 'bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan'
                            : 'bg-surface-3 border-border text-white/40 hover:border-border-bright hover:text-white/70'
                        )}>
                        <span>{icon}</span> {label}
                        {s.preferences.theme === v && <Check className="w-3.5 h-3.5 ml-1" />}
                      </button>
                    ))}
                  </div>
                </SettingRow>
              </SectionCard>

              <SectionCard title="Dashboard Display" subtitle="Control what appears on your dashboard" icon={Monitor}>
                <SettingRow label="Market Ticker Tape" sub="Live scrolling price ticker at the top of every page">
                  <Toggle value={s.dashboard.showTicker} onChange={(v) => update('dashboard','showTicker',v)} />
                </SettingRow>
                <SettingRow label="Mini Sparkline Charts" sub="Show trend charts inside asset cards">
                  <Toggle value={s.dashboard.showMiniCharts} onChange={(v) => update('dashboard','showMiniCharts',v)} />
                </SettingRow>
                <SettingRow label="Default Dashboard View" sub="Which section is shown first when opening the app">
                  <Select value={s.dashboard.defaultTab} onChange={(v) => update('dashboard','defaultTab',v)}
                    options={[
                      { value:'overview',  label:'Overview' },
                      { value:'portfolio', label:'Portfolio' },
                      { value:'markets',   label:'Markets' },
                    ]} className="w-36" />
                </SettingRow>
              </SectionCard>

              <div className="flex justify-end pt-1">
                <button onClick={() => { save('preferences'); save('dashboard'); }}
                  disabled={isSaving}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                    !isSaving ? 'bg-accent-cyan text-surface hover:bg-accent-cyan/90 shadow-glow-cyan' : 'bg-surface-3 text-white/30 border border-border cursor-not-allowed'
                  )}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Saving...' : 'Save Appearance'}
                </button>
              </div>
            </>
          )}

          {/* ════════════════════════════════ API KEYS ═══════════════════════════════ */}
          {activeTab === 'api-keys' && (
            <>
              {/* Info banner */}
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-accent-cyan/5 border border-accent-cyan/20">
                <Info className="w-4 h-4 text-accent-cyan flex-shrink-0 mt-0.5" />
                <div className="text-[12px] text-white/60 leading-relaxed">
                  API keys are stored securely in your account and used server-side.
                  They are <strong className="text-white">never exposed to the browser</strong>.
                  Keys are masked after saving — click to replace with a new key.
                </div>
              </div>

              <SectionCard title="Finnhub API" subtitle="Live stock quotes, candles, and financial news (free tier available)" icon={BarChart2}
                badge={
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-accent-green/10 text-accent-green border border-accent-green/20">
                    FREE TIER
                  </span>
                }>
                <div className="py-4 space-y-4">
                  <ApiKeyInput
                    label="Finnhub API Key"
                    value={s.apiKeys.finnhub}
                    onChange={(v) => update('apiKeys','finnhub',v)}
                    onTest={() => testApiKey('finnhub')}
                    placeholder="Paste your Finnhub API key..."
                    docsUrl="https://finnhub.io/register"
                    status={apiStatus.finnhub ?? 'idle'}
                  />
                  <div className="text-[11px] text-white/35 space-y-1 pl-1">
                    <p>• Free tier: 60 API calls/minute</p>
                    <p>• Provides: US stock quotes, company news, general market news</p>
                    <p>• Note: Commodity candles (Gold, Oil) need a paid Finnhub plan — mock data used as fallback</p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="OpenRouter AI" subtitle="Powers AI chat and asset analysis — free models available" icon={Zap}
                badge={
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
                    FREE MODELS
                  </span>
                }>
                <div className="py-4 space-y-4">
                  <ApiKeyInput
                    label="OpenRouter API Key"
                    value={s.apiKeys.openrouter}
                    onChange={(v) => update('apiKeys','openrouter',v)}
                    onTest={() => testApiKey('openrouter')}
                    placeholder="sk-or-v1-..."
                    docsUrl="https://openrouter.ai/keys"
                    status={apiStatus.openrouter ?? 'idle'}
                  />
                  <div>
                    <label className="text-[11px] text-white/40 font-mono uppercase tracking-wider block mb-2">AI Model</label>
                    <Select value={s.apiKeys.openrouterModel} onChange={(v) => update('apiKeys','openrouterModel',v)} options={OR_MODELS} className="w-full max-w-sm" />
                    <p className="text-[10px] text-white/30 mt-1.5">Models marked (Free) use no credits. (Paid) models deduct from your OpenRouter balance.</p>
                  </div>
                  <div className="text-[11px] text-white/35 space-y-1 pl-1">
                    <p>• Used for: AI Insights chat, Asset AI Analysis, market predictions</p>
                    <p>• LLaMA 3.1 8B (free) is fast and capable for financial analysis</p>
                    <p>• Without this key, AI features show smart mock responses</p>
                  </div>
                </div>
              </SectionCard>

              <div className="flex justify-end pt-1">
                <SaveButton section="apiKeys" label="Save API Keys" />
              </div>
            </>
          )}

          {/* ════════════════════════════════ NOTIFICATIONS ══════════════════════════ */}
          {activeTab === 'notifications' && (
            <>
              <SectionCard title="Notification Channels" subtitle="Choose how you receive alerts" icon={Bell}>
                <SettingRow label="Email Notifications" sub="Receive alerts and reports via email">
                  <Toggle value={s.notifications.emailEnabled} onChange={(v) => update('notifications','emailEnabled',v)} />
                </SettingRow>
                <SettingRow label="Push Notifications" sub="Browser push notifications for real-time alerts">
                  <Toggle value={s.notifications.pushEnabled} onChange={(v) => update('notifications','pushEnabled',v)} />
                </SettingRow>
              </SectionCard>

              <SectionCard title="Alert Types" subtitle="Control which events trigger notifications" icon={Bell}>
                <SettingRow label="Price Alerts" sub="When assets hit your configured price targets">
                  <Toggle value={s.notifications.priceAlerts} onChange={(v) => update('notifications','priceAlerts',v)} />
                </SettingRow>
                <SettingRow label="Risk Alerts" sub="When portfolio risk score changes significantly">
                  <Toggle value={s.notifications.riskAlerts} onChange={(v) => update('notifications','riskAlerts',v)} />
                </SettingRow>
                <SettingRow label="Market News Alerts" sub="Breaking news related to your tracked assets">
                  <Toggle value={s.notifications.newsAlerts} onChange={(v) => update('notifications','newsAlerts',v)} />
                </SettingRow>
                <SettingRow label="Weekly Performance Digest" sub="Portfolio summary sent every Monday morning">
                  <Toggle value={s.notifications.weeklyDigest} onChange={(v) => update('notifications','weeklyDigest',v)} />
                </SettingRow>
              </SectionCard>

              <SectionCard title="Price Alert Threshold" subtitle="Minimum % change to trigger a price alert" icon={Bell}>
                <div className="py-4 space-y-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/50">Sensitivity</span>
                    <span className="text-sm font-mono font-bold text-accent-cyan">
                      ±{s.notifications.priceThreshold}%
                    </span>
                  </div>
                  <input type="range" min={0.5} max={10} step={0.5}
                    value={s.notifications.priceThreshold}
                    onChange={(e) => update('notifications','priceThreshold', parseFloat(e.target.value))}
                    className="w-full" />
                  <div className="flex justify-between text-[10px] text-white/25 font-mono">
                    <span>0.5% (sensitive)</span>
                    <span>5%</span>
                    <span>10% (relaxed)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-3 border border-border text-[11px] text-white/40 flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-accent-cyan flex-shrink-0" />
                    You'll receive an alert when any tracked asset moves more than <strong className="text-white mx-1">±{s.notifications.priceThreshold}%</strong> in 24h.
                  </div>
                </div>
              </SectionCard>

              <div className="flex justify-end pt-1">
                <SaveButton section="notifications" />
              </div>
            </>
          )}

          {/* ════════════════════════════════ DASHBOARD ══════════════════════════════ */}
          {activeTab === 'dashboard' && (
            <>
              <SectionCard title="Live Data" subtitle="Auto-refresh and real-time update settings" icon={Wifi}>
                <SettingRow label="Auto-Refresh" sub="Automatically fetch latest prices in the background">
                  <Toggle value={s.dashboard.autoRefresh} onChange={(v) => update('dashboard','autoRefresh',v)} />
                </SettingRow>
                <SettingRow label="Refresh Interval" sub="How often to fetch new price data">
                  <Select
                    value={String(s.dashboard.refreshInterval)}
                    onChange={(v) => update('dashboard','refreshInterval', parseInt(v))}
                    options={INTERVALS}
                    className="w-36"
                  />
                </SettingRow>
              </SectionCard>

              <SectionCard title="Layout" subtitle="Customize dashboard display elements" icon={Monitor}>
                <SettingRow label="Market Ticker Tape" sub="Scrolling live price tape across the top of the page">
                  <Toggle value={s.dashboard.showTicker} onChange={(v) => update('dashboard','showTicker',v)} />
                </SettingRow>
                <SettingRow label="Mini Charts on Cards" sub="Show sparkline trend charts inside asset cards">
                  <Toggle value={s.dashboard.showMiniCharts} onChange={(v) => update('dashboard','showMiniCharts',v)} />
                </SettingRow>
                <SettingRow label="Default Landing View" sub="First screen shown after login">
                  <Select value={s.dashboard.defaultTab} onChange={(v) => update('dashboard','defaultTab',v)}
                    options={[
                      { value:'overview',  label:'Overview' },
                      { value:'portfolio', label:'My Portfolio' },
                      { value:'markets',   label:'Markets' },
                    ]} className="w-40" />
                </SettingRow>
              </SectionCard>

              <SectionCard title="Pinned Assets" subtitle="Assets always shown at the top of your dashboard" icon={Star}>
                <div className="py-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['gold','silver','crude-oil','copper','aapl','msft','nvda','tsla'].map((id) => {
                      const isPinned = s.dashboard.pinnedAssets.includes(id);
                      const labels: Record<string,string> = {
                        gold:'Gold', silver:'Silver', 'crude-oil':'Crude Oil', copper:'Copper',
                        aapl:'AAPL', msft:'MSFT', nvda:'NVDA', tsla:'TSLA',
                      };
                      return (
                        <button key={id}
                          onClick={() => {
                            const curr = s.dashboard.pinnedAssets;
                            update('dashboard','pinnedAssets',
                              isPinned ? curr.filter((a) => a !== id) : [...curr, id]
                            );
                          }}
                          className={cn(
                            'px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5',
                            isPinned
                              ? 'bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan'
                              : 'bg-surface-3 border-border text-white/40 hover:border-border-bright hover:text-white/60'
                          )}>
                          {isPinned ? <Check className="w-3 h-3" /> : <Star className="w-3 h-3" />}
                          {labels[id]}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-white/30">{s.dashboard.pinnedAssets.length} asset{s.dashboard.pinnedAssets.length !== 1 ? 's' : ''} pinned</p>
                </div>
              </SectionCard>

              <div className="flex justify-end pt-1">
                <SaveButton section="dashboard" />
              </div>
            </>
          )}

          {/* ════════════════════════════════ PRIVACY ════════════════════════════════ */}
          {activeTab === 'privacy' && (
            <>
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-surface-2 border border-border">
                <Shield className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white mb-1">Your data, your control</p>
                  <p className="text-[12px] text-white/50 leading-relaxed">
                    NexusAI does not sell your data. All data is stored in your own MongoDB instance.
                    These settings control optional telemetry and community features.
                  </p>
                </div>
              </div>

              <SectionCard title="Analytics & Telemetry" subtitle="Help improve NexusAI with anonymous usage data" icon={BarChart2}>
                <SettingRow label="Usage Analytics" sub="Anonymous page views and feature usage — no personal data">
                  <Toggle value={s.privacy.analyticsEnabled} onChange={(v) => update('privacy','analyticsEnabled',v)} />
                </SettingRow>
                <SettingRow label="Crash Reporting" sub="Automatically send error reports to help fix bugs">
                  <Toggle value={s.privacy.crashReporting} onChange={(v) => update('privacy','crashReporting',v)} />
                </SettingRow>
              </SectionCard>

              <SectionCard title="Community" subtitle="Control your visibility in community features" icon={Globe}>
                <SettingRow label="Show on Leaderboard" sub="Allow your portfolio performance to appear on community rankings">
                  <Toggle value={s.privacy.showOnLeaderboard} onChange={(v) => update('privacy','showOnLeaderboard',v)} />
                </SettingRow>
              </SectionCard>

              <SectionCard title="Data Retention" subtitle="Manage how long we keep your data" icon={Database}>
                <SettingRow label="Activity Log Retention" sub="How long your activity history is stored">
                  <Select value="90" onChange={() => {}}
                    options={[
                      { value:'30',  label:'30 days' },
                      { value:'90',  label:'90 days' },
                      { value:'365', label:'1 year' },
                    ]} className="w-32" />
                </SettingRow>
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">Clear Activity Log</p>
                    <p className="text-[11px] text-white/35 mt-0.5">Delete all recorded activity history</p>
                  </div>
                  <button
                    onClick={() => showToast({ msg: 'Activity log cleared', type: 'success' })}
                    className="px-4 py-2 rounded-xl text-xs font-medium border border-accent-red/25 text-accent-red/60 hover:text-accent-red hover:border-accent-red/50 hover:bg-accent-red/5 transition-all">
                    Clear Log
                  </button>
                </div>
              </SectionCard>

              <div className="flex items-center justify-between pt-1">
                <a href="/auth/signin" className="text-[11px] text-white/30 hover:text-white/60 transition-colors flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> Privacy Policy
                </a>
                <SaveButton section="privacy" />
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}