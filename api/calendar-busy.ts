// POST { timeMin, timeMax } with a firebase ID token → busy blocks from the
// user's primary google calendar (freeBusy). the client schedules around them.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { FieldValue } from 'firebase-admin/firestore';
import { db, verifyUser, tokenRequest } from './_lib/google.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  const uid = await verifyUser(req);
  if (!uid) return res.status(401).json({ error: 'unauthorized' });

  const { timeMin, timeMax } = req.body || {};
  if (typeof timeMin !== 'string' || typeof timeMax !== 'string') {
    return res.status(400).json({ error: 'timeMin and timeMax required' });
  }

  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();
  const refreshToken = userSnap.data()?.googleCalendar?.refreshToken;
  if (!refreshToken) return res.status(200).json({ disconnected: true, busy: [] });

  const { ok, data } = await tokenRequest({
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  if (!ok) {
    if (data.error === 'invalid_grant') {
      // user revoked access — clear the dead token so the client shows "connect" again
      await userRef.update({ googleCalendar: FieldValue.delete() });
      return res.status(200).json({ disconnected: true, busy: [] });
    }
    console.error('calendar token refresh failed:', data);
    return res.status(502).json({ error: 'token refresh failed' });
  }

  // which calendars count as busy — user-chosen subset, defaulting to primary
  const selectedIds: string[] = userSnap.data()?.googleCalendar?.selectedIds?.length
    ? userSnap.data()!.googleCalendar.selectedIds
    : ['primary'];

  const fbResp = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${data.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ timeMin, timeMax, items: selectedIds.map(id => ({ id })) }),
  });
  const fbData = await fbResp.json();
  if (!fbResp.ok) {
    console.error('freeBusy failed:', fbData);
    return res.status(502).json({ error: 'freeBusy failed' });
  }

  const busy = Object.values(fbData.calendars || {}).flatMap(
    (c) => (c as { busy?: { start: string; end: string }[] }).busy || []
  );
  return res.status(200).json({ busy });
}
