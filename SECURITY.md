# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| main    | ✅ Active support  |

## Reporting a Vulnerability

Report security vulnerabilities privately to **info@solidsolutions.africa** with
subject prefix `[SECURITY] ESCC`. Do **not** open a public issue. Include:
description, reproduction steps, affected component (shell / agent), suggested fix.

Acknowledgement within 72 hours.

## Secrets Hygiene

- **Firebase:** `firebase-applet-config.json` contains client-side identifiers
  (projectId, appId, a truncated apiKey placeholder). Real API keys must be
  supplied at build/runtime via Vite env vars (`VITE_FIREBASE_API_KEY`, etc.) and
  GitHub/CI secrets — never hardcode full keys.
- **Backend/API:** any server-side secrets must be env-driven; never commit them.
- **WhatsApp/Calendar/Email integrations:** keys live in env only.

## Auth notes

- The shell uses a localStorage-first data layer with Firestore sync; protect any
  admin routes server-side and never trust client-only auth for sensitive actions.
