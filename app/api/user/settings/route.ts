// ================================================================
// app/api/user/settings/route.ts — GET / PATCH all settings
// ================================================================
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { logActivity } from '@/lib/activityLogger';
import { verifySessionCookie } from '@/lib/firebase-admin';

// Default settings returned when MongoDB is not configured
const DEFAULTS = {
  preferences: {
    currency: 'USD', theme: 'dark', riskProfile: 'moderate',
    language: 'en', timezone: 'UTC', dateFormat: 'MM/DD/YYYY',
    numberFormat: 'en-US', defaultTimeframe: '1M', compactNumbers: false,
  },
  apiKeys: {
    finnhub: '', openrouter: '',
    openrouterModel: 'meta-llama/llama-3.1-8b-instruct:free',
  },
  notifications: {
    emailEnabled: true, pushEnabled: true, priceAlerts: true,
    riskAlerts: true, newsAlerts: false, weeklyDigest: false,
    priceThreshold: 2,
  },
  dashboard: {
    showTicker: true, showMiniCharts: true, autoRefresh: true,
    refreshInterval: 30, defaultTab: 'overview',
    pinnedAssets: ['gold','aapl','nvda'],
  },
  privacy: {
    analyticsEnabled: true, crashReporting: true, showOnLeaderboard: false,
  },
};

// ── GET: return full settings ─────────────────────────────────────
export async function GET(req: NextRequest) {
  const token = req.cookies.get('__session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let session;
  try { session = await verifySessionCookie(token); }
  catch { return NextResponse.json({ error: 'Session expired' }, { status: 401 }); }

  try {
    const db = await connectDB();
    if (!db) {
      // Return defaults if MongoDB not configured
      return NextResponse.json({
        settings: { ...DEFAULTS, uid: session.uid, usingDefaults: true },
      });
    }

    const user = await User.findOne({ uid: session.uid }).lean() as any;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Merge user settings with defaults (fill missing fields)
    const settings = {
      preferences:   { ...DEFAULTS.preferences,   ...(user.preferences   ?? {}) },
      apiKeys:       { ...DEFAULTS.apiKeys,        ...(user.apiKeys       ?? {}) },
      notifications: { ...DEFAULTS.notifications, ...(user.notifications ?? {}) },
      dashboard:     { ...DEFAULTS.dashboard,      ...(user.dashboard     ?? {}) },
      privacy:       { ...DEFAULTS.privacy,        ...(user.privacy       ?? {}) },
    };

    // Mask API keys — show only last 6 chars
    if (settings.apiKeys.finnhub && settings.apiKeys.finnhub.length > 6) {
      settings.apiKeys.finnhub = '••••••' + settings.apiKeys.finnhub.slice(-6);
    }
    if (settings.apiKeys.openrouter && settings.apiKeys.openrouter.length > 6) {
      settings.apiKeys.openrouter = '••••••' + settings.apiKeys.openrouter.slice(-6);
    }

    return NextResponse.json({ settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── PATCH: save one or more settings sections ─────────────────────
export async function PATCH(req: NextRequest) {
  const token = req.cookies.get('__session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let session;
  try { session = await verifySessionCookie(token); }
  catch { return NextResponse.json({ error: 'Session expired' }, { status: 401 }); }

  const body = await req.json().catch(() => ({}));

  // Whitelist of allowed top-level sections and their fields
  const ALLOWED_SECTIONS: Record<string, string[]> = {
    preferences:   ['currency','theme','riskProfile','language','timezone','dateFormat','numberFormat','defaultTimeframe','compactNumbers'],
    apiKeys:       ['finnhub','openrouter','openrouterModel'],
    notifications: ['emailEnabled','pushEnabled','priceAlerts','riskAlerts','newsAlerts','weeklyDigest','priceThreshold'],
    dashboard:     ['showTicker','showMiniCharts','autoRefresh','refreshInterval','defaultTab','pinnedAssets'],
    privacy:       ['analyticsEnabled','crashReporting','showOnLeaderboard'],
    // Also allow top-level name change
    name:          [],
  };

  // Build the MongoDB $set update object
  const updates: Record<string, unknown> = {};
  let changeDescription = '';

  for (const [section, value] of Object.entries(body)) {
    if (!ALLOWED_SECTIONS[section]) continue;

    if (section === 'name' && typeof value === 'string') {
      updates.name = value.trim().slice(0, 60);
      changeDescription = 'Updated display name';
      continue;
    }

    if (typeof value === 'object' && value !== null) {
      // Filter to allowed fields only
      const allowed  = ALLOWED_SECTIONS[section];
      const filtered = Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .filter(([k]) => allowed.includes(k))
      );

      // For API keys: only update if the value is NOT masked (not starting with ••)
      if (section === 'apiKeys') {
        for (const [k, v] of Object.entries(filtered)) {
          if (typeof v === 'string' && v.startsWith('••')) {
            delete filtered[k]; // skip masked values — user didn't change them
          }
        }
      }

      for (const [field, fieldValue] of Object.entries(filtered)) {
        updates[`${section}.${field}`] = fieldValue;
      }

      changeDescription = changeDescription || `Updated ${section} settings`;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  try {
    const db = await connectDB();
    if (!db) {
      // No MongoDB — acknowledge but can't persist
      return NextResponse.json({
        success: true,
        persisted: false,
        message: 'Settings saved locally (MongoDB not configured — add MONGODB_URI for permanent storage)',
      });
    }

    const updated = await User.findOneAndUpdate(
      { uid: session.uid },
      { $set: updates },
      { new: true, runValidators: false }
    ).lean() as any;

    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Log the change
    logActivity({ uid: session.uid, action: changeDescription, category: 'account', icon: '⚙️' });

    // Return masked settings
    const responseSettings = {
      preferences:   { ...DEFAULTS.preferences,   ...(updated.preferences   ?? {}) },
      apiKeys:       { ...DEFAULTS.apiKeys,        ...(updated.apiKeys       ?? {}) },
      notifications: { ...DEFAULTS.notifications, ...(updated.notifications ?? {}) },
      dashboard:     { ...DEFAULTS.dashboard,      ...(updated.dashboard     ?? {}) },
      privacy:       { ...DEFAULTS.privacy,        ...(updated.privacy       ?? {}) },
    };

    // Mask API keys in response
    if (responseSettings.apiKeys.finnhub && responseSettings.apiKeys.finnhub.length > 6) {
      responseSettings.apiKeys.finnhub = '••••••' + responseSettings.apiKeys.finnhub.slice(-6);
    }
    if (responseSettings.apiKeys.openrouter && responseSettings.apiKeys.openrouter.length > 6) {
      responseSettings.apiKeys.openrouter = '••••••' + responseSettings.apiKeys.openrouter.slice(-6);
    }

    return NextResponse.json({ success: true, persisted: true, settings: responseSettings });

  } catch (err: any) {
    console.error('[PATCH /api/user/settings]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function verifySession(token: string): any {
    throw new Error('Function not implemented.');
}
