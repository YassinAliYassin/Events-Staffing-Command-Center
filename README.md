# Events-Staffing-Command-Center

Events-Staffing-Command-Center is the event staffing operations app for Fresh People. It combines staff management, event scheduling, payroll, invoices, quotes, WhatsApp dispatch, and calendar sync in one codebase.

## What’s In The Code

- React 19 + TypeScript frontend
- Vite build pipeline
- Local Express backend for development and VPS deployments
- Firestore sync with localStorage fallback
- Supabase-ready data layer
- Google Calendar, iCloud calendar, and WhatsApp integration hooks
- Vercel and Netlify deployment support

## Main URLs

- Primary app: [https://freshpeople-app.vercel.app](https://freshpeople-app.vercel.app)
- Fallback site: [https://yassinaliyassin.github.io/freshpeople-command-center/](https://yassinaliyassin.github.io/freshpeople-command-center/)
- Health check: `/api/health`

## Run Locally

Frontend:

```bash
npm install
npm run dev
```

Backend/local API server:

```bash
npm run server
```

The frontend runs on `http://localhost:3000`.
The local Express server defaults to `http://localhost:3001`.

## Build

```bash
npm run build
npm run preview
npm run lint
```

## Scripts

- `npm run dev`: Vite dev server on port `3000`
- `npm run build`: Production build to `dist`
- `npm run preview`: Preview the production build
- `npm run lint`: TypeScript type-check
- `npm run server`: Start the local Express API server
- `npm run clean`: Remove `dist` and generated `server.js`

## Core Features

- Staff roster and allocation
- Event creation and calendar views
- Invoice and quote generation
- Statement summaries
- WhatsApp staff dispatch
- Booking notifications
- Firebase/Firestore sync
- Local fallback data store
- Calendar import from iCloud and Google integrations

## API Surface

### Local Express server

- `GET /api/health`
- `GET /api/calendar?format=json`
- `GET /api/calendar`
- `POST /api/calendar/apple`
- `POST /api/calendar/google`
- `POST /api/dispatch-staff`

### Vercel serverless routes

The production app uses the `api/*.js` routes in this repo.

## Deployment

### Vercel

- Build command: `npm run build`
- Output directory: `dist`
- Current primary target: [https://freshpeople-app.vercel.app](https://freshpeople-app.vercel.app)

### Netlify

- Serves the static build from `dist`
- Proxies `/api/*` traffic to the Vercel deployment

### VPS / PM2

- Deployment script: [`deploy-escc.sh`](/home/yassin/Fresh-People-Command-Center/deploy-escc.sh)
- Backend process name: `escc-backend`
- Backend port: `3001`

## Environment Variables

Useful variables appear in [`.env.example`](/home/yassin/Fresh-People-Command-Center/.env.example):

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `GOOGLE_SERVICE_ACCOUNT_BASE64`
- `VITE_GEMINI_API_KEY`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `DATABASE_URL`
- `WHATSAPP_ACCESS_TOKEN`
- `ICLOUD_CALENDAR_URL`
- `CRON_SECRET`

## Project Structure

```text
src/
├── App.tsx
├── components/
├── pages/
├── services/
├── lib/
├── styles/
└── types/

api/
├── calendar.js
├── dispatch-staff.js
├── health.js
└── ...

functions/
├── src/
└── lib/
```

## Notes

- The browser title is set to `ESCC`.
- Document prefixes use `ESCC-INV` and `ESCC-QTE`.
- The app boots Firestore sync on load.
- The local backend mirrors key production API behaviors for development.

