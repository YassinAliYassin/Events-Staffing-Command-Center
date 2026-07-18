# ESCC Agents

**Company:** ESCC  
**Shell:** this repository (Command Center UI + API)  
**Hub:** [escc](https://github.com/YassinAliYassin/escc)  
**Project board:** [ESCC](https://github.com/users/YassinAliYassin/projects/2)

Each admin section is owned by a dedicated agent repository under the ESCC company namespace.

| Tab | Agent | Repository |
|-----|--------|------------|
| Dashboard | Executive Intelligence | [escc-executive-agent](https://github.com/YassinAliYassin/escc-executive-agent) |
| Roster / Add Staff | Staff | [escc-staff-agent](https://github.com/YassinAliYassin/escc-staff-agent) |
| Timesheets | Timesheet | [escc-timesheet-agent](https://github.com/YassinAliYassin/escc-timesheet-agent) |
| Calendar | Calendar | [escc-calendar-agent](https://github.com/YassinAliYassin/escc-calendar-agent) |
| Docs & Billing | Billing | [escc-billing-agent](https://github.com/YassinAliYassin/escc-billing-agent) |
| Clients | CRM | [escc-crm-agent](https://github.com/YassinAliYassin/escc-crm-agent) |
| Payroll | Finance | [escc-finance-agent](https://github.com/YassinAliYassin/escc-finance-agent) |
| WhatsApp notify | Dispatch | [escc-dispatch-agent](https://github.com/YassinAliYassin/escc-dispatch-agent) |

## In-app catalog

Runtime catalog lives at [`src/agents/catalog.ts`](./src/agents/catalog.ts).

```ts
import { ESCC_AGENTS, agentForTab, ESCC_COMPANY } from "./agents/catalog";
```

## Contract

All agents implement the shared contract documented in the hub:

https://github.com/YassinAliYassin/escc/blob/main/docs/AGENT_CONTRACT.md

## Roadmap

1. Shell owns composition, auth, and dataStore
2. Agents own section logic, intents, and eventual extracted UI packages
3. Transfer all `escc*` repos into GitHub Organization **ESCC** when created
