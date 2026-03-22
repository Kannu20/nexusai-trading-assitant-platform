// ================================================================
// app/api/auth/session/route.ts — POST: create httpOnly session cookie
// ================================================================
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyIdToken, createSessionCookie } from '@/lib/firebase-admin';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken } = body;

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid idToken' }, { status: 400 });
    }

    // 1. Verify the Firebase ID token
    let decoded;
    try {
      decoded = await verifyIdToken(idToken);
    } catch (err: any) {
      return NextResponse.json(
        { error: 'Invalid or expired token', detail: err.message },
        { status: 401 }
      );
    }

    // 2. Create a long-lived Firebase session cookie
    let sessionCookie: string;
    try {
      sessionCookie = await createSessionCookie(idToken, SESSION_DURATION_MS);
    } catch (err: any) {
      return NextResponse.json(
        { error: 'Failed to create session cookie', detail: err.message },
        { status: 500 }
      );
    }

    // 3. Upsert user in MongoDB
    await connectDB();
    const user = await (User as any).upsertFromFirebase(decoded);

    // 4. Set httpOnly session cookie
    cookies().set('__session', sessionCookie, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   SESSION_DURATION_MS / 1000,
      path:     '/',
    });

    return NextResponse.json({ success: true, user: user.toJSON() });

  } catch (err: any) {
    console.error('[POST /api/auth/session]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}