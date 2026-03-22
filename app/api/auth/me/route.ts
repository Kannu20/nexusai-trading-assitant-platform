// ================================================================
// app/api/auth/me/route.ts — GET: return current user from session
// ================================================================
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionCookie } from '@/lib/firebase-admin';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET(_req: NextRequest) {
  const sessionCookie = cookies().get('__session')?.value;

  if (!sessionCookie) {
    return NextResponse.json({ error: 'No session' }, { status: 401 });
  }

  try {
    const decoded = await verifySessionCookie(sessionCookie);

    await connectDB();
    const user = await User.findOne({ uid: decoded.uid }).lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });

  } catch (err: any) {
    cookies().delete('__session');
    return NextResponse.json(
      { error: 'Session expired', detail: err.message },
      { status: 401 }
    );
  }
}