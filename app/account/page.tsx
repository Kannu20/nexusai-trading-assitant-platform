'use client';

// ================================================================
// app/account/page.tsx — User Account & Profile Management
// ================================================================

import { useState, useRef, useEffect } from 'react';
import {
  User, Mail, Shield, Bell, Palette, Globe, Lock,
  Camera, Save, Eye, EyeOff, CheckCircle2, AlertCircle,
  LogOut, Trash2, ChevronRight, Smartphone, Key,
  TrendingUp, BarChart2, Briefcase, Activity, Star,
  Clock, Calendar, Loader2, Edit3, ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// ── Tab definitions ───────────────────────────────────────────────
const TABS = [
  { id: 'profile',     label: 'Profile',     icon: User },
  { id: 'security',   label: 'Security',    icon: Shield },
  { id: 'preferences',label: 'Preferences', icon: Palette },
  { id: 'activity',   label: 'Activity',    icon: Activity },
] as const;
type TabId = (typeof TABS)[number]['id'];

// ── Mock recent activity ──────────────────────────────────────────
const RECENT_ACTIVITY = [
  { id: 1, action: 'Signed in via Google',          time: '2 min ago',   icon: '🔐', device: 'Chrome · macOS' },
  { id: 2, action: 'Updated portfolio — Added NVDA', time: '1h ago',      icon: '💼', device: 'Safari · iPhone' },
  { id: 3, action: 'AI Insight query — Gold trend',  time: '3h ago',      icon: '🧠', device: 'Chrome · macOS' },
  { id: 4, action: 'Alert triggered — Gold ₹2,340',  time: 'Yesterday',   icon: '🔔', device: 'System' },
  { id: 5, action: 'Simulator run — Crash −30%',     time: 'Yesterday',   icon: '🧪', device: 'Chrome · macOS' },
  { id: 6, action: 'Password changed',               time: '3 days ago',  icon: '🔑', device: 'Chrome · Windows' },
  { id: 7, action: 'Account created',                time: '7 days ago',  icon: '🎉', device: 'Chrome · macOS' },
];

// ── Small reusable components ─────────────────────────────────────
const SectionCard = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
  <div className="bg-surface-2 border border-border rounded-2xl overflow-hidden shadow-card">
    <div className="px-6 py-4 border-b border-border">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {subtitle && <p className="text-[11px] text-white/40 mt-0.5">{subtitle}</p>}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] text-white/40 font-mono uppercase tracking-wider block">{label}</label>
    {children}
  </div>
);

const inputCls = (focus = false) =>
  cn(
    'w-full px-3.5 py-2.5 rounded-xl text-sm text-white bg-surface-3 border placeholder:text-white/20',
    'focus:outline-none transition-all',
    focus ? 'border-accent-cyan/50 bg-surface-4' : 'border-border hover:border-border-bright'
  );

// ── Toast notification ────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={cn(
      'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-card animate-slide-up',
      type === 'success' ? 'bg-accent-green/10 border-accent-green/30 text-accent-green' : 'bg-accent-red/10 border-accent-red/30 text-accent-red'
    )}>
      {type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

// ── PROFILE TAB ───────────────────────────────────────────────────
function ProfileTab() {
  const { currentUser, dbUser } = useAuth();
  const [name, setName]       = useState(dbUser?.name ?? currentUser?.displayName ?? '');
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const email      = dbUser?.email ?? currentUser?.email ?? '';
  const photoURL   = dbUser?.photoURL ?? currentUser?.photoURL;
  const provider   = dbUser?.provider ?? 'email';
  const plan       = dbUser?.plan ?? 'free';
  const createdAt  = dbUser?.createdAt ? new Date(dbUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
  const lastLogin  = dbUser?.lastLoginAt ? new Date(dbUser.lastLoginAt).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
  const initials   = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) setToast({ msg: 'Profile updated successfully', type: 'success' });
      else        setToast({ msg: 'Failed to update profile', type: 'error' });
    } catch {
      setToast({ msg: 'Network error — please try again', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Avatar + account summary ── */}
      <SectionCard title="Account Summary">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoURL} alt={name} className="w-20 h-20 rounded-2xl object-cover ring-2 ring-accent-cyan/20" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold text-white">
                {initials}
              </div>
            )}
            <button className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-accent-cyan flex items-center justify-center shadow-glow-cyan hover:bg-accent-cyan/90 transition-colors">
              <Camera className="w-3.5 h-3.5 text-surface" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white font-display">{name || 'Your Name'}</h2>
              <span className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border uppercase',
                plan === 'pro'
                  ? 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/25'
                  : plan === 'enterprise'
                  ? 'bg-accent-amber/10 text-accent-amber border-accent-amber/25'
                  : 'bg-white/5 text-white/30 border-border'
              )}>
                {plan}
              </span>
            </div>
            <p className="text-white/50 text-sm mt-0.5">{email}</p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] font-mono text-white/30">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Joined {createdAt}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last login {lastLogin}
              </span>
              <span className="flex items-center gap-1">
                {provider === 'google'
                  ? <><span>🔐</span><span>Google account</span></>
                  : <><Key className="w-3 h-3" /><span>Email account</span></>
                }
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 sm:grid-cols-1 gap-3 sm:w-32 flex-shrink-0">
            {[
              { label: 'Positions', value: '4', icon: Briefcase },
              { label: 'Alerts',    value: '5', icon: Bell },
              { label: 'AI Queries',value: '12', icon: TrendingUp },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-surface-3 rounded-xl p-3 text-center border border-border">
                <Icon className="w-4 h-4 text-white/30 mx-auto mb-1" />
                <p className="text-base font-bold text-white">{value}</p>
                <p className="text-[9px] text-white/30 font-mono mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* ── Edit profile ── */}
      <SectionCard title="Personal Information" subtitle="Update your display name and profile details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Display Name">
            <div className="relative">
              <Edit3 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white bg-surface-3 border border-border hover:border-border-bright focus:outline-none focus:border-accent-cyan/50 transition-all placeholder:text-white/20"
                placeholder="Your full name"
              />
            </div>
          </Field>

          <Field label="Email Address">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
              <input
                type="email"
                value={email}
                disabled
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white/40 bg-surface-3/50 border border-border cursor-not-allowed"
              />
            </div>
            <p className="text-[10px] text-white/25 font-mono mt-1">
              {provider === 'google' ? '• Managed by Google account' : '• Contact support to change email'}
            </p>
          </Field>

          <Field label="Auth Provider">
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-surface-3/50 border border-border">
              <span className="text-sm">
                {provider === 'google' ? (
                  <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
                    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19.1 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5.1l-6.2-5.3C29.4 35.5 26.8 36 24 36c-5.2 0-9.7-3.3-11.3-8H6.4C9.7 35.6 16.3 44 24 44z"/>
                    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4-4.1 5.3l6.2 5.3C37 38.5 44 33 44 24c0-1.3-.1-2.6-.4-3.9z"/>
                  </svg>
                ) : '📧'}
              </span>
              <span className="text-sm text-white/50 capitalize">{provider === 'google' ? 'Google' : 'Email / Password'}</span>
              <span className="ml-auto">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent-green" />
              </span>
            </div>
          </Field>

          <Field label="Account ID">
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-3/50 border border-border">
              <span className="text-[11px] text-white/30 font-mono truncate flex-1">
                {currentUser?.uid?.slice(0, 24) ?? 'N/A'}...
              </span>
            </div>
          </Field>
        </div>

        <div className="flex items-center justify-end mt-5 pt-4 border-t border-border">
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
              name.trim() && !saving
                ? 'bg-accent-cyan text-surface hover:bg-accent-cyan/90 shadow-glow-cyan'
                : 'bg-surface-3 text-white/30 cursor-not-allowed border border-border'
            )}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </SectionCard>

      {/* ── Plan ── */}
      <SectionCard title="Subscription Plan">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Star className={cn('w-4 h-4', plan === 'pro' ? 'text-accent-cyan' : 'text-white/30')} />
              <span className="text-white font-semibold capitalize">{plan} Plan</span>
            </div>
            <p className="text-xs text-white/40">
              {plan === 'free'
                ? 'Track up to 5 assets · Basic analytics · Community support'
                : plan === 'pro'
                ? 'Unlimited assets · AI insights · Priority support · API access'
                : 'Everything in Pro · Team access · Dedicated account manager'}
            </p>
          </div>
          {plan === 'free' && (
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-accent-cyan to-blue-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity flex-shrink-0 shadow-glow-cyan">
              <TrendingUp className="w-4 h-4" />
              Upgrade to Pro
            </button>
          )}
          {plan === 'pro' && (
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-white/40 text-sm hover:border-border-bright hover:text-white/70 transition-all flex-shrink-0">
              Manage Billing
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

// ── SECURITY TAB ──────────────────────────────────────────────────
function SecurityTab() {
  const { currentUser, dbUser, logout } = useAuth();
  const [currentPwd, setCurrentPwd]   = useState('');
  const [newPwd, setNewPwd]           = useState('');
  const [confirmPwd, setConfirmPwd]   = useState('');
  const [showPwds, setShowPwds]       = useState({ current: false, new: false, confirm: false });
  const [toast, setToast]             = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving]           = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [twoFAEnabled, setTwoFAEnabled]   = useState(false);
  const provider = dbUser?.provider ?? currentUser?.providerData?.[0]?.providerId ?? 'email';
  const isGoogle = provider === 'google' || provider === 'google.com';

  const sessions = [
    { device: 'Chrome · macOS Ventura',   location: 'Mumbai, IN',    time: 'Active now',   current: true },
    { device: 'Safari · iPhone 15 Pro',   location: 'Mumbai, IN',    time: '2h ago',        current: false },
    { device: 'Chrome · Windows 11',      location: 'Delhi, IN',     time: '3 days ago',    current: false },
  ];

  const pwdStrength = (() => {
    const p = newPwd;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthMeta = [
    { label: '', color: '' },
    { label: 'Weak',   color: '#ff4466' },
    { label: 'Fair',   color: '#ffaa00' },
    { label: 'Good',   color: '#00d4ff' },
    { label: 'Strong', color: '#00ff88' },
  ];

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) { setToast({ msg: 'Passwords do not match', type: 'error' }); return; }
    if (pwdStrength < 2)       { setToast({ msg: 'Password is too weak', type: 'error' }); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1200)); // simulate API
    setToast({ msg: 'Password updated successfully', type: 'success' });
    setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Change password ── */}
      <SectionCard
        title="Change Password"
        subtitle={isGoogle ? 'Your account uses Google Sign-In — password is managed by Google' : 'Update your login password'}
      >
        {isGoogle ? (
          <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-surface-3/50 border border-border">
            <div className="w-8 h-8 rounded-full bg-accent-cyan/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-accent-cyan" />
            </div>
            <div>
              <p className="text-sm text-white/70">Password managed by Google</p>
              <p className="text-[11px] text-white/30 mt-0.5">Visit <a href="https://myaccount.google.com" target="_blank" rel="noreferrer" className="text-accent-cyan hover:underline">myaccount.google.com</a> to update</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {[
              { label: 'Current Password',  value: currentPwd, onChange: setCurrentPwd, key: 'current' as const },
              { label: 'New Password',      value: newPwd,     onChange: setNewPwd,     key: 'new'     as const },
              { label: 'Confirm Password',  value: confirmPwd, onChange: setConfirmPwd, key: 'confirm' as const },
            ].map(({ label, value, onChange, key }) => (
              <Field key={key} label={label}>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
                  <input
                    type={showPwds[key] ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl text-sm text-white bg-surface-3 border border-border hover:border-border-bright focus:outline-none focus:border-accent-cyan/50 placeholder:text-white/20 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwds((p) => ({ ...p, [key]: !p[key] }))}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                  >
                    {showPwds[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {key === 'new' && newPwd.length > 0 && (
                  <div className="mt-1.5">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4].map((i) => (
                        <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                          style={{ background: i <= pwdStrength ? strengthMeta[pwdStrength].color : 'rgba(255,255,255,0.08)' }} />
                      ))}
                    </div>
                    <p className="text-[10px] font-mono" style={{ color: strengthMeta[pwdStrength].color }}>
                      {strengthMeta[pwdStrength].label}
                    </p>
                  </div>
                )}
                {key === 'confirm' && confirmPwd.length > 0 && newPwd !== confirmPwd && (
                  <p className="text-[11px] text-accent-red mt-1">Passwords do not match</p>
                )}
              </Field>
            ))}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving || !currentPwd || !newPwd || !confirmPwd}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  !saving && currentPwd && newPwd && confirmPwd
                    ? 'bg-accent-cyan text-surface hover:bg-accent-cyan/90 shadow-glow-cyan'
                    : 'bg-surface-3 text-white/30 border border-border cursor-not-allowed'
                )}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </SectionCard>

      {/* ── Two-factor auth ── */}
      <SectionCard title="Two-Factor Authentication" subtitle="Add an extra layer of security to your account">
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border', twoFAEnabled ? 'bg-accent-green/10 border-accent-green/25' : 'bg-surface-3 border-border')}>
              <Smartphone className={cn('w-5 h-5', twoFAEnabled ? 'text-accent-green' : 'text-white/30')} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Authenticator App</p>
              <p className="text-[11px] text-white/40">{twoFAEnabled ? 'Enabled — using TOTP app' : 'Not configured'}</p>
            </div>
          </div>
          <button
            onClick={() => setTwoFAEnabled((p) => !p)}
            className={cn(
              'w-12 h-6 rounded-full relative transition-colors duration-300',
              twoFAEnabled ? 'bg-accent-green' : 'bg-surface-3 border border-border'
            )}
          >
            <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300', twoFAEnabled ? 'translate-x-6' : 'translate-x-0.5')} />
          </button>
        </div>
      </SectionCard>

      {/* ── Active sessions ── */}
      <SectionCard title="Active Sessions" subtitle="All devices currently signed in to your account">
        <div className="space-y-2">
          {sessions.map((s, i) => (
            <div key={i} className={cn('flex items-center gap-3 p-3.5 rounded-xl border transition-colors', s.current ? 'bg-accent-cyan/5 border-accent-cyan/20' : 'bg-surface-3/50 border-border hover:border-border-bright')}>
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', s.current ? 'bg-accent-cyan/10' : 'bg-surface-3')}>
                <Smartphone className={cn('w-4 h-4', s.current ? 'text-accent-cyan' : 'text-white/30')} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-medium text-white">{s.device}</p>
                  {s.current && <span className="px-1.5 py-0.5 rounded-full bg-accent-cyan/10 text-accent-cyan text-[9px] font-mono border border-accent-cyan/20">CURRENT</span>}
                </div>
                <p className="text-[11px] text-white/35 font-mono mt-0.5">{s.location} · {s.time}</p>
              </div>
              {!s.current && (
                <button className="text-[11px] text-accent-red/60 hover:text-accent-red transition-colors px-2 py-1 rounded-lg hover:bg-accent-red/10">
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
        <button className="mt-3 w-full py-2.5 rounded-xl border border-accent-red/20 text-accent-red/60 hover:text-accent-red hover:border-accent-red/40 hover:bg-accent-red/5 transition-all text-xs font-medium flex items-center justify-center gap-2">
          <LogOut className="w-3.5 h-3.5" />
          Sign out all other sessions
        </button>
      </SectionCard>

      {/* ── Danger zone ── */}
      <SectionCard title="Danger Zone">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-accent-red/5 border border-accent-red/20">
            <div className="flex items-start gap-3 mb-3">
              <AlertCircle className="w-4 h-4 text-accent-red flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white">Delete Account</p>
                <p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">
                  Permanently delete your account, portfolio, and all data. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={`Type "DELETE" to confirm`}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white bg-surface-3 border border-accent-red/20 placeholder:text-white/20 focus:outline-none focus:border-accent-red/50 transition-all"
              />
              <button
                disabled={deleteConfirm !== 'DELETE'}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  deleteConfirm === 'DELETE'
                    ? 'bg-accent-red text-white hover:bg-accent-red/90'
                    : 'bg-surface-3 text-white/20 border border-border cursor-not-allowed'
                )}
              >
                <Trash2 className="w-4 h-4" />
                Permanently Delete Account
              </button>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ── PREFERENCES TAB ───────────────────────────────────────────────
function PreferencesTab() {
  const { dbUser } = useAuth();
  const [currency, setCurrency]       = useState(dbUser?.preferences?.currency ?? 'INR');
  const [theme, setTheme]             = useState(dbUser?.preferences?.theme ?? 'dark');
  const [riskProfile, setRiskProfile] = useState(dbUser?.preferences?.riskProfile ?? 'moderate');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs]   = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: { currency, theme, riskProfile } }),
      });
      if (res.ok) setToast({ msg: 'Preferences saved', type: 'success' });
      else        setToast({ msg: 'Failed to save preferences', type: 'error' });
    } catch {
      setToast({ msg: 'Network error', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const Toggle = ({ value, onChange, label, sub }: { value: boolean; onChange: () => void; label: string; sub?: string }) => (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div>
        <p className="text-sm text-white">{label}</p>
        {sub && <p className="text-[11px] text-white/35 mt-0.5">{sub}</p>}
      </div>
      <button
        onClick={onChange}
        className={cn('w-11 h-6 rounded-full relative transition-colors duration-300 flex-shrink-0', value ? 'bg-accent-cyan' : 'bg-surface-3 border border-border')}
      >
        <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300', value ? 'translate-x-5' : 'translate-x-0.5')} />
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Trading preferences ── */}
      <SectionCard title="Trading Preferences" subtitle="Customize your investment experience">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Default Currency">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white bg-surface-3 border border-border hover:border-border-bright focus:outline-none focus:border-accent-cyan/50 transition-all"
            >
              {['USD','EUR','GBP','INR','JPY','CAD','AUD'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field label="Risk Profile">
            <select
              value={riskProfile}
              onChange={(e) => setRiskProfile(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white bg-surface-3 border border-border hover:border-border-bright focus:outline-none focus:border-accent-cyan/50 transition-all"
            >
              <option value="conservative">Conservative — low risk</option>
              <option value="moderate">Moderate — balanced</option>
              <option value="aggressive">Aggressive — high growth</option>
            </select>
          </Field>
        </div>

        {/* Risk profile visual */}
        <div className="mt-4 p-4 rounded-xl bg-surface-3/50 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/40 font-mono">RISK APPETITE</span>
            <span className={cn(
              'text-xs font-semibold capitalize',
              riskProfile === 'conservative' ? 'text-accent-green' :
              riskProfile === 'moderate'     ? 'text-accent-amber' : 'text-accent-red'
            )}>
              {riskProfile}
            </span>
          </div>
          <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: riskProfile === 'conservative' ? '25%' : riskProfile === 'moderate' ? '55%' : '90%',
                background: riskProfile === 'conservative' ? '#00ff88' : riskProfile === 'moderate' ? '#ffaa00' : '#ff4466',
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[9px] font-mono text-white/20">
            <span>Conservative</span><span>Moderate</span><span>Aggressive</span>
          </div>
        </div>
      </SectionCard>

      {/* ── Appearance ── */}
      <SectionCard title="Appearance">
        <Field label="Theme">
          <div className="grid grid-cols-2 gap-2">
            {(['dark','light'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={cn(
                  'flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all',
                  theme === t
                    ? 'bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan'
                    : 'bg-surface-3 border-border text-white/40 hover:border-border-bright hover:text-white/70'
                )}
              >
                <span>{t === 'dark' ? '🌙' : '☀️'}</span>
                <span className="capitalize">{t} Mode</span>
                {theme === t && <CheckCircle2 className="w-3.5 h-3.5 ml-auto" />}
              </button>
            ))}
          </div>
        </Field>
      </SectionCard>

      {/* ── Notifications ── */}
      <SectionCard title="Notification Settings" subtitle="Control how and when we notify you">
        <div>
          <Toggle value={emailNotifs}   onChange={() => setEmailNotifs((p)   => !p)} label="Email Notifications"  sub="Receive alerts and reports by email" />
          <Toggle value={pushNotifs}    onChange={() => setPushNotifs((p)    => !p)} label="Push Notifications"   sub="Browser push notifications for real-time alerts" />
          <Toggle value={priceAlerts}   onChange={() => setPriceAlerts((p)   => !p)} label="Price Alerts"         sub="Get notified when assets hit your target prices" />
          <Toggle value={weeklyDigest}  onChange={() => setWeeklyDigest((p)  => !p)} label="Weekly Digest"        sub="Summary of your portfolio performance every Monday" />
        </div>
      </SectionCard>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent-cyan text-surface font-semibold text-sm hover:bg-accent-cyan/90 shadow-glow-cyan transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}

// ── ACTIVITY TAB ──────────────────────────────────────────────────
function ActivityTab() {
  const { dbUser, currentUser } = useAuth();
  const joinDate   = dbUser?.createdAt ? new Date(dbUser.createdAt) : new Date();
  const daysActive = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Days Active',    value: daysActive || 7,  icon: Calendar,  color: '#00d4ff' },
          { label: 'AI Queries',     value: 12,               icon: BarChart2, color: '#9966ff' },
          { label: 'Alerts Fired',   value: 8,                icon: Bell,      color: '#ffaa00' },
          { label: 'Simulations',    value: 5,                icon: Activity,  color: '#00ff88' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-surface-2 border border-border rounded-2xl p-4 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <Icon className="w-4 h-4" style={{ color }} />
              <span className="text-[10px] font-mono text-white/25 uppercase">{label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <SectionCard title="Recent Activity" subtitle="Your last actions on NexusAI">
        <div className="space-y-1">
          {RECENT_ACTIVITY.map((item, i) => (
            <div
              key={item.id}
              className={cn(
                'flex items-start gap-3 px-3 py-3 rounded-xl transition-colors',
                i === 0 ? 'bg-accent-cyan/5 border border-accent-cyan/10' : 'hover:bg-white/3'
              )}
            >
              <span className="text-lg flex-shrink-0 mt-0.5">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80">{item.action}</p>
                <p className="text-[11px] text-white/30 font-mono mt-0.5">{item.device}</p>
              </div>
              <span className="text-[11px] text-white/30 font-mono flex-shrink-0">{item.time}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Data export */}
      <SectionCard title="Data & Privacy" subtitle="Download or manage your personal data">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button className="flex items-center gap-3 p-4 rounded-xl bg-surface-3/50 border border-border hover:border-border-bright hover:bg-surface-3 transition-all">
            <Globe className="w-5 h-5 text-accent-cyan" />
            <div className="text-left">
              <p className="text-sm font-medium text-white">Export Data</p>
              <p className="text-[11px] text-white/35">Download all your data as JSON</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20 ml-auto" />
          </button>
          <button className="flex items-center gap-3 p-4 rounded-xl bg-surface-3/50 border border-border hover:border-border-bright hover:bg-surface-3 transition-all">
            <Shield className="w-5 h-5 text-accent-green" />
            <div className="text-left">
              <p className="text-sm font-medium text-white">Privacy Policy</p>
              <p className="text-[11px] text-white/35">How we use your data</p>
            </div>
            <ExternalLink className="w-4 h-4 text-white/20 ml-auto" />
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────
export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const { currentUser, dbUser }   = useAuth();

  const displayName = dbUser?.name ?? currentUser?.displayName ?? 'Your Account';
  const email       = dbUser?.email ?? currentUser?.email ?? '';
  const photoURL    = dbUser?.photoURL ?? currentUser?.photoURL;
  const initials    = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  const CONTENT: Record<TabId, React.ReactNode> = {
    profile:     <ProfileTab />,
    security:    <SecurityTab />,
    preferences: <PreferencesTab />,
    activity:    <ActivityTab />,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-slide-up">

      {/* ── Page hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-surface-2 border border-border shadow-card p-6">
        <div className="absolute inset-0 bg-grid bg-grid opacity-40" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-cyan/5 blur-3xl rounded-full" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoURL} alt={displayName} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-accent-cyan/20 flex-shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white font-display">{displayName}</h1>
            <p className="text-white/40 text-sm">{email}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent-green/8 border border-accent-green/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-green" />
            </span>
            <span className="text-[11px] font-mono text-accent-green">ACTIVE</span>
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 bg-surface-2 border border-border rounded-2xl p-1 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center',
              activeTab === id
                ? 'bg-accent-cyan/12 text-accent-cyan border border-accent-cyan/25 shadow-sm'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            )}
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="animate-fade-in">
        {CONTENT[activeTab]}
      </div>
    </div>
  );
}