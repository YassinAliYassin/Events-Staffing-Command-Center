/**
 * Calendar Agent
 * Company: ESCC | Section: calendar
 */
import { BaseEsccAgent, type AgentResult, type EsccAgentContext, type Event } from "@escc/core";
import { manifest } from "./manifest.js";

export type * from "@escc/core";
export { manifest } from "./manifest.js";

function isEventLike(p: unknown): p is Partial<Event> {
  return !!p && typeof p === "object";
}

export class CalendarAgent extends BaseEsccAgent {
  readonly manifest = manifest;
  protected route(intent: string, payload?: unknown): AgentResult | Promise<AgentResult> {
    if (!this.ctx) return this.unknownIntent(intent);
    switch (intent) {
      case "event.list":
        return { ok: true, events: (this.ctx as EsccAgentContext).events };
      case "event.create":
        return this.create(payload);
      case "event.update":
        return this.update(payload);
      case "calendar.sync.apple":
        return this.fetchJson(`/api/calendar/apple`);
      case "calendar.sync.google":
        return this.fetchJson(`/api/calendar/google`);
      default:
        return this.unknownIntent(intent);
    }
  }

  private async create(payload?: unknown): Promise<AgentResult> {
    if (!isEventLike(payload) || !payload.title) {
      return { ok: false, agent: this.manifest.id, error: "title required for event.create" };
    }
    return this.api("POST", "/api/events", payload, "event.create");
  }

  private async update(payload?: unknown): Promise<AgentResult> {
    if (!isEventLike(payload) || payload.id == null) {
      return { ok: false, agent: this.manifest.id, error: "id required for event.update" };
    }
    return this.api("PATCH", "/api/events", payload, "event.update");
  }

  private api(method: "POST" | "PATCH", path: string, body: unknown, intent: string): Promise<AgentResult> {
    return fetch(`${this.ctx!.apiBase}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((res) => ({
      ok: res.ok,
      intent,
      status: res.status,
      body: await res.json().catch(() => null),
    }));
  }

  private fetchJson(path: string): Promise<AgentResult> {
    return fetch(`${this.ctx!.apiBase}${path}`).then((res) => res.json());
  }
}

export function createAgent(): CalendarAgent {
  return new CalendarAgent();
}

export default createAgent;
