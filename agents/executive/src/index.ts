/**
 * Executive Intelligence Agent
 * Company: ESCC | Section: dashboard
 */
import { BaseEsccAgent, OpenRouterClient, type AgentResult, type EsccAgentContext } from "@escc/core";
import { manifest } from "./manifest.js";

export type * from "@escc/core";
export { manifest } from "./manifest.js";

export class ExecutiveAgent extends BaseEsccAgent {
  readonly manifest = manifest;
  protected route(intent: string, payload?: unknown): AgentResult | Promise<AgentResult> {
    if (!this.ctx) return this.unknownIntent(intent);
    switch (intent) {
      case "kpi.refresh":
        return { ok: true, kpis: this.kpis() };
      case "insight.generate":
        return this.insight();
      case "status.live":
        return { ok: true, status: this.getStatus(), agent: this.manifest.id };
      default:
        return this.unknownIntent(intent);
    }
  }

  private kpis() {
    const ctx = this.ctx as EsccAgentContext;
    const today = new Date().toISOString().slice(0, 10);
    return {
      activeStaff: ctx.staff.filter((s) => ctx.records.some((r) => r.staffId === s.id && !r.clockOut)).length,
      eventsToday: ctx.events.filter((e) => e.date === today).length,
      openInvoices: ctx.invoices.filter((i) => i.status !== "paid").length,
      rosterSize: ctx.staff.length,
    };
  }

  private async insight(): Promise<AgentResult> {
    const kpis = this.kpis();
    const client = new OpenRouterClient({ model: this.ctx!.model });
    const system =
      "You are the ESCC Executive Intelligence agent for an African event-staffing company. " +
      "Given live KPIs, return one concise, actionable recommendation (max 2 sentences).";
    const user = `Live KPIs: ${JSON.stringify(kpis)}. What should leadership focus on?`;
    try {
      const message = await client.chat(system, user);
      return { ok: true, kpis, insights: [{ type: "recommendation", message }] };
    } catch (err) {
      return { ok: false, kpis, error: (err as Error).message, model: this.ctx!.model ?? "tencent/hy3:free" };
    }
  }
}

export function createAgent(): ExecutiveAgent {
  return new ExecutiveAgent();
}

export default createAgent;
