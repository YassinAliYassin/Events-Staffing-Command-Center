/**
 * Shared in-memory fixtures for agent tests. Import from "@escc/core/test-fixtures".
 */
import type { EsccAgentContext, Staff, Event, TimesheetRecord, Client, Invoice, Quote } from "./types.js";

export const sampleStaff: Staff[] = [
  { id: 1, name: "Ama Ncube", role: "Bartender", rate: 120, pin: "1234", uniform: true, department: "Bar", email: "ama@fp.co", phone: "+263771000001" },
  { id: 2, name: "Tendai Moyo", role: "Waiter", rate: 90, pin: "5678", uniform: false, department: "Floor", email: "tendai@fp.co", phone: "+263771000002" },
  { id: 3, name: "Priya Raja", role: "Chef", rate: 200, pin: "9012", uniform: true, department: "Kitchen", email: "priya@fp.co", phone: "+263771000003" },
];

export const sampleClients: Client[] = [
  { id: 1, name: "Acme Events", email: "book@acme.co", status: "active" },
  { id: 2, name: "Beta Catering", email: "hi@beta.co", status: "lead" },
];

export const sampleEvents: Event[] = [
  { id: 1, title: "Gala Dinner", date: "2026-07-19", venue: "Hilton", staffIds: [1, 2], startTime: "18:00", endTime: "23:00", clientId: 1 },
  { id: 2, title: "Wedding", date: "2026-08-02", venue: "Meikles", staffIds: [3], startTime: "12:00", endTime: "22:00", clientId: 2 },
];

export const sampleRecords: TimesheetRecord[] = [
  { id: 1, staffId: 1, clockIn: 1_700_000_000_000, clockOut: 1_700_003_600_000 },
  { id: 2, staffId: 2, clockIn: 1_700_000_000_000, clockOut: 1_700_002_880_000 },
  { id: 3, staffId: 3, clockIn: 1_700_000_000_000 },
];

export const sampleInvoices: Invoice[] = [
  { id: 1, docNo: "INV-001", clientId: 1, issueDate: "2026-07-01", dueDate: "2026-07-15", status: "paid", lines: [{ desc: "Bar staff", qty: 5, rate: 120 }] },
  { id: 2, docNo: "INV-002", clientId: 2, issueDate: "2026-07-10", dueDate: "2026-07-24", status: "sent", lines: [{ desc: "Chef", qty: 10, rate: 200 }] },
];

export const sampleQuotes: Quote[] = [
  { id: 1, docNo: "Q-001", clientId: 1, issueDate: "2026-07-05", status: "accepted", lines: [{ desc: "Waiters", qty: 4, rate: 90 }] },
];

/** Build a fresh EsccAgentContext (new arrays each call — tests can mutate safely). */
export function makeCtx(overrides: Partial<EsccAgentContext> = {}): EsccAgentContext {
  return {
    staff: sampleStaff.map((s) => ({ ...s })),
    events: sampleEvents.map((e) => ({ ...e, staffIds: [...e.staffIds] })),
    clients: sampleClients.map((c) => ({ ...c })),
    records: sampleRecords.map((r) => ({ ...r })),
    invoices: sampleInvoices.map((i) => ({ ...i, lines: i.lines.map((l) => ({ ...l })) })),
    quotes: sampleQuotes.map((q) => ({ ...q, lines: q.lines.map((l) => ({ ...l })) })),
    toast: () => {},
    apiBase: "http://localhost:3001",
    ...overrides,
  };
}

export const noopFetch = () => Promise.resolve(new Response("{}", { status: 200 }));
