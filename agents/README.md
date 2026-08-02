# ESCC Agents

This directory is the consolidated home of the ESCC multi-agent system.

Previously each agent lived in its own GitHub repository (under the `escc-*`
namespace, plus the `escc` hub). They were folded into this single repository to
avoid fragmentation. The GitHub repos still exist but are now **stale** — this
directory is the source of truth.

## Layout

| Path | Contents |
|------|----------|
| `catalog.json` | The ESCC multi-agent catalog (was the `escc` hub's `agents/catalog.json`) |
| `AGENT_CONTRACT.md` | The shared agent contract all agents implement |
| `COMPANY.md` | Company profile for ESCC |
| `core/` | Shared agent core (base agent, intents, types, AI glue) — was only on local disk as `escc-core` |
| `billing/` | Billing Agent — quotes, invoices, statements |
| `calendar/` | Calendar Agent — events, Apple/Google sync |
| `crm/` | CRM Agent — clients, pipeline, lead scoring |
| `dispatch/` | Dispatch Agent — WhatsApp staff dispatch |
| `executive/` | Executive Intelligence Agent — KPIs, live ops |
| `finance/` | Finance Agent — payroll, payments, finance alerts |
| `staff/` | Staff Agent — roster, roles, PIN auth |
| `timesheet/` | Timesheet Agent — clock in/out, shift history |

## Each agent package

Every `agents/<name>/` directory is a standalone npm package with:

```
agent.json        ESCC agent contract (id, name, section, capabilities)
docs/MISSION.md   The agent's mission
src/              TypeScript source (index.ts, manifest.ts, types)
test/             Vitest test suite
package.json      Scoped as @escc/<name>-agent
tsconfig.json
vitest.config.ts
```

## Relationship to the shell

The Command Center shell (this repo's `src/`) carries the composition layer:
auth, data store, and the section→agent routing in `src/agents/catalog.ts`.
The `ESCC_COMPANY` and `ESCC_AGENTS` structures there reference agent IDs that
correspond 1:1 to the folders in this directory.

> **Note:** the catalog files in this directory and `src/agents/catalog.ts`
> still name the old GitHub repo URLs (e.g. `…/escc-billing-agent`). Those repos
> are retained (kept-as-stale per consolidation), so the URLs remain valid; the
> code itself now lives here.

## Production hardening (folded from `eng/production-hardening` branch pass)

A production-hardening pass (MIT license, contract test suite, CI workflow,
OSS community files, audit) had been applied locally to each agent repo on a
local-only `eng/production-hardening` branch that was never pushed. To avoid
losing that work AND avoid re-creating 8 identical copies, the shared artifacts
are folded here **once**:

- `agents/LICENSE-MIT.txt` — MIT license (Copyright 2026 Yassin Ali)
- `agents/shared/contract.test.js` — contract-level test suite valid for every
  ESCC agent (public API: mount/unmount/getStatus/handle)
- `agents/shared/CHANGELOG.md` — changelog
- `agents/shared/ci.yml` — shared CI workflow shape
- repo root: `AUDIT.md`, `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`,
  `CODE_OF_CONDUCT.md`, `.editorconfig`, `.prettierrc`, `.github/` (issue/PR
  templates, dependabot) — production/OSS files from the shell audit clone

The per-agent MIT license field + `test: node --test` script still need wiring
into each `agents/<name>/package.json` when the agent refactor is finished.
