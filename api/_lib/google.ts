// shared helpers for the google calendar oauth endpoints.
// files under api/_lib are not deployed as functions (vercel underscore convention).
import type { VercelRequest } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { createHmac, timingSafeEqual } from 'crypto';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}
export const db = getFirestore();

export const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

// firebase ID tokens are RS256 JWTs signed by securetoken.google.com — verify
// directly with jose instead of firebase-admin/auth (whose jwks-rsa dep does
// require() of ESM-only jose and crashes the vercel function runtime)
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

// verify the firebase ID token from an Authorization: Bearer header; returns uid or null
export const verifyUser = async (req: VercelRequest): Promise<string | null> => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    const { payload } = await jwtVerify(header.slice(7), FIREBASE_JWKS, {
      issuer: `https://securetoken.google.com/${serviceAccount.project_id}`,
      audience: serviceAccount.project_id,
    });
    return typeof payload.sub === 'string' && payload.sub.length > 0 ? payload.sub : null;
  } catch {
    return null;
  }
};

// oauth `state` that round-trips through google: uid + timestamp, HMAC-signed with CRON_SECRET
const stateSig = (payload: string) =>
  createHmac('sha256', process.env.CRON_SECRET || '').update(payload).digest('hex');

export const signState = (uid: string): string => {
  const ts = Date.now().toString();
  return `${uid}.${ts}.${stateSig(`${uid}.${ts}`)}`;
};

export const verifyState = (state: string): string | null => {
  const [uid, ts, sig] = state.split('.');
  if (!uid || !ts || !sig) return null;
  const expected = stateSig(`${uid}.${ts}`);
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  if (Date.now() - parseInt(ts, 10) > 10 * 60 * 1000) return null;
  return uid;
};

export const baseUrl = (req: VercelRequest): string => {
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  return `${proto}://${req.headers.host}`;
};

export const redirectUri = (req: VercelRequest): string => `${baseUrl(req)}/api/calendar-callback`;

export const tokenRequest = async (params: Record<string, string>) => {
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
      ...params,
    }),
  });
  const data = await resp.json();
  return { ok: resp.ok, data };
};
