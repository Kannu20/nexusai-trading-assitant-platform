// ================================================================
// app/api/auth/signout/route.ts — POST: sign out, clear cookie
// ================================================================
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionCookie, revokeRefreshTokens } from '@/lib/firebase-admin';

export async function POST(_req: NextRequest) {
  const sessionCookie = cookies().get('__session')?.value;

  if (sessionCookie) {
    try {
      const decoded = await verifySessionCookie(sessionCookie);
      await revokeRefreshTokens(decoded.uid);
    } catch {
      // Cookie may already be invalid — proceed with clearing it
    }
  }

  cookies().delete('__session');
  return NextResponse.json({ success: true });
}