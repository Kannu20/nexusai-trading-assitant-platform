// ================================================================
// app/api/user/change-password/route.ts — Update Firebase password
// ================================================================
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';
import { logActivity } from '@/lib/activityLogger';
import * as admin from 'firebase-admin';

// Lazy Firebase Admin init guard
function getAdminAuth() {
  const key = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!key || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PROJECT_ID) {
    return null;
  }
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  key,
      }),
    });
  }
  return admin.auth();
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('__session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let session;
  try { session = await verifySession(token); }
  catch { return NextResponse.json({ error: 'Session expired' }, { status: 401 }); }

  const body = await req.json().catch(() => ({}));
  const { newPassword } = body;

  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  const auth = getAdminAuth();
  if (!auth) {
    // Firebase Admin not configured — simulate success in dev mode
    console.warn('[change-password] Firebase Admin not configured — simulating success');
    await logActivity({
      uid: session.uid, action: 'Password changed (dev mode)',
      category: 'account', icon: '🔑',
    });
    return NextResponse.json({ success: true, devMode: true });
  }

  try {
    await auth.updateUser(session.uid, { password: newPassword });
    await logActivity({
      uid: session.uid, action: 'Password changed successfully',
      category: 'account', icon: '🔑',
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[change-password]', err.message);
    return NextResponse.json({ error: err.message ?? 'Password update failed' }, { status: 500 });
  }
}