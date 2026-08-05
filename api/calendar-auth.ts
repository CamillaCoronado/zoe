// POST with a firebase ID token → returns the google consent URL to redirect to.
// (POST + header keeps the ID token out of URLs/logs.)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyUser, signState, redirectUri, CALENDAR_SCOPE } from './_lib/google';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  const uid = await verifyUser(req);
  if (!uid) return res.status(401).json({ error: 'unauthorized' });
  if (!process.env.GOOGLE_OAUTH_CLIENT_ID || !process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
    return res.status(500).json({ error: 'google oauth env vars not configured' });
  }

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
    redirect_uri: redirectUri(req),
    response_type: 'code',
    scope: CALENDAR_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state: signState(uid),
  });
  return res.status(200).json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
}
