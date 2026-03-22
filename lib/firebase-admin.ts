// ================================================================
// lib/firebase-admin.ts — Firebase Admin SDK (server-only, lazy-init)
// ================================================================

import * as admin from 'firebase-admin';

// Lazy singleton — only initializes on first call, not at import time.
// This prevents build-time crashes when env vars aren't set.
function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) return admin.app();

  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PROJECT_ID) {
    throw new Error(
      'Missing Firebase Admin credentials. Ensure FIREBASE_PROJECT_ID, ' +
      'FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in .env.local'
    );
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

// ── Exported helpers (lazy — safe to import anywhere) ────────────

export async function verifyIdToken(idToken: string) {
  return admin.auth(getAdminApp()).verifyIdToken(idToken, true);
}

export async function createSessionCookie(idToken: string, expiresInMs: number): Promise<string> {
  return admin.auth(getAdminApp()).createSessionCookie(idToken, { expiresIn: expiresInMs });
}

export async function verifySessionCookie(sessionCookie: string) {
  return admin.auth(getAdminApp()).verifySessionCookie(sessionCookie, true);
}

export async function revokeRefreshTokens(uid: string): Promise<void> {
  await admin.auth(getAdminApp()).revokeRefreshTokens(uid);
}