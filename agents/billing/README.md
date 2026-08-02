# Billing Agent

> **Company:** [ESCC](https://github.com/YassinAliYassin/escc) · **Section:** `documents` · **Package:** `@escc/billing-agent`

Quotes, invoices, statements, and tax-aware billing

Part of the **ESCC multi-agent Command Center**. Tracked on the [ESCC GitHub Project](https://github.com/users/YassinAliYassin/projects/2).

## Identity

| Field | Value |
|-------|--------|
| Agent ID | `billing` |
| UI section | `documents` |
| Accent | `#F59E0B` |
| Shell | [Events-Staffing-Command-Center](https://github.com/YassinAliYassin/Events-Staffing-Command-Center) |

## Capabilities

```json
["quote.create","invoice.create","invoice.list","invoice.markPaid","statement.summary"]
```

## Install (shell)

```bash
# from Command Center monorepo / consumer
npm install @escc/billing-agent
```

```ts
import { createAgent } from "@escc/billing-agent";

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
