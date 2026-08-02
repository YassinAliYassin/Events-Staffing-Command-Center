# CRM Agent

> **Company:** [ESCC](https://github.com/YassinAliYassin/escc) · **Section:** `clients` · **Package:** `@escc/crm-agent`

Client relationships, pipeline, lead scoring, and history

Part of the **ESCC multi-agent Command Center**. Tracked on the [ESCC GitHub Project](https://github.com/users/YassinAliYassin/projects/2).

## Identity

| Field | Value |
|-------|--------|
| Agent ID | `crm` |
| UI section | `clients` |
| Accent | `#EC4899` |
| Shell | [Events-Staffing-Command-Center](https://github.com/YassinAliYassin/Events-Staffing-Command-Center) |

## Capabilities

```json
["client.list","client.create","client.score","pipeline.move"]
```

## Install (shell)

```bash
# from Command Center monorepo / consumer
npm install @escc/crm-agent
```

```ts
import { createAgent } from "@escc/crm-agent";

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
