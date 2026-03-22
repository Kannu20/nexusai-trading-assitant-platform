'use client';

// ================================================================
// app/auth/signin/page.tsx — Sign In page
// ================================================================

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Eye, EyeOff, TrendingUp, Zap, Shield, BarChart2,
  Mail, Lock, AlertCircle, ArrowRight, Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// ── Google SVG logo ──────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19.1 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5.1l-6.2-5.3C29.4 35.5 26.8 36 24 36c-5.2 0-9.7-3.3-11.3-8H6.4C9.7 35.6 16.3 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4-4.1 5.3l6.2 5.3C37 38.5 44 33 44 24c0-1.3-.1-2.6-.4-3.9z"/>
  </svg>
);

// ── Feature highlights ───────────────────────────────────────────
const FEATURES = [
  { icon: BarChart2,  text: 'Real-time multi-asset tracking' },
  { icon: Zap,        text: 'AI-powered market insights' },
  { icon: Shield,     text: 'Secure portfolio management' },
  { icon: TrendingUp, text: 'Advanced scenario simulation' },
];

// ── Animated stat ────────────────────────────────────────────────
const STATS = [
  { value: '$2.4T', label: 'Assets Tracked' },
  { value: '98.9%', label: 'Uptime' },
  { value: '50K+',  label: 'Active Traders' },
];

export default function SignInPage() {
  const { loginWithEmail, loginWithGoogle, authError, loading, clearError } = useAuth();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [rememberMe, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Clear error when user starts typing
  useEffect(() => { clearError(); }, [email, password]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || submitting) return;
    setSubmitting(true);
    await loginWithEmail(email, password);
    setSubmitting(false);
  };

  const handleGoogleLogin = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    await loginWithGoogle();
    setGoogleLoading(false);
  };

  return (
    <div className="min-h-screen flex">

      {/* ══════════════════════════════════════════════════════
          LEFT PANEL — Branding (hidden on mobile)
      ══════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col justify-between p-12 overflow-hidden bg-surface-1">

        {/* Animated background grid */}
        <div className="absolute inset-0 bg-grid bg-grid opacity-100" />

        {/* Radial glow blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-accent-cyan/8 blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-purple-500/8 blur-3xl translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-accent-green/5 blur-3xl -translate-x-1/2 -translate-y-1/2" />

        {/* Content */}
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan to-blue-600 flex items-center justify-center shadow-glow-cyan">
              <TrendingUp className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-xl font-bold text-white font-display">NexusAI</span>
              <span className="block text-[10px] text-white/30 font-mono tracking-widest">INVESTMENT INTELLIGENCE</span>
            </div>
          </div>

          {/* Hero text */}
          <div className="mb-12">
            <h1 className="text-5xl xl:text-6xl font-bold text-white leading-tight font-display mb-6">
              Trade smarter<br/>
              <span className="text-gradient-cyan">with AI.</span>
            </h1>
            <p className="text-white/50 text-lg leading-relaxed max-w-md">
              Multi-asset intelligence platform with real-time analytics,
              AI-powered insights, and advanced portfolio simulation.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-accent-cyan" />
                </div>
                <span className="text-white/70 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 flex gap-8 pt-8 border-t border-border">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <p className="text-2xl font-bold text-white font-display">{value}</p>
              <p className="text-xs text-white/40 font-mono mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Floating ticker card */}
        <div className="absolute bottom-28 right-8 bg-surface-3/80 backdrop-blur-xl border border-border rounded-2xl p-4 shadow-card animate-pulse-glow">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
            <span className="text-[11px] text-accent-green font-mono">LIVE SIGNAL</span>
          </div>
          <p className="text-white text-sm font-semibold">Gold (XAU/INR)</p>
          <p className="text-2xl font-bold text-white font-mono">$2,341.50</p>
          <p className="text-accent-green text-xs font-mono mt-1">▲ +1.24% today</p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          RIGHT PANEL — Auth form
      ══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 relative bg-surface overflow-y-auto">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-cyan to-blue-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold text-white font-display">NexusAI</span>
        </div>

        {/* Form card */}
        <div className="w-full max-w-[400px] animate-slide-up">

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white font-display">Welcome back</h2>
            <p className="text-white/40 text-sm mt-2">
              Sign in to your account to continue
            </p>
          </div>

          {/* Error banner */}
          {authError && (
            <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-accent-red/10 border border-accent-red/25 animate-slide-up">
              <AlertCircle className="w-4 h-4 text-accent-red flex-shrink-0 mt-0.5" />
              <p className="text-sm text-accent-red/90 leading-relaxed">{authError}</p>
            </div>
          )}

          {/* Google button */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading || submitting}
            className={cn(
              'w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl',
              'bg-white/5 border border-border-bright text-white text-sm font-medium',
              'hover:bg-white/8 hover:border-white/20 transition-all duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'mb-5'
            )}
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {googleLoading ? 'Connecting...' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-white/25 font-mono uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Email / Password form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">

            {/* Email field */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-white/40 font-mono uppercase tracking-wider block">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className={cn(
                    'w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white',
                    'bg-surface-2 border border-border',
                    'placeholder:text-white/20',
                    'focus:outline-none focus:border-accent-cyan/50 focus:bg-surface-3',
                    'transition-all duration-150'
                  )}
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] text-white/40 font-mono uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-[11px] text-accent-cyan/70 hover:text-accent-cyan transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={cn(
                    'w-full pl-10 pr-12 py-3 rounded-xl text-sm text-white',
                    'bg-surface-2 border border-border',
                    'placeholder:text-white/20',
                    'focus:outline-none focus:border-accent-cyan/50 focus:bg-surface-3',
                    'transition-all duration-150'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <button
                type="button"
                onClick={() => setRemember((p) => !p)}
                className={cn(
                  'w-4 h-4 rounded flex items-center justify-center border transition-all',
                  rememberMe
                    ? 'bg-accent-cyan border-accent-cyan'
                    : 'border-border bg-surface-2'
                )}
              >
                {rememberMe && (
                  <svg viewBox="0 0 10 8" fill="none" className="w-2.5 h-2.5">
                    <path d="M1 4l3 3 5-6" stroke="#0a0a0f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span className="text-xs text-white/40">Keep me signed in for 5 days</span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || googleLoading || !email || !password}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl',
                'text-sm font-semibold transition-all duration-150 mt-2',
                submitting || googleLoading || !email || !password
                  ? 'bg-surface-3 text-white/30 cursor-not-allowed border border-border'
                  : 'bg-accent-cyan text-surface hover:bg-accent-cyan/90 shadow-glow-cyan'
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer link */}
          <p className="text-center text-sm text-white/30 mt-7">
            Don&apos;t have an account?{' '}
            <Link
              href="/auth/signup"
              className="text-accent-cyan hover:text-accent-cyan/80 font-medium transition-colors"
            >
              Create one free
            </Link>
          </p>

          {/* Security notice */}
          <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-white/20 font-mono">
            <Shield className="w-3 h-3" />
            <span>256-bit TLS · Firebase Auth · Zero-knowledge session</span>
          </div>
        </div>
      </div>
    </div>
  );
}