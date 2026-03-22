'use client';

// ================================================================
// app/auth/forgot-password/page.tsx — Password reset page
// ================================================================

import { useState } from 'react';
import Link from 'next/link';
import { Mail, TrendingUp, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { resetPassword } from '@/lib/firebase';
import { cn } from '@/lib/utils';

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading) return;
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      const code = err.code as string;
      if (code === 'auth/user-not-found') {
        // Don't reveal if the email exists (security best practice)
        setSuccess(true);
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid bg-grid opacity-50" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-accent-cyan/5 blur-3xl" />

      <div className="relative w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-cyan to-blue-600 flex items-center justify-center shadow-glow-cyan">
              <TrendingUp className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold text-white font-display">NexusAI</span>
          </div>
        </div>

        <div className="bg-surface-2 border border-border rounded-2xl p-8 shadow-card">
          {success ? (
            /* ── Success state ── */
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-accent-green/15 border border-accent-green/25 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-7 h-7 text-accent-green" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2 font-display">Check your inbox</h2>
              <p className="text-sm text-white/50 leading-relaxed mb-6">
                If an account exists for <span className="text-white/80">{email}</span>,
                you'll receive a password reset link within a few minutes.
              </p>
              <p className="text-xs text-white/30 mb-6">
                Don't see the email? Check your spam folder.
              </p>
              <Link
                href="/auth/signin"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-surface-3 border border-border text-white/60 hover:text-white hover:border-border-bright transition-all text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="mb-7">
                <h2 className="text-2xl font-bold text-white font-display">Reset password</h2>
                <p className="text-white/40 text-sm mt-1.5">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2.5 p-3.5 mb-5 rounded-xl bg-accent-red/10 border border-accent-red/25">
                  <AlertCircle className="w-4 h-4 text-accent-red flex-shrink-0" />
                  <p className="text-sm text-accent-red/90">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-[11px] text-white/40 font-mono uppercase tracking-wider block mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoFocus
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white bg-surface-3 border border-border placeholder:text-white/20 focus:outline-none focus:border-accent-cyan/50 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!email || loading}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold transition-all',
                    email && !loading
                      ? 'bg-accent-cyan text-surface hover:bg-accent-cyan/90 shadow-glow-cyan'
                      : 'bg-surface-3 text-white/30 cursor-not-allowed border border-border'
                  )}
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Sending...</>
                    : 'Send reset link'
                  }
                </button>
              </form>

              <Link
                href="/auth/signin"
                className="flex items-center justify-center gap-2 mt-5 text-sm text-white/30 hover:text-white/60 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}