// ================================================================
// app/api/user/delete/route.ts — Permanently delete account
// ================================================================
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Activity from '@/lib/models/Activity';
import * as admin from 'firebase-admin';
import { verifySessionCookie } from '@/lib/firebase-admin';

function getAdminAuth() {
  const key = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!key || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PROJECT_ID) return null;
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

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get('__session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let session;
  try { session = await verifySessionCookie (token); }
  catch { return NextResponse.json({ error: 'Session expired' }, { status: 401 }); }

  try {
    // 1. Delete from MongoDB
    const db = await connectDB();
    if (db) {
      await Promise.all([
        User.deleteOne({ uid: session.uid }),
        Activity.deleteMany({ uid: session.uid }),
      ]);
    }

    // 2. Delete from Firebase Auth
    const auth = getAdminAuth();
    if (auth) {
      await auth.deleteUser(session.uid);
    }

    // 3. Clear session cookie
    const res = NextResponse.json({ success: true });
    res.cookies.set('__session', '', { maxAge: 0, path: '/' });
    return res;

  } catch (err: any) {
    console.error('[delete-account]', err.message);
    return NextResponse.json({ error: err.message ?? 'Deletion failed' }, { status: 500 });
  }
}