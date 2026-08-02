/**
 * Shared ESCC domain + agent-contract types.
 * Single source of truth — imported by every @escc/*-agent via @escc/core.
 */

export type AgentStatus = "idle" | "active" | "analyzing" | "alert" | "error";

export interface Staff {
  id: number;
  name: string;
  role: string;
  rate: number;
  pin: string;
  uniform: boolean;
  department: string;
  email: string;
  phone: string;
}

export interface Client {
  id: number;
  name: string;
  email: string;
  vatNo?: string;
  address?: string;
  phone?: string;
  status?: "active" | "inactive" | "lead" | "vip";
}

export interface Event {
  id: number;
  title: string;
  date: string;
  venue: string;
  staffIds: number[];
  startTime: string;
  endTime: string;
  clientId: number;
  color?: string;
  gcalId?: string | null;
  notes?: string;
}

export interface TimesheetRecord {
  id: number;
  staffId: number;
  clockIn: number;
  clockOut?: number | null;
}

export interface InvoiceLine {
  desc: string;
  qty: number;
  rate: number;
}

export interface Invoice {
  id: number;
  docNo: string;
  clientId: number;
  eventId?: number;
  issueDate: string;
  dueDate: string;
  status: "draft" | "sent" | "paid" | "overdue";
  lines: InvoiceLine[];
  notes?: string;
  includeTax?: boolean;
  taxRate?: number;
}

export interface Quote {
  id: number;
  docNo: string;
  clientId: number;
  eventId?: number;
  issueDate: string;
  status: "draft" | "sent" | "accepted" | "declined";
  lines: InvoiceLine[];
}

export interface AgentManifest {
  id: string;
  name: string;
  company: string;
  section: string;
  version: string;
  description: string;
  accent: string;
  capabilities: string[];
  repo: string;
  entry: string;
  ui: { tabKey: string; tabLabel: string; icon: string };
  dependsOn: string[];
}

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
  getStatus(): AgentStatus;
}

/** Standard success/error envelope returned by BaseEsccAgent route handlers. */
export interface AgentResult {
  ok: boolean;
  agent?: string;
  intent?: string;
  error?: string;
  available?: string[];
  [key: string]: unknown;
}
