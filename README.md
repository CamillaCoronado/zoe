# zoe

## reminders (web push) setup

tasks can carry a reminder time (`remindAt`). a serverless function ([api/send-reminders.ts](api/send-reminders.ts)) sends character-voiced push notifications when reminders come due, with up to 2 escalating follow-ups. all copy is pre-written in [src/characterLines.ts](src/characterLines.ts) — no LLM calls.

### environment variables

generate VAPID keys once with `npx web-push generate-vapid-keys`, then set:

| variable | where | value |
| --- | --- | --- |
| `VITE_VAPID_PUBLIC_KEY` | vercel (all envs) + `.env.local` | VAPID public key (safe to expose) |
| `VAPID_PUBLIC_KEY` | vercel (server) | same public key |
| `VAPID_PRIVATE_KEY` | vercel (server) | VAPID private key — keep secret |
| `CRON_SECRET` | vercel (server) | any long random string; authorizes calls to `/api/send-reminders` |
| `FIREBASE_SERVICE_ACCOUNT` | vercel (server) | the full firebase service account JSON (firebase console → project settings → service accounts → generate new private key), pasted as one line |

local dev values go in `.env.local` (gitignored via `*.local`).

### cron cadence

vercel hobby crons only run daily, so the `vercel.json` cron (12:00 UTC) is just a backstop. for minute-granularity reminders, point a free external pinger (e.g. [cron-job.org](https://cron-job.org)) at:

```
https://zoe-rho.vercel.app/api/send-reminders?secret=<CRON_SECRET>
```

every 5 minutes. reminders fire within ~5 min of their set time. the endpoint is idempotent — `remindersSent` is claimed in a firestore transaction before any push goes out, so overlapping invocations can't double-send.

### google calendar integration

jarvis auto-schedules reminder times client-side; when google calendar is connected he schedules around your busy events (primary calendar only, read-only, via the freeBusy API). oauth runs server-side with a stored refresh token — no client popups, works in the iOS PWA.

one-time setup in [google cloud console](https://console.cloud.google.com) (same project as firebase, `zoe-ab4cb`):

1. **enable the google calendar API** (APIs & services → library).
2. **create an OAuth 2.0 client ID** (APIs & services → credentials → create credentials → OAuth client ID → web application) with authorized redirect URIs:
   - `https://zoe-rho.vercel.app/api/calendar-callback`
   - `http://localhost:3000/api/calendar-callback` (for `vercel dev`)
3. set `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` in vercel env vars (and `.env.local` for local dev).

then settings → reminders → "connect google calendar". disconnect deletes the stored refresh token; to fully revoke, use [google account permissions](https://myaccount.google.com/permissions). connecting only works where api routes run (deployed app or `vercel dev`, not plain `npm run dev`).

### iOS notes

push on iOS (16.4+) only works when zoe is installed to the home screen (share → add to home screen) and opened from there — apple does not allow web push from a plain safari tab. the settings view detects this and shows instructions instead of the enable button. iOS also silently expires subscriptions; the app re-checks and resubscribes on every open.

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
