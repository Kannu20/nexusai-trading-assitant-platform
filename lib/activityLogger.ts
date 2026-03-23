// ================================================================
// lib/activityLogger.ts — Log user actions to MongoDB
// ================================================================

import connectDB from './mongodb';
import Activity from './models/Activity';
import type { IActivity } from './models/Activity';

export interface ActivityInput {
  uid:       string;
  action:    string;
  category?: 'auth' | 'portfolio' | 'ai' | 'alert' | 'simulator' | 'account' | 'market';
  icon?:     string;
  device?:   string;
  ip?:       string;
  metadata?: Record<string, unknown>;
}

export async function logActivity(input: ActivityInput): Promise<void> {
  try {
    const db = await connectDB();
    if (!db) return; // MongoDB not configured — silently skip
    await Activity.create(input);
  } catch (err: any) {
    // Non-fatal — never let logging break the main flow
    console.warn('[activityLogger] Failed to log activity:', err.message);
  }
}