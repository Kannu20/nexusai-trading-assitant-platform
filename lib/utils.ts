// ============================================================
// lib/utils.ts — Shared utility functions
// ============================================================

import { clsx, type ClassValue } from 'clsx';

/** Merge Tailwind class names safely */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Format a number as USD currency */
export function formatCurrency(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Format a percentage with sign */
export function formatPercent(value: number, decimals = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/** Format large numbers with K/M/B suffixes */
export function formatCompact(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value}`;
}

/** Compute a diversification score 0–100 from an array of allocation weights */
export function diversificationScore(weights: number[]): number {
  if (!weights.length) return 0;
  const n = weights.length;
  const hhi = weights.reduce((sum, w) => sum + (w / 100) ** 2, 0);
  const minHHI = 1 / n;
  const score = Math.round((1 - (hhi - minHHI) / (1 - minHHI)) * 100);
  return Math.max(0, Math.min(100, score));
}

/** Return a risk label from a score */
export function riskLabel(score: number): 'Low' | 'Medium' | 'High' {
  if (score < 35) return 'Low';
  if (score < 65) return 'Medium';
  return 'High';
}

/** Return color class for risk label */
export function riskColor(label: 'Low' | 'Medium' | 'High'): string {
  return {
    Low: 'text-accent-green',
    Medium: 'text-accent-amber',
    High: 'text-accent-red',
  }[label];
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
