'use client';

// ============================================================
// components/StatCard.tsx — KPI stat card component
// ============================================================

import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  accentColor?: string;
}

export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  trend = 'neutral',
  className,
  accentColor = '#00d4ff',
}: StatCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-5',
        'bg-surface-2 border border-border shadow-card',
        'hover:border-border-bright transition-all duration-200',
        className
      )}
    >
      {/* Background gradient */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 blur-2xl"
        style={{ background: accentColor }}
      />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[11px] text-white/40 font-mono uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-white mt-1.5 font-display">{value}</p>
          {sub && (
            <p
              className={cn(
                'text-xs mt-1 font-mono',
                trend === 'up' && 'text-accent-green',
                trend === 'down' && 'text-accent-red',
                trend === 'neutral' && 'text-white/40'
              )}
            >
              {sub}
            </p>
          )}
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}30` }}
        >
          <Icon className="w-5 h-5" style={{ color: accentColor }} />
        </div>
      </div>
    </div>
  );
}
