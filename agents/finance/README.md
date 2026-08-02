# Finance Agent

> **Company:** [ESCC](https://github.com/YassinAliYassin/escc) · **Section:** `payroll` · **Package:** `@escc/finance-agent`

Payroll, payments status, staff earnings, and finance alerts

Part of the **ESCC multi-agent Command Center**. Tracked on the [ESCC GitHub Project](https://github.com/users/YassinAliYassin/projects/2).

## Identity

| Field | Value |
|-------|--------|
| Agent ID | `finance` |
| UI section | `payroll` |
| Accent | `#D4A853` |
| Shell | [Events-Staffing-Command-Center](https://github.com/YassinAliYassin/Events-Staffing-Command-Center) |

## Capabilities

```json
["payroll.summary","payment.remind","payroll.export"]
```

## Install (shell)

```bash
# from Command Center monorepo / consumer
npm install @escc/finance-agent
```

```ts
import { createAgent } from "@escc/finance-agent";

const agent = createAgent();
await agent.mount(ctx);
const result = await agent.handle("<intent>", { /* payload */ });
```

## Manifest

See [`agent.json`](./agent.json) for the full ESCC agent contract.

## Development

```bash
npm install
npm run typecheck
```

## Sibling agents

See the [ESCC hub catalog](https://github.com/YassinAliYassin/escc/blob/main/agents/catalog.json).

## License

UNLICENSED — ESCC / Fresh People.
