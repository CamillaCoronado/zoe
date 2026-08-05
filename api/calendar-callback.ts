// google redirects here after consent. verifies state, exchanges the code for
// tokens, stores the refresh token on the user doc, bounces back to the app.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, verifyState, redirectUri, tokenRequest } from './_lib/google';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state, error } = req.query;
  if (error || !code || !state) return res.redirect(302, '/?calendar=error');

  const uid = verifyState(String(state));
  if (!uid) return res.redirect(302, '/?calendar=error');

  const { ok, data } = await tokenRequest({
    code: String(code),
    redirect_uri: redirectUri(req),
    grant_type: 'authorization_code',
  });
  if (!ok || !data.refresh_token) {
    console.error('calendar token exchange failed:', data);
    return res.redirect(302, '/?calendar=error');
  }

  await db.collection('users').doc(uid).update({
    googleCalendar: { refreshToken: data.refresh_token, connectedAt: Date.now() },
  });
  return res.redirect(302, '/?calendar=connected');
}
