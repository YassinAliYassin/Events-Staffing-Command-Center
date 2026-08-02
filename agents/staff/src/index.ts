/**
 * Staff Agent
 * Company: ESCC | Section: roster
 */
import { BaseEsccAgent, type AgentResult, type EsccAgentContext, type Staff } from "@escc/core";
import { manifest } from "./manifest.js";

export type * from "@escc/core";
export { manifest } from "./manifest.js";

function isStaffLike(p: unknown): p is Partial<Staff> {
  return !!p && typeof p === "object";
}

export class StaffAgent extends BaseEsccAgent {
  readonly manifest = manifest;
  protected route(intent: string, payload?: unknown): AgentResult | Promise<AgentResult> {
    if (!this.ctx) return this.unknownIntent(intent);
    switch (intent) {
      case "staff.list":
        return { ok: true, staff: (this.ctx as EsccAgentContext).staff };
      case "staff.create":
        return this.create(payload);
      case "staff.update":
        return this.update(payload);
      case "staff.remove":
        return this.remove(payload);
      default:
        return this.unknownIntent(intent);
    }
  }

  private async create(payload?: unknown): Promise<AgentResult> {
    if (!isStaffLike(payload)) return { ok: false, agent: this.manifest.id, error: "staff payload required" };
    if (!payload.name || typeof payload.rate !== "number" || payload.rate < 0) {
      return { ok: false, agent: this.manifest.id, error: "name and non-negative rate required" };
    }
    const res = await fetch(`${this.ctx!.apiBase}/api/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { ok: res.ok, intent: "staff.create", status: res.status, body: await res.json().catch(() => null) };
  }

  private async update(payload?: unknown): Promise<AgentResult> {
    if (!isStaffLike(payload) || payload.id == null) {
      return { ok: false, agent: this.manifest.id, error: "id required for update" };
    }
    const res = await fetch(`${this.ctx!.apiBase}/api/staff`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { ok: res.ok, intent: "staff.update", status: res.status, body: await res.json().catch(() => null) };
  }

  private async remove(payload?: unknown): Promise<AgentResult> {
    const id = (payload as { id?: number })?.id;
    if (id == null) return { ok: false, agent: this.manifest.id, error: "id required for remove" };
    const res = await fetch(`${this.ctx!.apiBase}/api/staff`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    return { ok: res.ok, intent: "staff.remove", status: res.status, body: await res.json().catch(() => null) };
  }
}

export function createAgent(): StaffAgent {
  return new StaffAgent();
}

export default createAgent;
