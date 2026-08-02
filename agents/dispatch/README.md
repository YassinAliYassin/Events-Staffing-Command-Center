# Dispatch Agent

> **Company:** [ESCC](https://github.com/YassinAliYassin/escc) · **Section:** `whatsapp` · **Package:** `@escc/dispatch-agent`

WhatsApp staff dispatch, webhooks, and field notifications

Part of the **ESCC multi-agent Command Center**. Tracked on the [ESCC GitHub Project](https://github.com/users/YassinAliYassin/projects/2).

## Identity

| Field | Value |
|-------|--------|
| Agent ID | `dispatch` |
| UI section | `whatsapp` |
| Accent | `#22C55E` |
| Shell | [Events-Staffing-Command-Center](https://github.com/YassinAliYassin/Events-Staffing-Command-Center) |

## Capabilities

```json
["dispatch.event","dispatch.bulk","whatsapp.webhook","whatsapp.health"]
```

## Install (shell)

```bash
# from Command Center monorepo / consumer
npm install @escc/dispatch-agent
```

```ts
import { createAgent } from "@escc/dispatch-agent";

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
