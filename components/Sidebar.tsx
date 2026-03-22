'use client';

// ============================================================
// components/Sidebar.tsx — Navigation sidebar (auth-aware)
// ============================================================

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BarChart2, Briefcase, Brain,
  FlaskConical, Bell, ChevronLeft, ChevronRight,
  X, TrendingUp, Zap, LogOut, Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const NAV_ITEMS = [
  { label: 'Dashboard',   href: '/dashboard',   icon: LayoutDashboard },
  { label: 'Markets',     href: '/markets',     icon: BarChart2 },
  { label: 'Portfolio',   href: '/portfolio',   icon: Briefcase },
  { label: 'AI Insights', href: '/ai-insights', icon: Brain },
  { label: 'Simulator',   href: '/simulator',   icon: FlaskConical },
  { label: 'Alerts',      href: '/alerts',      icon: Bell },
];

interface SidebarProps {
  open: boolean;
  collapsed: boolean;
  onCollapse: () => void;
  onClose: () => void;
}

export default function Sidebar({ open, collapsed, onCollapse, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { currentUser, dbUser, logout } = useAuth();

  const displayName = dbUser?.name ?? currentUser?.displayName ?? 'Trader';
  const plan        = dbUser?.plan ?? 'free';
  const photoURL    = dbUser?.photoURL ?? currentUser?.photoURL;
  const initials    = displayName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside
      className={cn(
        'fixed lg:relative z-30 flex flex-col h-full',
        'bg-surface-1 border-r border-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-60',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* ── Logo ── */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-border',
        collapsed && 'justify-center px-0'
      )}>
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-accent-cyan to-blue-600 flex items-center justify-center shadow-glow-cyan">
          <TrendingUp className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-[15px] font-bold text-white leading-none font-display">NexusAI</span>
            <span className="text-[10px] text-white/40 font-mono mt-0.5">INTELLIGENCE</span>
          </div>
        )}
        <button onClick={onClose} className="ml-auto text-white/40 hover:text-white lg:hidden">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Live indicator ── */}
      {!collapsed && (
        <div className="mx-4 mt-3 mb-1 px-3 py-2 rounded-lg bg-accent-green/10 border border-accent-green/20 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-green" />
          </span>
          <span className="text-[11px] text-accent-green font-mono">LIVE MARKET</span>
          <Zap className="w-3 h-3 text-accent-green ml-auto" />
        </div>
      )}

      {/* ── Nav items ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm',
                'transition-all duration-150 group relative',
                collapsed && 'justify-center',
                active
                  ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20'
                  : 'text-white/50 hover:text-white/90 hover:bg-white/5'
              )}
            >
              <Icon className={cn(
                'flex-shrink-0 w-4 h-4 transition-colors',
                active ? 'text-accent-cyan' : 'text-white/40 group-hover:text-white/70'
              )} />
              {!collapsed && <span className="font-medium">{label}</span>}
              {active && !collapsed && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-cyan" />}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-surface-3 border border-border rounded-lg text-xs text-white/80 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  {label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Collapse toggle (desktop only) ── */}
      <div className="hidden lg:flex border-t border-border p-2">
        <button
          onClick={onCollapse}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors text-xs"
        >
          {collapsed
            ? <ChevronRight className="w-4 h-4" />
            : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>
          }
        </button>
      </div>

      {/* ── User profile + logout ── */}
      <div className={cn('border-t border-border', collapsed ? 'p-2' : 'px-3 py-3')}>
        {collapsed ? (
          <div className="space-y-1">
            {photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoURL} alt={displayName} className="w-8 h-8 rounded-full mx-auto object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white mx-auto">
                {initials}
              </div>
            )}
            <button
              onClick={logout}
              title="Sign out"
              className="w-full flex justify-center p-2 rounded-lg text-white/30 hover:text-accent-red hover:bg-accent-red/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
              {photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoURL}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-accent-cyan/20"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate leading-tight">{displayName}</p>
                <span className={cn(
                  'text-[9px] font-mono px-1.5 py-0.5 rounded-full uppercase inline-block mt-0.5',
                  plan === 'pro'
                    ? 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/25'
                    : 'bg-white/5 text-white/30 border border-border'
                )}>
                  {plan}
                </span>
              </div>
            </div>

            <div className="flex gap-1 px-1">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all text-xs">
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
              <button
                onClick={logout}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-white/30 hover:text-accent-red hover:bg-accent-red/10 transition-all text-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}