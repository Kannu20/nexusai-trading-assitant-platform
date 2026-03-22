'use client';

// ================================================================
// app/auth/signup/page.tsx — Sign Up / Register page
// ================================================================

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Eye, EyeOff, TrendingUp, Shield, Mail, Lock,
  User as UserIcon, AlertCircle, ArrowRight, Loader2,
  Check, X
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

// ── Password strength checker ────────────────────────────────────
interface PasswordCheck {
  label: string;
  pass:  boolean;
}
function getPasswordChecks(pwd: string): PasswordCheck[] {
  return [
    { label: 'At least 8 characters',         pass: pwd.length >= 8 },
    { label: 'Contains uppercase letter',      pass: /[A-Z]/.test(pwd) },
    { label: 'Contains number',               pass: /[0-9]/.test(pwd) },
    { label: 'Contains special character',    pass: /[^A-Za-z0-9]/.test(pwd) },
  ];
}
function passwordStrength(pwd: string): { score: number; label: string; color: string } {
  const checks = getPasswordChecks(pwd);
  const score = checks.filter((c) => c.pass).length;
  if (score === 0) return { score: 0, label: '', color: '' };
  if (score === 1) return { score: 1, label: 'Weak',    color: '#ff4466' };
  if (score === 2) return { score: 2, label: 'Fair',    color: '#ffaa00' };
  if (score === 3) return { score: 3, label: 'Good',    color: '#00d4ff' };
  return           { score: 4, label: 'Strong',  color: '#00ff88' };
}

// ── Plan options ──────────────────────────────────────────────────
const PLANS = [
  { id: 'free',  label: 'Free',  desc: '5 assets · Basic analytics',   badge: null },
  { id: 'pro',   label: 'Pro',   desc: 'Unlimited · AI insights · API', badge: 'Popular' },
];

export default function SignUpPage() {
  const { registerWithEmail, loginWithGoogle, authError, clearError } = useAuth();

  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirmPass, setConfirm] = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [plan, setPlan]           = useState<'free' | 'pro'>('pro');
  const [agreed, setAgreed]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => { clearError(); }, [name, email, password]);

  const pwdChecks  = useMemo(() => getPasswordChecks(password), [password]);
  const pwdStrength = useMemo(() => passwordStrength(password), [password]);
  const passwordsMatch = confirmPass === '' || password === confirmPass;

  const isFormValid =
    name.trim().length >= 2 &&
    email.includes('@') &&
    pwdStrength.score >= 2 &&
    password === confirmPass &&
    agreed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || submitting) return;
    setSubmitting(true);
    await registerWithEmail(email, password, name.trim());
    setSubmitting(false);
  };

  const handleGoogle = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    await loginWithGoogle();
    setGoogleLoading(false);
  };

  return (
    <div className="min-h-screen flex">

      {/* ══════════════════════════════════════════════════════
          LEFT PANEL — Branding
      ══════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-center p-12 overflow-hidden bg-surface-1">
        {/* Background effects */}
        <div className="absolute inset-0 bg-grid bg-grid opacity-100" />
        <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-accent-green/8 blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 rounded-full bg-accent-cyan/8 blur-3xl" />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-14">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan to-blue-600 flex items-center justify-center shadow-glow-cyan">
              <TrendingUp className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-xl font-bold text-white font-display">NexusAI</span>
              <span className="block text-[10px] text-white/30 font-mono tracking-widest">INVESTMENT INTELLIGENCE</span>
            </div>
          </div>

          <h2 className="text-4xl xl:text-5xl font-bold text-white font-display leading-tight mb-5">
            Start investing<br/>
            <span className="text-gradient-green">intelligently.</span>
          </h2>
          <p className="text-white/50 leading-relaxed mb-10 max-w-sm">
            Join 50,000+ traders using AI-powered analytics to make smarter
            investment decisions across stocks, commodities, and more.
          </p>

          {/* What you get */}
          <div className="space-y-3">
            {[
              'Real-time price tracking across 100+ assets',
              'AI market analysis and trend detection',
              'Portfolio risk scoring and rebalancing',
              'Scenario simulation and stress testing',
              'Smart alerts for price & risk events',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-accent-green/15 border border-accent-green/30 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-accent-green" />
                </div>
                <span className="text-sm text-white/60">{item}</span>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="mt-12 p-4 rounded-2xl bg-surface-2/80 border border-border">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex-shrink-0 flex items-center justify-center text-sm font-bold text-white">
                J
              </div>
              <div>
                <p className="text-sm text-white/70 leading-relaxed italic">
                  &quot;NexusAI completely changed how I manage my multi-asset portfolio.
                  The AI insights are genuinely useful.&quot;
                </p>
                <p className="text-xs text-white/30 mt-1.5 font-mono">— James K., Portfolio Manager</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          RIGHT PANEL — Sign up form
      ══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-surface overflow-y-auto">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-cyan to-blue-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold text-white font-display">NexusAI</span>
        </div>

        <div className="w-full max-w-[420px] animate-slide-up py-4">

          {/* Heading */}
          <div className="mb-7">
            <h2 className="text-3xl font-bold text-white font-display">Create account</h2>
            <p className="text-white/40 text-sm mt-1.5">Free forever. No credit card required.</p>
          </div>

          {/* Error banner */}
          {authError && (
            <div className="flex items-start gap-3 p-4 mb-5 rounded-xl bg-accent-red/10 border border-accent-red/25 animate-slide-up">
              <AlertCircle className="w-4 h-4 text-accent-red flex-shrink-0 mt-0.5" />
              <p className="text-sm text-accent-red/90 leading-relaxed">{authError}</p>
            </div>
          )}

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading || submitting}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-border-bright text-white text-sm font-medium hover:bg-white/8 hover:border-white/20 transition-all disabled:opacity-50 mb-5"
          >
            {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
            {googleLoading ? 'Connecting...' : 'Sign up with Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-white/25 font-mono uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Plan picker */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            {PLANS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlan(p.id as 'free' | 'pro')}
                className={cn(
                  'relative px-3 py-3 rounded-xl border text-left transition-all',
                  plan === p.id
                    ? 'bg-accent-cyan/10 border-accent-cyan/30'
                    : 'bg-surface-2 border-border hover:border-border-bright'
                )}
              >
                {p.badge && (
                  <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded-full bg-accent-cyan text-surface text-[9px] font-bold">
                    {p.badge}
                  </span>
                )}
                <p className={cn('text-sm font-semibold', plan === p.id ? 'text-accent-cyan' : 'text-white')}>
                  {p.label}
                </p>
                <p className="text-[10px] text-white/40 mt-0.5 leading-tight">{p.desc}</p>
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div>
              <label className="text-[11px] text-white/40 font-mono uppercase tracking-wider block mb-1.5">
                Full name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <input
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rhodes"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white bg-surface-2 border border-border placeholder:text-white/20 focus:outline-none focus:border-accent-cyan/50 focus:bg-surface-3 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-[11px] text-white/40 font-mono uppercase tracking-wider block mb-1.5">
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
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white bg-surface-2 border border-border placeholder:text-white/20 focus:outline-none focus:border-accent-cyan/50 focus:bg-surface-3 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[11px] text-white/40 font-mono uppercase tracking-wider block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-xl text-sm text-white bg-surface-2 border border-border placeholder:text-white/20 focus:outline-none focus:border-accent-cyan/50 focus:bg-surface-3 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength bar */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="flex-1 h-1 rounded-full transition-all duration-300"
                        style={{
                          background: i <= pwdStrength.score ? pwdStrength.color : 'rgba(255,255,255,0.08)',
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] font-mono" style={{ color: pwdStrength.color }}>
                    {pwdStrength.label}
                  </p>
                </div>
              )}

              {/* Requirements */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  {pwdChecks.map((c) => (
                    <div key={c.label} className="flex items-center gap-2">
                      {c.pass ? (
                        <Check className="w-3 h-3 text-accent-green flex-shrink-0" />
                      ) : (
                        <X className="w-3 h-3 text-white/20 flex-shrink-0" />
                      )}
                      <span className={`text-[11px] ${c.pass ? 'text-white/50' : 'text-white/25'}`}>
                        {c.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="text-[11px] text-white/40 font-mono uppercase tracking-wider block mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPass}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  className={cn(
                    'w-full pl-10 pr-12 py-3 rounded-xl text-sm text-white bg-surface-2 border placeholder:text-white/20 focus:outline-none focus:bg-surface-3 transition-all',
                    !passwordsMatch && confirmPass.length > 0
                      ? 'border-accent-red/50 focus:border-accent-red/70'
                      : 'border-border focus:border-accent-cyan/50'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {!passwordsMatch && confirmPass.length > 0 && (
                <p className="text-[11px] text-accent-red mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Terms agreement */}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <button
                type="button"
                onClick={() => setAgreed((p) => !p)}
                className={cn(
                  'w-4 h-4 rounded flex items-center justify-center border transition-all flex-shrink-0 mt-0.5',
                  agreed ? 'bg-accent-cyan border-accent-cyan' : 'border-border bg-surface-2'
                )}
              >
                {agreed && (
                  <svg viewBox="0 0 10 8" fill="none" className="w-2.5 h-2.5">
                    <path d="M1 4l3 3 5-6" stroke="#0a0a0f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span className="text-xs text-white/35 leading-relaxed">
                I agree to the{' '}
                <a href="#" className="text-accent-cyan/70 hover:text-accent-cyan">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-accent-cyan/70 hover:text-accent-cyan">Privacy Policy</a>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={!isFormValid || submitting || googleLoading}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl',
                'text-sm font-semibold transition-all duration-150',
                isFormValid && !submitting && !googleLoading
                  ? 'bg-accent-cyan text-surface hover:bg-accent-cyan/90 shadow-glow-cyan'
                  : 'bg-surface-3 text-white/30 cursor-not-allowed border border-border'
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Already have account */}
          <p className="text-center text-sm text-white/30 mt-6">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-accent-cyan hover:text-accent-cyan/80 font-medium transition-colors">
              Sign in
            </Link>
          </p>

          {/* Trust badges */}
          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-white/20 font-mono">
            <Shield className="w-3 h-3" />
            <span>Firebase Auth · MongoDB Atlas · Zero data selling</span>
          </div>
        </div>
      </div>
    </div>
  );
}