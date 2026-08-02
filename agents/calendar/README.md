# Calendar Agent

> **Company:** [ESCC](https://github.com/YassinAliYassin/escc) · **Section:** `calendar` · **Package:** `@escc/calendar-agent`

Event scheduling, Apple/Google calendar sync, conflict detection

Part of the **ESCC multi-agent Command Center**. Tracked on the [ESCC GitHub Project](https://github.com/users/YassinAliYassin/projects/2).

## Identity

| Field | Value |
|-------|--------|
| Agent ID | `calendar` |
| UI section | `calendar` |
| Accent | `#8B5CF6` |
| Shell | [Events-Staffing-Command-Center](https://github.com/YassinAliYassin/Events-Staffing-Command-Center) |

## Capabilities

```json
["event.list","event.create","event.update","calendar.sync.apple","calendar.sync.google"]
```

## Install (shell)

```bash
# from Command Center monorepo / consumer
npm install @escc/calendar-agent
```

```ts
import { createAgent } from "@escc/calendar-agent";

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
