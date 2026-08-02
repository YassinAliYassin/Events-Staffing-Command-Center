# Timesheet Agent

> **Company:** [ESCC](https://github.com/YassinAliYassin/escc) · **Section:** `timesheets` · **Package:** `@escc/timesheet-agent`

Clock in/out, shift history, and timesheet export

Part of the **ESCC multi-agent Command Center**. Tracked on the [ESCC GitHub Project](https://github.com/users/YassinAliYassin/projects/2).

## Identity

| Field | Value |
|-------|--------|
| Agent ID | `timesheet` |
| UI section | `timesheets` |
| Accent | `#10B981` |
| Shell | [Events-Staffing-Command-Center](https://github.com/YassinAliYassin/Events-Staffing-Command-Center) |

## Capabilities

```json
["clock.in","clock.out","timesheet.list","timesheet.export"]
```

## Install (shell)

```bash
# from Command Center monorepo / consumer
npm install @escc/timesheet-agent
```

```ts
import { createAgent } from "@escc/timesheet-agent";

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
