// ================================================================
// app/api/user/activity/route.ts — GET user activity log
// ================================================================
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

import connectDB from '@/lib/mongodb';
import Activity from '@/lib/models/Activity';
import { verifySessionCookie } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('__session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let session;
  try { session = await verifySessionCookie(token); }
  catch { return NextResponse.json({ error: 'Session expired' }, { status: 401 }); }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50);

  try {
    const db = await connectDB();
    if (!db) {
      // Return mock activity if MongoDB not configured
      return NextResponse.json({
        activities: MOCK_ACTIVITIES.map((a, i) => ({ ...a, uid: session.uid, id: `mock-${i}` })),
        total: MOCK_ACTIVITIES.length,
        usingMock: true,
      });
    }

    const [activities, total] = await Promise.all([
      Activity.find({ uid: session.uid })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      Activity.countDocuments({ uid: session.uid }),
    ]);

    return NextResponse.json({ activities, total });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── Mock fallback when MongoDB not configured ─────────────────────
const MOCK_ACTIVITIES = [
  { action: 'Signed in successfully',       category: 'auth',      icon: '🔐', device: 'Chrome · Web',   createdAt: new Date(Date.now() - 2 * 60000) },
  { action: 'Viewed dashboard',             category: 'market',    icon: '📊', device: 'Chrome · Web',   createdAt: new Date(Date.now() - 5 * 60000) },
  { action: 'AI Insight query — Gold',      category: 'ai',        icon: '🧠', device: 'Chrome · Web',   createdAt: new Date(Date.now() - 60 * 60000) },
  { action: 'Portfolio viewed',             category: 'portfolio', icon: '💼', device: 'Chrome · Web',   createdAt: new Date(Date.now() - 2 * 3600000) },
  { action: 'Price alert triggered — Gold', category: 'alert',     icon: '🔔', device: 'System',         createdAt: new Date(Date.now() - 5 * 3600000) },
  { action: 'Simulator: crash -25% run',   category: 'simulator', icon: '🧪', device: 'Chrome · Web',   createdAt: new Date(Date.now() - 86400000) },
  { action: 'Account created',              category: 'auth',      icon: '🎉', device: 'Chrome · Web',   createdAt: new Date(Date.now() - 7 * 86400000) },
];