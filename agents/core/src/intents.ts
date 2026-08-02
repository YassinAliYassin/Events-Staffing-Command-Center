/**
 * Canonical ESCC intent registry.
 * Source of truth for implemented intents. Manifests, contract docs, and tests
 * should reference these so capabilities never drift from implementation.
 */

export interface IntentSpec {
  /** Full intent id, e.g. "staff.create". */
  id: string;
  /** Agent that owns this intent. */
  agent: string;
  /** One-line description. */
  description: string;
}

export const INTENTS: readonly IntentSpec[] = [
  // executive
  { id: "kpi.refresh", agent: "executive", description: "Recompute live operational KPIs" },
  { id: "insight.generate", agent: "executive", description: "Generate an AI recommendation from live KPIs (hy3)" },
  { id: "status.live", agent: "executive", description: "Return current agent status" },
  // staff
  { id: "staff.list", agent: "staff", description: "List the validated roster" },
  { id: "staff.create", agent: "staff", description: "Validate and create a staff member" },
  { id: "staff.update", agent: "staff", description: "Validate and update a staff member" },
  { id: "staff.remove", agent: "staff", description: "Remove a staff member by id" },
  // timesheet
  { id: "clock.in", agent: "timesheet", description: "Open a timesheet record for a staff member" },
  { id: "clock.out", agent: "timesheet", description: "Close the open timesheet record for a staff member" },
  { id: "timesheet.list", agent: "timesheet", description: "List timesheet records" },
  { id: "timesheet.export", agent: "timesheet", description: "Export timesheet records as CSV" },
  // calendar
  { id: "event.list", agent: "calendar", description: "List events" },
  { id: "event.create", agent: "calendar", description: "Validate and create an event" },
  { id: "event.update", agent: "calendar", description: "Validate and update an event" },
  { id: "calendar.sync.apple", agent: "calendar", description: "Sync Apple calendar" },
  { id: "calendar.sync.google", agent: "calendar", description: "Sync Google calendar" },
  // billing
  { id: "quote.create", agent: "billing", description: "Build a validated quote" },
  { id: "invoice.create", agent: "billing", description: "Build a validated invoice" },
  { id: "invoice.list", agent: "billing", description: "List invoices and quotes" },
  { id: "invoice.markPaid", agent: "billing", description: "Mark an invoice paid" },
  { id: "statement.summary", agent: "billing", description: "Summarize unpaid invoices" },
  // crm
  { id: "client.list", agent: "crm", description: "List clients" },
  { id: "client.create", agent: "crm", description: "Validate and create a client" },
  { id: "client.score", agent: "crm", description: "Score a client from event history" },
  { id: "pipeline.move", agent: "crm", description: "Move a client through the pipeline" },
  // finance
  { id: "payroll.summary", agent: "finance", description: "Summarize payroll per staff from timesheets" },
  { id: "payment.remind", agent: "finance", description: "Compose a payroll payment reminder" },
  { id: "payroll.export", agent: "finance", description: "Export payroll summary" },
  // dispatch
  { id: "dispatch.event", agent: "dispatch", description: "Dispatch staff to a single event" },
  { id: "dispatch.bulk", agent: "dispatch", description: "Dispatch staff to all of today's events" },
  { id: "whatsapp.webhook", agent: "dispatch", description: "Handle an inbound WhatsApp webhook payload" },
  { id: "whatsapp.health", agent: "dispatch", description: "Check WhatsApp gateway health" },
] as const;

/** All intent ids as a plain string tuple. */
export const INTENT_IDS = INTENTS.map((i) => i.id);

/** Intent ids owned by a given agent. */
export function intentsForAgent(agent: string): string[] {
  return INTENTS.filter((i) => i.agent === agent).map((i) => i.id);
}
