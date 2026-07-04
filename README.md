# ESCC

ESCC is the events staffing command center for Fresh People. It combines staff management, event scheduling, payroll, client records, and dispatch workflows in one app.

## Live Targets

- Primary app: [https://freshpeople-app.vercel.app](https://freshpeople-app.vercel.app)
- Fallback site: [https://yassinaliyassin.github.io/freshpeople-command-center/](https://yassinaliyassin.github.io/freshpeople-command-center/)
- API health: `/api/health`

## What It Does

- Staff scheduling and assignment
- Event creation and calendar sync
- Invoices, quotes, and statements
- WhatsApp dispatch and booking notifications
- CRM-style client and staff records
- Local fallback storage plus Firestore sync

## Run Locally

```bash
npm install
npm run dev
```

Dev server:
- App: `http://localhost:3000`
- Local API server: `http://localhost:3001`

## Build

```bash
npm run build
npm run preview
```

## Deployment

### Vercel
- Build command: `npm run build`
- Output directory: `dist`
- Health check: `/api/health`

### Netlify
- Static build served from `dist`
- API requests are proxied to the Vercel deployment

### VPS / PM2
- Deployment script: [`deploy-escc.sh`](/home/yassin/Fresh-People-Command-Center/deploy-escc.sh)
- Process name: `escc-backend`
- Local backend port: `3001`

## Project Structure

```text
src/
├── App.tsx
├── components/
├── lib/
├── pages/
├── services/
├── styles/
└── types/
```

## Key Commands

```bash
npm run dev
npm run build
npm run lint
npm run server
```

## Notes

- The app now brands itself as ESCC in the UI and generated documents.
- The local backend exposes `/api/health` for deployment checks.
- Document numbers use the `ESCC-INV` and `ESCC-QTE` prefixes.

