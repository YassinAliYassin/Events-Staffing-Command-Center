# Contributing to the ESCC Command Center

Thanks for contributing to the Events Staffing Command Center! 🎉

## Code of Conduct

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to contribute

1. Open/pick an issue on the [ESCC project board](https://github.com/users/YassinAliYassin/projects/2).
2. Create a branch: `git checkout -b feat/my-change`.
3. Make focused changes and verify (`npm run lint`, `npm run build`, tests).
4. Open a Pull Request against `main` using the PR template.

## Development setup

```bash
git clone https://github.com/YassinAliYassin/Events-Staffing-Command-Center.git
cd Events-Staffing-Command-Center
bun install        # or npm install
bun run dev        # dev server
```

## Guidelines

- **Agent contracts are stable** — do not change the agent contract
  (`src/agents/catalog.ts` composition or the hub's `docs/AGENT_CONTRACT.md`)
  without a coordinated change across the agent repos.
- **Never commit secrets.** Firebase project config in `firebase-applet-config.json`
  contains client-side keys only; real secrets must live in env vars / GitHub
  Secrets (Vite env vars like `VITE_FIREBASE_API_KEY`).
- **Keep it JSON-serialisable** for Firestore/localStorage-first data flow.
- **No breaking public routes** without a versioned migration.

## Testing

Run lint, build, and any unit tests before opening a PR. CI (`ci.yml`) enforces
lint/build on every push/PR; `deploy.yml` handles deployment.
