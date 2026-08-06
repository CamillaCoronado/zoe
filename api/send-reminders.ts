// vercel serverless function: dispatches character-voiced push reminders.
// invoked every ~5 min by an external pinger (cron-job.org) with ?secret=CRON_SECRET,
// plus a daily vercel cron backstop (vercel sends Authorization: Bearer CRON_SECRET).
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import webpush from 'web-push';
import { pickLine } from '../src/characterLines.js';
import type { LineCategory } from '../src/characterLines.js';

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')),
  });
}
const db = getFirestore();

webpush.setVapidDetails(
  'mailto:camilla.coronado@gmail.com',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

interface ReminderTask {
  id: string;
  title: string;
  completed: boolean;
  skipped?: boolean;
  remindAt?: string;
  remindersSent?: number;
}

// current wall-clock date + minutes-since-midnight in the user's saved timezone
const nowInTimezone = (tz: string): { today: string; nowMin: number } => {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const parts: Record<string, string> = {};
  for (const p of fmt.formatToParts(new Date())) parts[p.type] = p.value;
  return {
    today: `${parts.year}-${parts.month}-${parts.day}`,
    nowMin: (parseInt(parts.hour, 10) % 24) * 60 + parseInt(parts.minute, 10),
  };
};

const parseHHMM = (hhmm: string): number | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
};

const STAGE_CATEGORY: LineCategory[] = ['reminder', 'nag1', 'nag2'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET;
  const authorized =
    !!secret &&
    (req.query.secret === secret || req.headers.authorization === `Bearer ${secret}`);
  if (!authorized) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const usersSnap = await db.collection('users').where('remindersEnabled', '==', true).get();
  let sent = 0;
  let cleaned = 0;

  for (const userDoc of usersSnap.docs) {
    const userData = userDoc.data();
    const subscription = userData.pushSubscription;
    if (!subscription || !subscription.endpoint) continue;

    const tz = userData.timezone || 'UTC';
    const nagIntervalMin = userData.nagIntervalMin ?? 20;

    let today: string, nowMin: number;
    try {
      ({ today, nowMin } = nowInTimezone(tz));
    } catch {
      ({ today, nowMin } = nowInTimezone('UTC'));
    }

    const entryRef = db.collection('users').doc(userDoc.id).collection('entries').doc(today);

    // claim sends inside a transaction so double-invocations can't double-send:
    // remindersSent is incremented before any push goes out.
    let toSend: { taskId: string; title: string; category: LineCategory }[] = [];
    try {
      toSend = await db.runTransaction(async (tx) => {
        const entrySnap = await tx.get(entryRef);
        if (!entrySnap.exists) return [];
        const tasks: ReminderTask[] = entrySnap.data()?.tasks || [];
        const claims: { taskId: string; title: string; category: LineCategory }[] = [];

        const updated = tasks.map((task) => {
          if (!task.remindAt || task.completed || task.skipped) return task;
          const dueMin = parseHHMM(task.remindAt);
          if (dueMin === null) return task;
          const stage = task.remindersSent ?? 0;
          if (stage > 2) return task;
          const threshold = dueMin + stage * nagIntervalMin;
          if (nowMin < threshold) return task;
          claims.push({ taskId: task.id, title: task.title, category: STAGE_CATEGORY[stage] });
          return { ...task, remindersSent: stage + 1 };
        });

        if (claims.length) tx.update(entryRef, { tasks: updated });
        return claims;
      });
    } catch (err) {
      console.error(`transaction failed for user ${userDoc.id}:`, err);
      continue;
    }

    for (const claim of toSend) {
      const body = pickLine('jarvis', claim.category, claim.title);
      try {
        await webpush.sendNotification(
          subscription,
          JSON.stringify({ title: 'zoe', body, taskId: claim.taskId })
        );
        sent++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // stale subscription — clear it; the client resubscribes on next app open
          await userDoc.ref.update({ pushSubscription: FieldValue.delete() });
          cleaned++;
          break;
        }
        console.error(`push failed for user ${userDoc.id}:`, err);
      }
    }
  }

  return res.status(200).json({ users: usersSnap.size, sent, cleaned });
}
