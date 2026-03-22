'use client';

// ================================================================
// components/ClientLayout.tsx — App shell with auth-awareness
// ================================================================

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AuthGuard from './AuthGuard';

// Auth pages get no sidebar/navbar — they have their own full-screen layout
const AUTH_PATHS = ['/auth/signin', '/auth/signup', '/auth/forgot-password'];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen]           = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Auth pages render as-is (no chrome)
  const isAuthPage = AUTH_PATHS.some((p) => pathname?.startsWith(p));
  if (isAuthPage) return <>{children}</>;

  return (
    <AuthGuard>
      <div className="flex h-screen bg-surface overflow-hidden">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar
          open={sidebarOpen}
          collapsed={sidebarCollapsed}
          onCollapse={() => setSidebarCollapsed((p) => !p)}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex flex-col flex-1 min-w-0 transition-all duration-300">
          <Navbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 animate-fade-in">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}