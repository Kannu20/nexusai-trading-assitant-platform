'use client';

// ================================================================
// components/Navbar.tsx — Full-featured top navigation bar
// ================================================================

import {
  Menu, Bell, Search, RefreshCw, X, TrendingUp, TrendingDown,
  LogOut, Settings, User as UserIcon, ChevronRight, Clock,
  Zap, CheckCheck, ExternalLink,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAlertStore } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { ASSETS } from '@/lib/mockData';
import { cn, formatCurrency, formatPercent } from '@/lib/utils';

// ── Page meta ────────────────────────────────────────────────────
const PAGE_TITLES: Record<string, { title: string; subtitle: string; emoji: string }> = {
  '/dashboard':   { title: 'Dashboard',    subtitle: 'Portfolio overview & market snapshot', emoji: '📊' },
  '/markets':     { title: 'Markets',      subtitle: 'Real-time asset prices & volumes',     emoji: '📈' },
  '/portfolio':   { title: 'Portfolio',    subtitle: 'Manage your investments',               emoji: '💼' },
  '/ai-insights': { title: 'AI Insights',  subtitle: 'Intelligent market analysis',           emoji: '🧠' },
  '/simulator':   { title: 'Simulator',    subtitle: 'Scenario stress testing',               emoji: '🧪' },
  '/alerts':      { title: 'Alerts',       subtitle: 'Price & risk notifications',            emoji: '🔔' },
};

const SEVERITY_DOT: Record<string, string> = {
  high:   'bg-accent-red',
  medium: 'bg-accent-amber',
  low:    'bg-accent-green',
};

// ── Clock component ───────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
        })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-white/30">
      <Clock className="w-3 h-3" />
      {time}
    </span>
  );
}

// ── Search modal ─────────────────────────────────────────────────
function SearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const results = query.trim().length > 0
    ? ASSETS.filter(
        (a) =>
          a.name.toLowerCase().includes(query.toLowerCase()) ||
          a.symbol.toLowerCase().includes(query.toLowerCase())
      )
    : ASSETS.slice(0, 5);

  const handleSelect = (id: string) => {
    router.push(`/markets`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-surface-2 border border-border-bright rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] overflow-hidden animate-slide-up">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assets, markets, symbols..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none"
          />
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-surface-3 border border-border text-[10px] font-mono text-white/30">ESC</kbd>
            <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="py-2 max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-center text-white/25 text-sm py-8">No assets found</p>
          ) : (
            <>
              <p className="text-[10px] text-white/25 font-mono uppercase px-4 pb-1">
                {query ? `${results.length} results` : 'Popular assets'}
              </p>
              {results.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => handleSelect(asset.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-surface-3 border border-border flex items-center justify-center text-sm flex-shrink-0">
                    {asset.category === 'stock' ? '📈' : asset.id === 'gold' ? '🥇' : asset.id === 'silver' ? '🥈' : asset.id === 'crude-oil' ? '🛢️' : '🔶'}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-white truncate">{asset.name}</p>
                    <p className="text-[11px] text-white/40 font-mono">{asset.symbol}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-mono font-semibold text-white">{formatCurrency(asset.price)}</p>
                    <p className={cn('text-[11px] font-mono', asset.change >= 0 ? 'text-accent-green' : 'text-accent-red')}>
                      {formatPercent(asset.change)}
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
                </button>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-border flex items-center gap-4 text-[10px] font-mono text-white/20">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>ESC close</span>
        </div>
      </div>
    </div>
  );
}

// ── Notifications panel ──────────────────────────────────────────
function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { alerts, markRead } = useAlertStore();
  const unread = alerts.filter((a) => !a.read).length;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-80 bg-surface-2 border border-border-bright rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-slide-up"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-accent-cyan" />
          <span className="text-sm font-semibold text-white">Notifications</span>
          {unread > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-accent-red text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={() => alerts.filter((a) => !a.read).forEach((a) => markRead(a.id))}
            className="flex items-center gap-1 text-[11px] text-accent-cyan hover:text-accent-cyan/80 transition-colors"
          >
            <CheckCheck className="w-3 h-3" />
            Mark all read
          </button>
        )}
      </div>

      {/* Alert list */}
      <div className="max-h-80 overflow-y-auto divide-y divide-border/50">
        {alerts.slice(0, 6).map((alert) => (
          <div
            key={alert.id}
            onClick={() => markRead(alert.id)}
            className={cn(
              'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors',
              alert.read ? 'opacity-50 hover:opacity-70' : 'hover:bg-white/3'
            )}
          >
            <div className="flex-shrink-0 mt-1">
              <span className={cn('w-2 h-2 rounded-full inline-block', SEVERITY_DOT[alert.severity])} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-semibold text-white">{alert.asset}</span>
                {!alert.read && (
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan flex-shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed line-clamp-2">{alert.message}</p>
              <p className="text-[10px] text-white/25 font-mono mt-1">{alert.time}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <Link
        href="/alerts"
        onClick={onClose}
        className="flex items-center justify-center gap-2 px-4 py-3 border-t border-border text-xs text-accent-cyan hover:text-accent-cyan/80 transition-colors"
      >
        View all alerts
        <ExternalLink className="w-3 h-3" />
      </Link>
    </div>
  );
}

// ── User profile dropdown ────────────────────────────────────────
function ProfileDropdown({ onClose }: { onClose: () => void }) {
  const { currentUser, dbUser, logout } = useAuth();
  const ref = useRef<HTMLDivElement>(null);

  const displayName = dbUser?.name ?? currentUser?.displayName ?? 'Trader';
  const email       = dbUser?.email ?? currentUser?.email ?? '';
  const plan        = dbUser?.plan ?? 'free';
  const photoURL    = dbUser?.photoURL ?? currentUser?.photoURL;
  const initials    = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  const riskProfile = dbUser?.preferences?.riskProfile ?? 'moderate';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-72 bg-surface-2 border border-border-bright rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-slide-up"
    >
      {/* User card */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          {photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoURL} alt={displayName} className="w-11 h-11 rounded-full object-cover ring-2 ring-accent-cyan/20 flex-shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{displayName}</p>
            <p className="text-[11px] text-white/40 truncate">{email}</p>
          </div>
        </div>

        {/* Plan + risk badge row */}
        <div className="flex items-center gap-2 mt-3">
          <span className={cn(
            'px-2 py-1 rounded-full text-[10px] font-mono font-semibold uppercase border',
            plan === 'pro'
              ? 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/25'
              : plan === 'enterprise'
              ? 'bg-accent-amber/10 text-accent-amber border-accent-amber/25'
              : 'bg-white/5 text-white/30 border-border'
          )}>
            {plan} plan
          </span>
          <span className="px-2 py-1 rounded-full text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase">
            {riskProfile}
          </span>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        {[
          { label: 'Portfolio', value: '₹45.0K' },
          { label: "Today's P&L", value: '+₹312' },
          { label: 'Positions', value: '4' },
        ].map(({ label, value }) => (
          <div key={label} className="px-3 py-2.5 text-center">
            <p className="text-xs font-semibold text-white">{value}</p>
            <p className="text-[9px] text-white/30 font-mono mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Menu items */}
      <div className="py-1.5">
        {[
          { icon: UserIcon, label: 'My Profile',     href: '/account' },
          { icon: Settings, label: 'Settings',        href: '#' },
        ].map(({ icon: Icon, label, href }) => (
          <Link
            key={label}
            href={href}
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all"
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
            <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/20" />
          </Link>
        ))}
      </div>

      {/* Logout */}
      <div className="border-t border-border py-1.5 px-2">
        <button
          onClick={() => { logout(); onClose(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-accent-red hover:bg-accent-red/8 transition-all"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  );
}

// ── Main Navbar ───────────────────────────────────────────────────
interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const pathname = usePathname();
  const { alerts } = useAlertStore();
  const { currentUser, dbUser } = useAuth();

  const [searchOpen, setSearchOpen]       = useState(false);
  const [notifsOpen, setNotifsOpen]       = useState(false);
  const [profileOpen, setProfileOpen]     = useState(false);
  const [refreshSpin, setRefreshSpin]     = useState(false);

  const unread      = alerts.filter((a) => !a.read).length;
  const pageKey     = Object.keys(PAGE_TITLES).find((k) => pathname.startsWith(k)) ?? '/dashboard';
  const { title, subtitle, emoji } = PAGE_TITLES[pageKey];

  const displayName = dbUser?.name ?? currentUser?.displayName ?? 'Trader';
  const photoURL    = dbUser?.photoURL ?? currentUser?.photoURL;
  const initials    = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  // ⌘K keyboard shortcut to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleRefresh = () => {
    setRefreshSpin(true);
    setTimeout(() => setRefreshSpin(false), 1000);
  };

  const closeAll = () => {
    setNotifsOpen(false);
    setProfileOpen(false);
  };

  return (
    <>
      {/* ── Search modal (portal-style) ── */}
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}

      <header className="flex flex-col border-b border-border bg-surface-1 sticky top-0 z-20">

        {/* ── Ticker tape ──────────────────────────────────────── */}
        <div className="ticker-wrap h-7 bg-surface-2 border-b border-border flex items-center overflow-hidden">
          <div className="ticker-inner flex items-center gap-8 text-[11px] font-mono select-none">
            {[...ASSETS, ...ASSETS].map((a, i) => (
              <span key={i} className="flex items-center gap-1.5 whitespace-nowrap px-1">
                <span className="text-white/35">{a.symbol}</span>
                <span className="text-white/75 font-semibold">${a.price.toLocaleString()}</span>
                <span className={cn(
                  'flex items-center gap-0.5',
                  a.change >= 0 ? 'text-accent-green' : 'text-accent-red'
                )}>
                  {a.change >= 0
                    ? <TrendingUp className="w-2.5 h-2.5" />
                    : <TrendingDown className="w-2.5 h-2.5" />
                  }
                  {Math.abs(a.change).toFixed(2)}%
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* ── Main bar ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 md:px-5 h-[52px]">

          {/* Mobile hamburger */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors flex-shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page title */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className="text-base hidden sm:block">{emoji}</span>
            <div className="min-w-0">
              <h1 className="text-[14px] font-bold text-white leading-tight truncate">{title}</h1>
              <p className="text-[11px] text-white/35 hidden md:block truncate">{subtitle}</p>
            </div>
          </div>

          {/* ── Right controls ── */}
          <div className="flex items-center gap-1.5 flex-shrink-0">

            {/* Clock */}
            <LiveClock />

            {/* Live dot */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent-green/8 border border-accent-green/15 text-[10px] font-mono text-accent-green">
              <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-green" />
              </span>
              LIVE
            </div>

            {/* Search button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-2 border border-border text-white/35 hover:text-white/70 hover:border-border-bright transition-all text-xs group"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Search</span>
              <kbd className="hidden lg:inline ml-1 px-1.5 py-0.5 rounded bg-surface-3 border border-border text-[9px] font-mono group-hover:border-border-bright transition-colors">
                ⌘K
              </kbd>
            </button>

            {/* Mobile search icon */}
            <button
              onClick={() => setSearchOpen(true)}
              className="md:hidden p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
              title="Refresh data"
            >
              <RefreshCw className={cn('w-3.5 h-3.5 transition-transform', refreshSpin && 'animate-spin')} />
            </button>

            {/* Notifications bell */}
            <div className="relative">
              <button
                onClick={() => { setNotifsOpen((p) => !p); setProfileOpen(false); }}
                className={cn(
                  'relative p-2 rounded-lg transition-all',
                  notifsOpen
                    ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/25'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                )}
              >
                <Bell className="w-4 h-4" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-accent-red text-[9px] font-bold text-white flex items-center justify-center px-1 shadow-sm">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>

              {notifsOpen && (
                <NotificationsPanel onClose={() => setNotifsOpen(false)} />
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-border mx-0.5" />

            {/* Avatar / profile dropdown */}
            <div className="relative">
              <button
                onClick={() => { setProfileOpen((p) => !p); setNotifsOpen(false); }}
                className={cn(
                  'flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl transition-all',
                  profileOpen
                    ? 'bg-white/8 border border-border-bright'
                    : 'hover:bg-white/5'
                )}
              >
                {photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoURL}
                    alt={displayName}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-transparent group-hover:ring-accent-cyan/20 transition-all flex-shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                    {initials}
                  </div>
                )}
                <span className="hidden lg:block text-xs font-medium text-white/70 max-w-[80px] truncate">
                  {displayName.split(' ')[0]}
                </span>
              </button>

              {profileOpen && (
                <ProfileDropdown onClose={() => setProfileOpen(false)} />
              )}
            </div>
          </div>
        </div>

        {/* ── Secondary breadcrumb bar ──────────────────────────── */}
        <div className="hidden lg:flex items-center justify-between px-5 py-1.5 bg-surface-2/40 border-t border-border/50">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-white/25">
            <span>NexusAI</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/50">{title}</span>
          </div>

          {/* Quick market pulse */}
          <div className="flex items-center gap-4">
            {ASSETS.slice(0, 4).map((a) => (
              <div key={a.id} className="flex items-center gap-1.5 text-[10px] font-mono">
                <span className="text-white/30">{a.symbol.split('/')[0]}</span>
                <span className="text-white/60">{formatCurrency(a.price, a.price < 10 ? 2 : 0)}</span>
                <span className={cn('flex items-center gap-0.5', a.change >= 0 ? 'text-accent-green' : 'text-accent-red')}>
                  {a.change >= 0 ? '▲' : '▼'}{Math.abs(a.change).toFixed(2)}%
                </span>
              </div>
            ))}
            <div className="flex items-center gap-1 text-[10px] font-mono text-white/20">
              <Zap className="w-2.5 h-2.5 text-accent-amber" />
              <span>NYSE OPEN</span>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}