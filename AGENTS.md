# ESCC Agents

**Company:** ESCC  
**Shell:** this repository (Command Center UI + API)  
**Hub:** not yet created — this repository is the current hub and home of the shared agent contract  
**Project board:** [ESCC](https://github.com/users/YassinAliYassin/projects/2)

> Note (2026-10-19): the `escc` hub repo and the eight `escc-*-agent` section
> repos below do **not** exist yet (all returned HTTP 404 when verified). Treat
> the section agents as *planned* until those repos are created; today every
> section lives inside this shell repository under `src/`.

Each admin section is owned by a dedicated agent repository under the ESCC company namespace.

| Tab | Agent | Repository (planned) |
|-----|--------|----------------------|
| Dashboard | Executive Intelligence | `escc-executive-agent` — not yet created |
| Roster / Add Staff | Staff | `escc-staff-agent` — not yet created |
| Timesheets | Timesheet | `escc-timesheet-agent` — not yet created |
| Calendar | Calendar | `escc-calendar-agent` — not yet created |
| Docs & Billing | Billing | `escc-billing-agent` — not yet created |
| Clients | CRM | `escc-crm-agent` — not yet created |
| Payroll | Finance | `escc-finance-agent` — not yet created |
| Run sheets | Dispatch | `escc-dispatch-agent` — not yet created |

## In-app catalog

Runtime catalog lives at [`src/agents/catalog.ts`](./src/agents/catalog.ts).

```ts
import { ESCC_AGENTS, agentForTab, ESCC_COMPANY } from "./agents/catalog";
```

## Contract

All agents implement the shared contract. The contract document has not been
published yet — the `escc` hub repo it would live in does not exist
(`https://github.com/YassinAliYassin/escc/docs/AGENT_CONTRACT.md` → 404 as of
2026-10-19). Until it is published, the de-facto contract is this repository's
`src/agents/` interfaces.

**Known stale links:** `src/agents/catalog.ts` still hard-codes the planned
`escc-*-agent` repo URLs (all 404). They are displayed by the in-app agent
catalog; update them once the repos exist (tracked as ESCC repair item 3).

## Roadmap

1. Shell owns composition, auth, and dataStore
2. Agents own section logic, intents, and eventual extracted UI packages
3. Transfer all `escc*` repos into GitHub Organization **ESCC** when created
