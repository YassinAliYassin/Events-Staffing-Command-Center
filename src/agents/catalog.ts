/**
 * ESCC multi-agent catalog
 * Company: ESCC — each Command Center section maps to one agent repo.
 * Hub: https://github.com/YassinAliYassin/escc
 * Project: https://github.com/users/YassinAliYassin/projects/2
 */

export type EsccAgentId =
  | "executive"
  | "staff"
  | "timesheet"
  | "calendar"
  | "billing"
  | "crm"
  | "finance"
  | "dispatch";

export interface EsccAgentCatalogEntry {
  id: EsccAgentId;
  name: string;
  section: string;
  /** Admin tab key in App.tsx (may differ from section for multi-tab agents) */
  tabKeys: string[];
  repo: string;
  package: string;
  accent: string;
  description: string;
}

export const ESCC_COMPANY = {
  name: "ESCC",
  fullName: "Events Staffing Command Center",
  hub: "https://github.com/YassinAliYassin/escc",
  project: "https://github.com/users/YassinAliYassin/projects/2",
  shell: "https://github.com/YassinAliYassin/Events-Staffing-Command-Center",
  accent: "#BF8F3B",
} as const;

/** Section → agent mapping for the Command Center shell */
export const ESCC_AGENTS: EsccAgentCatalogEntry[] = [
  {
    id: "executive",
    name: "Executive Intelligence Agent",
    section: "dashboard",
    tabKeys: ["dashboard"],
    repo: "https://github.com/YassinAliYassin/escc-executive-agent",
    package: "@escc/executive-agent",
    accent: "#BF8F3B",
    description: "KPIs, live ops intelligence, and executive insights",
  },
  {
    id: "staff",
    name: "Staff Agent",
    section: "roster",
    tabKeys: ["roster", "add staff"],
    repo: "https://github.com/YassinAliYassin/escc-staff-agent",
    package: "@escc/staff-agent",
    accent: "#3B82F6",
    description: "Staff roster, roles, PIN auth, and talent registry",
  },
  {
    id: "timesheet",
    name: "Timesheet Agent",
    section: "timesheets",
    tabKeys: ["timesheets"],
    repo: "https://github.com/YassinAliYassin/escc-timesheet-agent",
    package: "@escc/timesheet-agent",
    accent: "#10B981",
    description: "Clock in/out, shift history, and timesheet export",
  },
  {
    id: "calendar",
    name: "Calendar Agent",
    section: "calendar",
    tabKeys: ["calendar"],
    repo: "https://github.com/YassinAliYassin/escc-calendar-agent",
    package: "@escc/calendar-agent",
    accent: "#8B5CF6",
    description: "Event scheduling and Apple/Google calendar sync",
  },
  {
    id: "billing",
    name: "Billing Agent",
    section: "documents",
    tabKeys: ["documents"],
    repo: "https://github.com/YassinAliYassin/escc-billing-agent",
    package: "@escc/billing-agent",
    accent: "#F59E0B",
    description: "Quotes, invoices, statements, and tax-aware billing",
  },
  {
    id: "crm",
    name: "CRM Agent",
    section: "clients",
    tabKeys: ["clients"],
    repo: "https://github.com/YassinAliYassin/escc-crm-agent",
    package: "@escc/crm-agent",
    accent: "#EC4899",
    description: "Client relationships, pipeline, and lead scoring",
  },
  {
    id: "finance",
    name: "Finance Agent",
    section: "payroll",
    tabKeys: ["payroll"],
    repo: "https://github.com/YassinAliYassin/escc-finance-agent",
    package: "@escc/finance-agent",
    accent: "#D4A853",
    description: "Payroll, payments status, and finance alerts",
  },
  {
    id: "dispatch",
    name: "Dispatch Agent",
    section: "whatsapp",
    tabKeys: [],
    repo: "https://github.com/YassinAliYassin/escc-dispatch-agent",
    package: "@escc/dispatch-agent",
    accent: "#22C55E",
    description: "WhatsApp staff dispatch and field notifications",
  },
];

export function agentForTab(tabKey: string): EsccAgentCatalogEntry | undefined {
  return ESCC_AGENTS.find((a) => a.tabKeys.includes(tabKey));
}

export function agentById(id: EsccAgentId): EsccAgentCatalogEntry | undefined {
  return ESCC_AGENTS.find((a) => a.id === id);
}
