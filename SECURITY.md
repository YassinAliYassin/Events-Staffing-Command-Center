# Security & Auth Hardening for Fresh People Command Center (FPCC)

**Status:** Hardened for small internal ops team (2026-06). Not enterprise grade.

## Current Protections (Post-Hardening)
- **Write-sensitive routes protected:** `/api/staff` (POST/PATCH/DELETE), `/api/events` (POST/PATCH/DELETE), `/api/dispatch-staff`, Google/Nylas calendar POSTs.
- **Auth mechanism:** JWT tokens issued by `POST /api/login` (or `/api/login` in local dev server).
  - Token in `Authorization: Bearer <token>` header (or `x-admin-token`).
  - Short expiry (~8h). Re-bootstrap as needed.
- **Bootstrap:** `/api/login` accepts `{ "password": "..." }` (or "pin") matching server-only `FPCC_ADMIN_PASSWORD` (or fallback).
- **Local dev server (server.js):** mirrors protections + basic per-IP rate limiting on writes.
- **Input validation:** Basic required fields + simple sanitization on staff/events.
- **Rate limiting:** Basic in-memory (dev server + timesheets); Vercel/Render have platform limits.
- **Secrets:** Never in client bundles for auth. Use server env only. (PINs for frontend UX remain client-visible for demo/internal.)
- **Timesheets companion:** JWT + role enforcement (admin/manager) on approvals/exports/billing; no weak default secret; write rate limits + validation.

**Client-side note:** Frontend (PIN login, dataStore.ts, App.tsx, localStorage) trusts client state for UI switching. API writes now require server token. Hardcoded staff PINs (1111 etc, admin 0000) are in source for demo — change for real use or fetch dynamically. Do not rely on client for access control to sensitive data.

## Risks / Known Limitations (pre & residual)
- **Before:** No auth on any FPCC APIs (full open reads+writes to DB, WhatsApp dispatch, staff/events mutations from anywhere). Client-side only "auth" (PINs in JS bundle + localStorage). Secrets like WhatsApp tokens, iCloud, DB URL only server-side but no call protection. Default/weak secrets possible in related projects.
- **Residual (small-team tradeoffs):** 
  - Frontend PINs and some data in bundle/localStorage (inspectable).
  - Token bootstrap password must be entered manually (prompt in admin view) or set via localStorage; not SSO.
  - No per-user accounts/roles in FPCC DB yet (uses shared admin token).
  - Serverless (Vercel) functions duplicate some logic; no central middleware.
  - Webhook, calendar reads, hermes commands largely public (by design for integrations).
  - No HTTPS enforcement in code (platform does).
  - Supabase anon key in .env (VITE_ = client-exposed by design; use RLS policies server-side).
- Timesheets had JWT but weak default secret, no role enforcement on approvals, open register.

## Setting Secrets (Instructions)
For FPCC (Vercel, Render, local, Docker):

1. **Required for auth hardening:**
   - `FPCC_ADMIN_PASSWORD`: Strong secret/password for `/api/login` (e.g. `openssl rand -base64 24`). 
     - Do **NOT** put in client code or .env committed to git.
     - In Vercel: Project Settings > Environment Variables (Production + Preview).
     - In Render: service env vars.
     - Local: in `.env` (loaded by dotenv in server.js) or export.
     - Fallback if unset: "0000" (for demo; change immediately).
   - `FPCC_JWT_SECRET`: Strong random for signing tokens (e.g. `openssl rand -base64 32`). Falls back to JWT_SECRET or dev value.
     - Set in same places as above. Render generateValue recommended.

2. **Existing secrets (keep protected):**
   - `DATABASE_URL` (Postgres/Neon)
   - `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_WABA_ID`, `WHATSAPP_VERIFY_TOKEN`
   - `ICLOUD_CALENDAR_URL` (or `ICLOUD_EMAIL`/`ICLOUD_APP_PASSWORD`)
   - `CRON_SECRET` (already used for /api/sync-icloud.js)
   - `GOOGLE_SERVICE_ACCOUNT_BASE64`, `NYLAS_*` etc.

3. **For fresh-timesheets (companion):**
   - `JWT_SECRET`: **Required**, no default. Set strong value (Render yaml auto-generates on some deploys).
   - `DATABASE_URL`
   - Default admin user/pass created on first run (admin/admin123) — change immediately via register or DB after first login.
   - Roles: Use 'admin' or 'manager' for approvals access.

Example local .env (FPCC + timesheets):
```
FPCC_ADMIN_PASSWORD=your-strong-random-here-123
FPCC_JWT_SECRET=another-strong-random-here-456
JWT_SECRET=timesheets-strong-random-789
DATABASE_URL=postgres://...
WHATSAPP_ACCESS_TOKEN=...
# etc
```

**After setting:** Re-deploy. On first admin use in FPCC UI, the PIN 0000 login will prompt for the FPCC_ADMIN_PASSWORD to obtain token (stored in localStorage as fpcc_admin_token). Use "Clear site data" or remove key to force re-prompt.

## Usage in Code / Testing
- Obtain token: `curl -X POST https://.../api/login -d '{"password":"..."}'`
- Call protected: `curl -H "Authorization: Bearer $TOKEN" .../api/staff -d '{...}' `
- In frontend fetches: automatically includes if `localStorage.getItem('fpcc_admin_token')` present (see updated components).

## Recommendations for Ops Team
- Rotate secrets periodically.
- Use platform auth (Vercel Password Protection, or Cloudflare) in front of the app for extra layer.
- Monitor logs for 401/429 on APIs.
- For production staff data, consider moving PINs out of frontend (server-validated only) in future iteration.
- Audit DB access; use least-privilege DB user.
- Backup events.db / timesheets.db and Postgres regularly.
- Never commit real .env with tokens.

Report issues internally. Changes made via edits to server.js, api/*.js, lib/auth.js (new), frontend components for token passing, package.json, timesheets server, README updates.

See also render.yaml, DEPLOYMENT.md for env setup.
