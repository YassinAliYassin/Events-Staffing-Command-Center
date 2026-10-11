# ESCC Agent Contract

Every ESCC agent repository implements this contract so the Command Center shell can compose them.

## Manifest (`agent.json`)

```json
{
  "id": "finance",
  "name": "Finance Agent",
  "company": "ESCC",
  "section": "payroll",
  "version": "1.0.0",
  "description": "Payroll and payment intelligence",
  "accent": "#D4A853",
  "capabilities": ["payroll.summary", "payments.remind", "export.csv"],
  "repo": "https://github.com/YassinAliYassin/escc-finance-agent",
  "entry": "./src/index.ts",
  "ui": {
    "tabKey": "payroll",
    "tabLabel": "Payroll",
    "icon": "wallet"
  },
  "dependsOn": ["staff", "timesheet", "calendar"]
}
```

## Runtime interface

```ts
export interface EsccAgentContext {
  staff: Staff[];
  events: Event[];
  clients: Client[];
  records: TimesheetRecord[];
  invoices: Invoice[];
  quotes: Quote[];
  toast: (msg: string, type?: "success" | "error" | "warning") => void;
  apiBase: string;
  model?: string;
}

export interface EsccAgent {
  readonly manifest: AgentManifest;
  mount(ctx: EsccAgentContext): void | Promise<void>;
  unmount(): void;
  handle(intent: string, payload?: unknown): Promise<unknown>;
  getStatus(): "idle" | "active" | "analyzing" | "alert" | "error";
}
```

## Intents (by agent)

| Agent | Example intents |
|-------|-----------------|
| executive | `kpi.refresh`, `insight.generate` |
| staff | `staff.list`, `staff.create`, `staff.update`, `staff.remove` |
| timesheet | `clock.in`, `clock.out`, `timesheet.export` |
| calendar | `event.create`, `event.update`, `calendar.sync.apple`, `calendar.sync.google` |
| billing | `quote.create`, `invoice.create`, `invoice.markPaid` |
| crm | `client.list`, `client.score`, `pipeline.move` |
| finance | `payroll.summary`, `payment.remind` |
| dispatch | `dispatch.event`, `dispatch.bulk`, `dispatch.runsheet` |

## Versioning

- Semver on packages `@escc/*-agent`
- Breaking intent renames require major bump
- Shell pins agent versions in its lockfile / catalog

## Independence rules

1. **One section → one agent → one repo**
2. Agents must not import another agent's private modules; use shared types or shell-mediated data
3. Side effects (WhatsApp, calendar write) go through declared capabilities
4. UI styling uses ESCC gold + glass tokens; agent accent is secondary
