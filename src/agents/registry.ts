/**
 * ESCC agent registry — composes the real @escc/*-agent packages into the shell.
 * Shell owns dataStore + auth; agents own section logic per docs/AGENT_CONTRACT.md.
 */
import { createAgent as createExecutiveAgent } from "@escc/executive-agent";
import { createAgent as createStaffAgent } from "@escc/staff-agent";
import { createAgent as createTimesheetAgent } from "@escc/timesheet-agent";
import { createAgent as createCalendarAgent } from "@escc/calendar-agent";
import { createAgent as createBillingAgent } from "@escc/billing-agent";
import { createAgent as createCrmAgent } from "@escc/crm-agent";
import { createAgent as createFinanceAgent } from "@escc/finance-agent";
import { createAgent as createDispatchAgent } from "@escc/dispatch-agent";
import type { EsccAgent, EsccAgentContext } from "@escc/dispatch-agent";
import * as dataStore from "../services/dataStore";
import type { EsccAgentId } from "./catalog";

type ToastFn = (msg: string, type?: "success" | "error" | "warning") => void;

const agents: Record<EsccAgentId, EsccAgent> = {
  executive: createExecutiveAgent(),
  staff: createStaffAgent(),
  timesheet: createTimesheetAgent(),
  calendar: createCalendarAgent(),
  billing: createBillingAgent(),
  crm: createCrmAgent(),
  finance: createFinanceAgent(),
  dispatch: createDispatchAgent(),
};

function buildContext(toast?: ToastFn): EsccAgentContext {
  const snap = dataStore.getSnapshot();
  return {
    staff: snap.staff,
    events: snap.events,
    clients: snap.clients,
    records: snap.records,
    invoices: snap.invoices,
    quotes: snap.quotes,
    toast: toast ?? (() => {}),
    apiBase: typeof window !== "undefined" ? window.location.origin : "",
  };
}

/** Mount an agent with a fresh snapshot of shell data, run one intent, then unmount. */
export async function handleAgentIntent(
  id: EsccAgentId,
  intent: string,
  payload?: unknown,
  toast?: ToastFn
): Promise<unknown> {
  const agent = agents[id];
  await agent.mount(buildContext(toast));
  try {
    return await agent.handle(intent, payload);
  } finally {
    agent.unmount();
  }
}

export function getAgent(id: EsccAgentId): EsccAgent {
  return agents[id];
}

export { agents };
