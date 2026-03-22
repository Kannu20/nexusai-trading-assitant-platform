// ================================================================
// app/api/user/profile/route.ts — GET/PATCH: user profile management
// ================================================================
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionCookie } from '@/lib/firebase-admin';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

async function authenticate() {
  const sessionCookie = cookies().get('__session')?.value;
  if (!sessionCookie) return null;
  try {
    return await verifySessionCookie(sessionCookie);
  } catch {
    return null;
  }
}

export async function GET(_req: NextRequest) {
  const decoded = await authenticate();
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const user = await User.findOne({ uid: decoded.uid }).lean();
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  const decoded = await authenticate();
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const allowedFields = ['name', 'preferences'];
  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) updates[key] = body[key];
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  await connectDB();
  const user = await User.findOneAndUpdate(
    { uid: decoded.uid },
    { $set: updates },
    { new: true, runValidators: true }
  ).lean();

  return NextResponse.json({ user });
}