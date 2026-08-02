/**
 * BaseEsccAgent — shared lifecycle for all ESCC agents.
 *
 * Subclasses implement only `route(intent, payload)`. The base class owns the
 * mounted-context guard, status transitions, and the standard {ok, ...} envelope
 * for unknown intents, so every agent behaves identically.
 */
import type {
  AgentManifest,
  AgentResult,
  AgentStatus,
  EsccAgent,
  EsccAgentContext,
} from "./types.js";

export abstract class BaseEsccAgent implements EsccAgent {
  abstract readonly manifest: AgentManifest;
  private status: AgentStatus = "idle";
  protected ctx: EsccAgentContext | null = null;

  async mount(ctx: EsccAgentContext): Promise<void> {
    this.ctx = ctx;
    this.status = "active";
  }

  unmount(): void {
    this.ctx = null;
    this.status = "idle";
  }

  getStatus(): AgentStatus {
    return this.status;
  }

  async handle(intent: string, payload?: unknown): Promise<unknown> {
    if (!this.ctx) {
      throw new Error(`${this.manifest.name} is not mounted`);
    }
    this.status = "analyzing";
    try {
      const result = await this.route(intent, payload);
      this.status = "active";
      return result;
    } catch (err) {
      this.status = "error";
      throw err;
    }
  }

  /** Subclasses implement domain routing here. */
  protected abstract route(intent: string, payload?: unknown): Promise<unknown> | unknown;

  /**
   * Standard "unknown intent" envelope. Call from a subclass default branch so
   * every agent reports the same shape and lists its available capabilities.
   */
  protected unknownIntent(intent: string): AgentResult {
    return {
      ok: false,
      agent: this.manifest.id,
      intent,
      error: `Unknown intent: ${intent}`,
      available: this.manifest.capabilities,
    };
  }
}
