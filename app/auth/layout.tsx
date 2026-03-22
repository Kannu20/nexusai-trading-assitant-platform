// ================================================================
// app/auth/layout.tsx — Clean layout for auth pages (no sidebar)
// ================================================================

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In — NexusAI Investment Platform',
  description: 'Sign in to your NexusAI account',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    // Full screen — completely bypasses the main app layout
    <div className="min-h-screen bg-surface">
      {children}
    </div>
  );
}