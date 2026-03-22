'use client';

// ================================================================
// components/AuthGuard.tsx — Wraps protected pages
// Shows a loading spinner while auth state resolves,
// so the page doesn't flash before redirect fires.
// ================================================================

import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-surface flex flex-col items-center justify-center gap-6 z-50">
        {/* Logo */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-cyan to-blue-600 flex items-center justify-center shadow-glow-cyan animate-pulse-glow">
          <TrendingUp className="w-7 h-7 text-white" strokeWidth={2.5} />
        </div>

        {/* Spinner */}
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-white/10" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent-cyan animate-spin" />
        </div>

        <div className="text-center">
          <p className="text-sm font-semibold text-white/60 font-display">NexusAI</p>
          <p className="text-[11px] text-white/25 font-mono mt-1">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}