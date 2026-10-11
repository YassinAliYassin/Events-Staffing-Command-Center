/**
 * Dispatch Agent
 * Company: ESCC | Section: dispatch
 * Builds on-site run sheets from the shell snapshot. No external messaging.
 */
import { BaseEsccAgent, type AgentResult, type EsccAgentContext } from "@escc/core";
import { manifest } from "./manifest.js";

export type * from "@escc/core";
export { manifest } from "./manifest.js";

function sheetFor(ctx: EsccAgentContext, event: EsccAgentContext["events"][number]): string {
  const crew = ctx.staff.filter((member) => (event.staffIds || []).includes(member.id));
  const lines = [
    `RUN SHEET — ${event.title}`,
    `Date: ${event.date}  ${event.startTime || ""}–${event.endTime || ""}`,
    `Venue: ${event.venue || "TBC"}`,
    crew.length
      ? `Crew: ${crew.map((member) => `${member.name} (${member.role})`).join(", ")}`
      : "Crew: unassigned",
  ];
  return lines.join("\n");
}

export class DispatchAgent extends BaseEsccAgent {
  readonly manifest = manifest;
  protected route(intent: string, payload?: unknown): AgentResult | Promise<AgentResult> {
    if (!this.ctx) return this.unknownIntent(intent);
    switch (intent) {
      case "dispatch.event":
      case "dispatch.runsheet":
        return this.one(payload);
      case "dispatch.bulk":
        return this.bulk();
      default:
        return this.unknownIntent(intent);
    }
  }

  private one(payload?: unknown): AgentResult {
    const ctx = this.ctx as EsccAgentContext;
    const eventId = payload && typeof payload === "object" ? (payload as { eventId?: number }).eventId : undefined;
    const event = ctx.events.find((item) => item.id === eventId);
    if (!event) return { ok: false, agent: this.manifest.id, error: "event not found" };
    return { ok: true, intent: "dispatch.event", eventId: event.id, runSheet: sheetFor(ctx, event) };
  }

  private bulk(): AgentResult {
    const ctx = this.ctx as EsccAgentContext;
    const today = new Date().toISOString().slice(0, 10);
    const events = ctx.events.filter((event) => event.date === today);
    return {
      ok: true,
      intent: "dispatch.bulk",
      results: events.map((event) => ({ eventId: event.id, runSheet: sheetFor(ctx, event) })),
    };
  }
}

export function createAgent(): DispatchAgent {
  return new DispatchAgent();
}

export default createAgent;
