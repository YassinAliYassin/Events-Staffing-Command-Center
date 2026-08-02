# Executive Intelligence Agent

> **Company:** [ESCC](https://github.com/YassinAliYassin/escc) · **Section:** `dashboard` · **Package:** `@escc/executive-agent`

KPIs, live ops intelligence, and executive insights for ESCC

Part of the **ESCC multi-agent Command Center**. Tracked on the [ESCC GitHub Project](https://github.com/users/YassinAliYassin/projects/2).

## Identity

| Field | Value |
|-------|--------|
| Agent ID | `executive` |
| UI section | `dashboard` |
| Accent | `#BF8F3B` |
| Shell | [Events-Staffing-Command-Center](https://github.com/YassinAliYassin/Events-Staffing-Command-Center) |

## Capabilities

```json
["kpi.refresh","insight.generate","status.live"]
```

## Install (shell)

```bash
# from Command Center monorepo / consumer
npm install @escc/executive-agent
```

```ts
import { createAgent } from "@escc/executive-agent";

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
