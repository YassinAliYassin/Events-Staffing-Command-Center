/**
 * Timesheet Agent
 * Company: ESCC | Section: timesheets
 */
import { BaseEsccAgent, type AgentResult, type EsccAgentContext, type TimesheetRecord } from "@escc/core";
import { manifest } from "./manifest.js";

export type * from "@escc/core";
export { manifest } from "./manifest.js";

export class TimesheetAgent extends BaseEsccAgent {
  readonly manifest = manifest;
  protected route(intent: string, payload?: unknown): AgentResult | Promise<AgentResult> {
    if (!this.ctx) return this.unknownIntent(intent);
    switch (intent) {
      case "clock.in":
        return this.clock("in", payload);
      case "clock.out":
        return this.clock("out", payload);
      case "timesheet.list":
        return { ok: true, records: (this.ctx as EsccAgentContext).records };
      case "timesheet.export":
        return this.exportCsv();
      default:
        return this.unknownIntent(intent);
    }
  }

  private async clock(dir: "in" | "out", payload?: unknown): Promise<AgentResult> {
    const staffId = (payload as { staffId?: number })?.staffId;
    if (staffId == null) return { ok: false, agent: this.manifest.id, error: "staffId required" };
    const res = await fetch(`${this.ctx!.apiBase}/api/staff`, {
      method: dir === "in" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId, clock: dir }),
    });
    return { ok: res.ok, intent: `clock.${dir}`, status: res.status, body: await res.json().catch(() => null) };
  }

  private exportCsv(): AgentResult {
    const ctx = this.ctx as EsccAgentContext;
    const completed = ctx.records.filter((r: TimesheetRecord) => typeof r.clockOut === "number");
    const header = "staffId,clockIn,clockOut";
    const lines = completed.map((r) => `${r.staffId},${r.clockIn},${r.clockOut}`);
    return { ok: true, csv: [header, ...lines].join("\n") };
  }
}

export function createAgent(): TimesheetAgent {
  return new TimesheetAgent();
}

export default createAgent;
