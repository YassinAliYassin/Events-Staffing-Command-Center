/**
 * CRM Agent
 * Company: ESCC | Section: clients
 */
import { BaseEsccAgent, type AgentResult, type EsccAgentContext, type Client } from "@escc/core";
import { manifest } from "./manifest.js";

export type * from "@escc/core";
export { manifest } from "./manifest.js";

const STAGES = ["lead", "contacted", "proposal", "won", "lost"] as const;

export class CrmAgent extends BaseEsccAgent {
  readonly manifest = manifest;
  protected route(intent: string, payload?: unknown): AgentResult | Promise<AgentResult> {
    if (!this.ctx) return this.unknownIntent(intent);
    switch (intent) {
      case "client.list":
        return { ok: true, clients: (this.ctx as EsccAgentContext).clients };
      case "client.create":
        return this.create(payload);
      case "client.score":
        return this.score(payload);
      case "pipeline.move":
        return this.pipelineMove(payload);
      default:
        return this.unknownIntent(intent);
    }
  }

  private create(payload?: unknown): AgentResult {
    const p = payload as Partial<Client>;
    if (!p || !p.name || !p.email) {
      return { ok: false, agent: this.manifest.id, error: "name and email required" };
    }
    return { ok: true, intent: "client.create", client: { id: Date.now(), status: "lead", ...p } };
  }

  private score(payload?: unknown): AgentResult {
    const clientId = (payload as { clientId?: number })?.clientId;
    const events = (this.ctx as EsccAgentContext).events.filter((e) => e.clientId === clientId);
    const score = Math.min(100, events.length * 15 + 40);
    return { ok: true, clientId, score, factors: { events: events.length } };
  }

  private pipelineMove(payload?: unknown): AgentResult {
    const stage = (payload as { stage?: string })?.stage;
    if (!stage || !STAGES.includes(stage as (typeof STAGES)[number])) {
      return { ok: false, agent: this.manifest.id, error: `stage must be one of: ${STAGES.join(", ")}` };
    }
    return { ok: true, intent: "pipeline.move", stage };
  }
}

export function createAgent(): CrmAgent {
  return new CrmAgent();
}

export default createAgent;
