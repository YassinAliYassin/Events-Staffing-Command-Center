/**
 * Dispatch Agent
 * Company: ESCC | Section: whatsapp
 */
import { BaseEsccAgent, type AgentResult, type EsccAgentContext } from "@escc/core";
import { manifest } from "./manifest.js";

export type * from "@escc/core";
export { manifest } from "./manifest.js";

export class DispatchAgent extends BaseEsccAgent {
  readonly manifest = manifest;
  protected route(intent: string, payload?: unknown): AgentResult | Promise<AgentResult> {
    if (!this.ctx) return this.unknownIntent(intent);
    switch (intent) {
      case "dispatch.event":
        return this.dispatchOne(payload);
      case "dispatch.bulk":
        return this.dispatchBulk();
      case "whatsapp.health":
        return fetch(`${this.ctx!.apiBase}/api/whatsapp/health`).then((r) => r.json());
      case "whatsapp.webhook": {
        const body = (payload ?? {}) as { from?: string; body?: string };
        if (!body.from || !body.body) {
          return { ok: false, agent: this.manifest.id, error: "webhook requires from + body" };
        }
        return { ok: true, intent: "whatsapp.webhook", from: body.from, received: body.body };
      }
      default:
        return this.unknownIntent(intent);
    }
  }

  private async dispatchOne(payload?: unknown): Promise<AgentResult> {
    const res = await fetch(`${this.ctx!.apiBase}/api/dispatch-staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload ?? {}),
    });
    return { ok: res.ok, intent: "dispatch.event", body: await res.json().catch(() => null) };
  }

  private async dispatchBulk(): Promise<AgentResult> {
    const ctx = this.ctx as EsccAgentContext;
    const today = new Date().toISOString().slice(0, 10);
    const events = ctx.events.filter((e) => e.date === today);
    const results = [];
    for (const event of events) {
      if (event.staffIds?.length) {
        const res = await fetch(`${this.ctx!.apiBase}/api/dispatch-staff`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: event.id, staffIds: event.staffIds }),
        });
        results.push(await res.json());
      }
    }
    return { ok: true, results };
  }
}

export function createAgent(): DispatchAgent {
  return new DispatchAgent();
}

export default createAgent;
