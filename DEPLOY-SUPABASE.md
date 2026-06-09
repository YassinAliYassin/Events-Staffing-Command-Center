#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────
# Prerequisites
# ─────────────────────────────────────────────────────────
# - Node 20+         (for Supabase CLI)
# - npm or pnpm      (package manager)
# - git              (for push/deployment)
# - curl             (webhooks, health checks)
# - supabase PAT     (exported as SUPABASE_TOKEN)
#
# Run once per machine:
#   npm i -g supabase@latest

# ─────────────────────────────────────────────────────────
# 1. Log in to Supabase (with personal access token)
# ─────────────────────────────────────────────────────────
supabase login --access-token "$SUPABASE_TOKEN"

# ─────────────────────────────────────────────────────────
# 2. Link local project to remote
# ─────────────────────────────────────────────────────────
supabase link --project-ref oorsjbxaywqxqachvrqt

# ─────────────────────────────────────────────────────────
# 3. Push the schema (tables + RLS)
# ─────────────────────────────────────────────────────────
supabase db push

# ─────────────────────────────────────────────────────────
# 4. Add finance/staff-hours tables if you are not using the auto-migration route
#    The finance API also creates these tables on first request when DATABASE_URL is present.
#    Migration file: supabase/migrations/20260609000000_fpcc_finance_staff_hours.sql

# ─────────────────────────────────────────────────────────
# 5. Inject environment variables
# Local .env
cat >> .env <<EOF
SUPABASE_URL=https://oorsjbxaywqxqachvrqt.supabase.co
SUPABASE_ANON_KEY=$(supabase status --output json | jq -r '.anon_key')
SUPABASE_SERVICE_ROLE_KEY=$(supabase status --output json | jq -r '.service_role_key')
# Required by serverless finance/staff APIs. Use the Supabase Postgres connection string
# from Project Settings > Database > Connection string > URI.
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.oorsjbxaywqxqachvrqt.supabase.co:5432/postgres
EOF

# Vercel (set via CLI or dashboard)
vercel env add SUPABASE_URL               production < .env
vercel env add SUPABASE_ANON_KEY          production < <(echo "$SUPABASE_ANON_KEY")
vercel env add SUPABASE_SERVICE_ROLE_KEY   production < <(echo "$SUPABASE_SERVICE_ROLE_KEY")
vercel env add DATABASE_URL                production

# ─────────────────────────────────────────────────────────
# 6. Deploy
# ─────────────────────────────────────────────────────────
git add .env
git commit -m "chore: add Supabase env vars"
git push origin main

# ─────────────────────────────────────────────────────────
# 7. Verify
# ─────────────────────────────────────────────────────────
curl -sf https://fresh-people-command-center.vercel.app/api/health \
  -o /dev/null && echo "✅ API reachable"

curl -sf "${SUPABASE_URL}/rest/v1/staff" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -o /dev/null && echo "✅ Supabase connected"