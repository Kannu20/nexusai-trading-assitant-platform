// ================================================================
// app/api/user/export/route.ts — Export all user data as JSON
// ================================================================
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
// import { verifySession } from '@/auth/session';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Activity from '@/lib/models/Activity';
import { verifySessionCookie } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('__session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let session;
  try { session = await verifySessionCookie(token); }
  catch { return NextResponse.json({ error: 'Session expired' }, { status: 401 }); }

  try {
    const db = await connectDB();

    let profile = null;
    let activities: unknown[] = [];

    if (db) {
      [profile, activities] = await Promise.all([
        User.findOne({ uid: session.uid }).lean(),
        Activity.find({ uid: session.uid }).sort({ createdAt: -1 }).lean(),
      ]);
    }

    const exportData = {
      exportedAt:  new Date().toISOString(),
      profile:     profile ?? { uid: session.uid, email: session.email, name: session.name },
      activities,
      metadata: {
        platform: 'NexusAI Investment Intelligence Platform',
        version:  '1.0.0',
      },
    };

    const filename = `nexusai-data-${session.uid.slice(0, 8)}-${Date.now()}.json`;

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type':        'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}