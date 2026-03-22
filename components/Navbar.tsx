'use client';

// ============================================================
// components/Navbar.tsx — Top navigation bar
// ============================================================

import { Menu, Bell, Search, RefreshCw } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAlertStore } from '@/lib/store';
import { ASSETS } from '@/lib/mockData';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':    { title: 'Dashboard',    subtitle: 'Portfolio overview & market snapshot' },
  '/markets':      { title: 'Markets',      subtitle: 'Real-time asset prices & volumes' },
  '/portfolio':    { title: 'Portfolio',    subtitle: 'Manage your investments' },
  '/ai-insights':  { title: 'AI Insights',  subtitle: 'Intelligent market analysis' },
  '/simulator':    { title: 'Simulator',    subtitle: 'Scenario stress testing' },
  '/alerts':       { title: 'Alerts',       subtitle: 'Price & risk notifications' },
};

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const pathname = usePathname();
  const { alerts } = useAlertStore();
  const unread = alerts.filter((a) => !a.read).length;

  // Find matching page key
  const pageKey = Object.keys(PAGE_TITLES).find((k) => pathname.startsWith(k)) || '/dashboard';
  const { title, subtitle } = PAGE_TITLES[pageKey];

  return (
    <header className="flex flex-col border-b border-border bg-surface-1">
      {/* ── Ticker tape ── */}
      <div className="ticker-wrap h-7 bg-surface-2 border-b border-border flex items-center overflow-hidden">
        <div className="ticker-inner flex items-center gap-8 text-[11px] font-mono">
          {/* Duplicate for seamless loop */}
          {[...ASSETS, ...ASSETS].map((a, i) => (
            <span key={i} className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-white/50">{a.symbol}</span>
              <span className="text-white/80">${a.price.toLocaleString()}</span>
              <span className={a.change >= 0 ? 'text-accent-green' : 'text-accent-red'}>
                {a.change >= 0 ? '▲' : '▼'} {Math.abs(a.change).toFixed(2)}%
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Main navbar ── */}
      <div className="flex items-center gap-4 px-4 md:px-6 h-14">
        {/* Menu button (mobile) */}
        <button
          onClick={onMenuClick}
          className="lg:hidden text-white/50 hover:text-white transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page title */}
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-semibold text-white leading-tight">{title}</h1>
          <p className="text-[11px] text-white/40 hidden sm:block">{subtitle}</p>
        </div>

        {/* ── Right controls ── */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-2 border border-border text-white/40 hover:border-border-bright transition-colors cursor-pointer text-xs">
            <Search className="w-3.5 h-3.5" />
            <span>Search assets...</span>
            <kbd className="ml-2 px-1.5 py-0.5 rounded bg-surface-3 text-[10px] font-mono">⌘K</kbd>
          </div>

          {/* Refresh indicator */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 border border-border text-white/40 hover:text-white/70 hover:border-border-bright transition-all text-xs group">
            <RefreshCw className="w-3.5 h-3.5 group-hover:animate-spin" />
            <span className="hidden sm:inline">Live</span>
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors">
            <Bell className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-accent-red text-[9px] font-bold text-white flex items-center justify-center">
                {unread}
              </span>
            )}
          </button>

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white cursor-pointer flex-shrink-0">
            AR
          </div>
        </div>
      </div>
    </header>
  );
}
