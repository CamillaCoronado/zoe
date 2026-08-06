// POST with a firebase ID token → the user's google calendars (id, name, primary
// flag) so the client can let them choose which ones count as busy.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { FieldValue } from 'firebase-admin/firestore';
import { db, verifyUser, tokenRequest } from './_lib/google.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  const uid = await verifyUser(req);
  if (!uid) return res.status(401).json({ error: 'unauthorized' });

  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();
  const refreshToken = userSnap.data()?.googleCalendar?.refreshToken;
  if (!refreshToken) return res.status(200).json({ disconnected: true, calendars: [] });

  const { ok, data } = await tokenRequest({
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  if (!ok) {
    if (data.error === 'invalid_grant') {
      await userRef.update({ googleCalendar: FieldValue.delete() });
      return res.status(200).json({ disconnected: true, calendars: [] });
    }
    console.error('calendar token refresh failed:', data);
    return res.status(502).json({ error: 'token refresh failed' });
  }

  const listResp = await fetch(
    'https://www.googleapis.com/calendar/v3/users/me/calendarList?fields=items(id,summary,primary)',
    { headers: { Authorization: `Bearer ${data.access_token}` } }
  );
  const listData = await listResp.json();
  if (!listResp.ok) {
    console.error('calendarList failed:', listData);
    return res.status(502).json({ error: 'calendarList failed' });
  }

  const calendars = (listData.items || []).map((c: { id: string; summary?: string; primary?: boolean }) => ({
    id: c.id,
    summary: c.summary || c.id,
    primary: c.primary === true,
  }));
  return res.status(200).json({ calendars });
}
