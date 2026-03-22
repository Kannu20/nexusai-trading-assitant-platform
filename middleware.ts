// ================================================================
// middleware.ts — Next.js Edge Middleware for route protection
// ================================================================
// Runs before every request. Redirects:
//   - Unauthenticated users away from protected routes → /auth/signin
//   - Authenticated users away from auth pages → /dashboard
//
// NOTE: Only checks for the existence of __session cookie here
// (Edge middleware can't use Firebase Admin for verification).
// Full token verification happens inside API route handlers.
// ================================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/markets',
  '/portfolio',
  '/ai-insights',
  '/simulator',
  '/alerts',
  '/api/user',
];

// Routes only for unauthenticated users
const AUTH_PREFIXES = [
  '/auth/signin',
  '/auth/signup',
];

// API routes that are always public
const PUBLIC_API_PREFIXES = [
  '/api/auth/session',
  '/api/auth/signout',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('__session');
  const hasSession = Boolean(sessionCookie?.value);

  // ── Let public API routes pass through ──────────────────────
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ── Redirect root to dashboard or signin ────────────────────
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(hasSession ? '/dashboard' : '/auth/signin', request.url)
    );
  }

  // ── Protect app routes ───────────────────────────────────────
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtected && !hasSession) {
    const signinUrl = new URL('/auth/signin', request.url);
    signinUrl.searchParams.set('redirect', pathname);   // preserve intended destination
    return NextResponse.redirect(signinUrl);
  }

  // ── Redirect logged-in users away from auth pages ───────────
  const isAuthPage = AUTH_PREFIXES.some((p) => pathname.startsWith(p));
  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// ── Matcher: which paths the middleware runs on ─────────────────
export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Public files with extensions (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf)$).*)',
  ],
};