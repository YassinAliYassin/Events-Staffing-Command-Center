# Events-Staffing-Command-Center

**Company:** [ESCC](https://github.com/YassinAliYassin/escc) · **Project:** [ESCC board](https://github.com/users/YassinAliYassin/projects/2)

Events-Staffing-Command-Center is the **Command Center shell** for ESCC — the multi-agent staffing operations platform for Fresh People / African event talent. Staff, calendar, payroll, billing, CRM, and dispatch each map to a dedicated agent repository under one company project.

See [AGENTS.md](./AGENTS.md) for the full section → agent → repo map.

## What’s In The Code

- React 19 + TypeScript frontend
- Vite build pipeline
- Local Express backend for development and VPS deployments
- Firestore sync with **localStorage-first** fallback (works offline)
- Supabase-ready data layer
- Google Calendar, iCloud calendar, and WhatsApp integration hooks
- Vercel and Netlify deployment support

## Main URLs

- Primary app: [https://freshpeople-app.vercel.app](https://freshpeople-app.vercel.app)
- GitHub Pages: [https://yassinaliyassin.github.io/Events-Staffing-Command-Center/](https://yassinaliyassin.github.io/Events-Staffing-Command-Center/)
- Health check: `/api/health`

## Run Locally

```bash
npm install

# Terminal 1 — API (port 3001)
npm run server

# Terminal 2 — frontend (port 3000, proxies /api → 3001)
npm run dev
```

Open **http://localhost:3000**

### Login PINs

| Role | PIN |
|------|-----|
| Admin | `0000` |
| Amara Diallo | `1111` |
| Themba Nkosi | `2222` |
| Priya Moodley | `3333` |
| Lerato Khumalo | `4444` |
| Sipho Dlamini | `5555` |
| Naledi Tau | `6666` |

## Build

```bash
npm run build
npm run preview
npm run lint
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server on port `3000` |
| `npm run build` | Production build to `dist` |
| `npm run preview` | Preview the production build |
| `npm run lint` | TypeScript type-check |
| `npm run server` | Local Express API on port `3001` |
| `npm run clean` | Remove `dist` only |

## Core Features

- **Staff roster** — add / edit / remove (persisted to localStorage + optional Firestore)
- **Clock in / out timesheets** — persisted across reloads
- **Event creation and calendar views** — with Apple / Google sync buttons
- **Invoice and quote generation** — status updates and quote→invoice conversion
- **Statement summaries** by client
- **WhatsApp staff dispatch** (live on Vercel with env; mock locally)
- **Payroll summary** from event assignments (local-first)
- **CRM clients view** with pipeline-style filters
- **Firebase/Firestore sync** when configured; otherwise full offline mode
- **Calendar import** — live iCloud feed, or demo events when the feed is unavailable

## API Surface

### Local Express server

- `GET /api/health`
- `GET /api/calendar?format=json`
- `GET /api/calendar`
- `GET /api/calendar/apple`
- `GET /api/calendar/google`
- `POST /api/calendar/nylas` (mock locally)
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

### GitHub Pages

- Workflow sets `VITE_BASE=/Events-Staffing-Command-Center/` so asset paths resolve on the project site
- SPA is static-only on Pages (API calls need a live backend or Vercel proxy)

### VPS / PM2

- Deployment script: `deploy-escc.sh`
- Backend process name: `escc-backend`
- Backend port: `3001`

## Environment Variables

See [`.env.example`](./.env.example):

- `VITE_FIREBASE_*` — Firestore client config
- `GOOGLE_SERVICE_ACCOUNT_BASE64` — Google Calendar service account
- `VITE_GEMINI_API_KEY` / `VITE_OPENROUTER_API_KEY` — AI helpers
- `DATABASE_URL` — Postgres for production WhatsApp dispatch
- `WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID`
- `ICLOUD_CALENDAR_URL` — public iCloud calendar feed
- `CRON_SECRET`

When `ICLOUD_CALENDAR_URL` fails or is missing, `/api/calendar/apple` returns **demo events** so the Calendar UI still works.

## Multi-agent company layout

| Section | Agent | Repository |
|---------|--------|------------|
| Dashboard | Executive Intelligence | [escc-executive-agent](https://github.com/YassinAliYassin/escc-executive-agent) |
| Roster / Add Staff | Staff | [escc-staff-agent](https://github.com/YassinAliYassin/escc-staff-agent) |
| Timesheets | Timesheet | [escc-timesheet-agent](https://github.com/YassinAliYassin/escc-timesheet-agent) |
| Calendar | Calendar | [escc-calendar-agent](https://github.com/YassinAliYassin/escc-calendar-agent) |
| Docs & Billing | Billing | [escc-billing-agent](https://github.com/YassinAliYassin/escc-billing-agent) |
| Clients | CRM | [escc-crm-agent](https://github.com/YassinAliYassin/escc-crm-agent) |
| Payroll | Finance | [escc-finance-agent](https://github.com/YassinAliYassin/escc-finance-agent) |
| WhatsApp | Dispatch | [escc-dispatch-agent](https://github.com/YassinAliYassin/escc-dispatch-agent) |

Hub + contracts: [github.com/YassinAliYassin/escc](https://github.com/YassinAliYassin/escc)

## Project Structure

```
src/
├── App.tsx              # Shell (login, admin tabs, staff clock)
├── agents/catalog.ts    # ESCC section → agent map
├── components/          # CRM, cards, command UI
├── pages/               # Payroll and route-level views
├── services/
│   ├── dataStore.ts     # localStorage-first CRUD
│   ├── firebaseService.ts
│   └── escc-core.ts     # calendar + WhatsApp client API
api/                     # Vercel serverless handlers
lib/                     # Shared iCal + demo calendar helpers
server.js                # Local Express API
AGENTS.md                # Agent ownership matrix
```

## Notes

- Browser title / company: `ESCC`
- Document prefixes: `ESCC-INV`, `ESCC-QTE`
- App boots Firestore sync on load (no-ops when Firebase is not configured)
- Local backend mirrors key production API behaviors for development
- Each tab shows the owning agent package + repo link in the admin shell
