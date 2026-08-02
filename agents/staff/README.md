# Staff Agent

> **Company:** [ESCC](https://github.com/YassinAliYassin/escc) · **Section:** `roster` · **Package:** `@escc/staff-agent`

Staff roster, roles, PIN auth, and talent registry

Part of the **ESCC multi-agent Command Center**. Tracked on the [ESCC GitHub Project](https://github.com/users/YassinAliYassin/projects/2).

## Identity

| Field | Value |
|-------|--------|
| Agent ID | `staff` |
| UI section | `roster` |
| Accent | `#3B82F6` |
| Shell | [Events-Staffing-Command-Center](https://github.com/YassinAliYassin/Events-Staffing-Command-Center) |

## Capabilities

```json
["staff.list","staff.create","staff.update","staff.remove"]
```

## Install (shell)

```bash
# from Command Center monorepo / consumer
npm install @escc/staff-agent
```

```ts
import { createAgent } from "@escc/staff-agent";

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
