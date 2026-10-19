/**
 * ESCC multi-agent catalog
 * Company: ESCC — each Command Center section maps to one agent repo.
 * Hub: https://github.com/YassinAliYassin/escc  (PLANNED — not yet created; 404 as of 2026-10-19)
 * Project: https://github.com/users/YassinAliYassin/projects/2
 *
 * LINK STATUS (verified 2026-10-19): the hub repo and all eight section-agent
 * repos below do not exist yet (each returned HTTP 404). The URLs/`repo` fields
 * are kept as the intended target names and are flagged `planned: true` so the
 * shell does not render them as live links. Update `repo` + `planned` together
 * once a repo is actually created. See AGENTS.md for the same map at doc level.
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
  /**
   * true while the agent repo does not exist yet (verified 404). The shell
   * renders the repo as a non-link "planned" label instead of a dead link.
   */
  planned: boolean;
  package: string;
  accent: string;
  description: string;
}

export const ESCC_COMPANY = {
  name: "ESCC",
  fullName: "Events Staffing Command Center",
  /** PLANNED — hub repo not yet created (404 as of 2026-10-19). Do not link until live. */
  hub: "https://github.com/YassinAliYassin/escc",
  hubStatus: "planned",
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
    planned: true,
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
    planned: true,
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
    planned: true,
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
    planned: true,
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
    planned: true,
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
    planned: true,
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
    planned: true,
    package: "@escc/finance-agent",
    accent: "#D4A853",
    description: "Payroll, payments status, and finance alerts",
  },
  {
    id: "dispatch",
    name: "Dispatch Agent",
    section: "dispatch",
    tabKeys: [],
    repo: "https://github.com/YassinAliYassin/escc-dispatch-agent",
    planned: true,
    package: "@escc/dispatch-agent",
    accent: "#22C55E",
    description: "On-site run sheets and crew briefings",
  },
];

export function agentForTab(tabKey: string): EsccAgentCatalogEntry | undefined {
  return ESCC_AGENTS.find((a) => a.tabKeys.includes(tabKey));
}

export function agentById(id: EsccAgentId): EsccAgentCatalogEntry | undefined {
  return ESCC_AGENTS.find((a) => a.id === id);
}
