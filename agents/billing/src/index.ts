/**
 * Billing Agent
 * Company: ESCC | Section: documents
 */
import { BaseEsccAgent, type AgentResult, type EsccAgentContext, type Invoice, type Quote, type InvoiceLine } from "@escc/core";
import { manifest } from "./manifest.js";

export type * from "@escc/core";
export { manifest } from "./manifest.js";

const DEFAULT_TAX = 15;

function totals(lines: InvoiceLine[], includeTax = true, taxRate = DEFAULT_TAX) {
  const subtotal = lines.reduce((a, l) => a + l.qty * l.rate, 0);
  const vat = includeTax ? subtotal * (taxRate / 100) : 0;
  return { subtotal, taxRate, vat, total: subtotal + vat };
}

export class BillingAgent extends BaseEsccAgent {
  readonly manifest = manifest;
  protected route(intent: string, payload?: unknown): AgentResult | Promise<AgentResult> {
    if (!this.ctx) return this.unknownIntent(intent);
    switch (intent) {
      case "invoice.list":
        return { ok: true, invoices: (this.ctx as EsccAgentContext).invoices, quotes: (this.ctx as EsccAgentContext).quotes };
      case "quote.create":
        return this.buildDoc("quote", payload);
      case "invoice.create":
        return this.buildDoc("invoice", payload);
      case "invoice.markPaid":
        return this.markPaid(payload);
      case "statement.summary": {
        const unpaid = (this.ctx as EsccAgentContext).invoices.filter((i: Invoice) => i.status !== "paid");
        const outstanding = unpaid.reduce((a: number, i: Invoice) => {
          const t = totals(i.lines, i.includeTax !== false, i.taxRate ?? DEFAULT_TAX);
          return a + t.total;
        }, 0);
        return { ok: true, unpaidCount: unpaid.length, outstanding, invoices: unpaid };
      }
      default:
        return this.unknownIntent(intent);
    }
  }

  private buildDoc(kind: "quote" | "invoice", payload?: unknown): AgentResult {
    const p = (payload ?? {}) as Partial<Invoice & Quote>;
    if (!Array.isArray(p.lines) || p.lines.length === 0) {
      return { ok: false, agent: this.manifest.id, error: "lines[] required" };
    }
    const taxRate = p.taxRate ?? DEFAULT_TAX;
    const includeTax = p.includeTax !== false;
    const t = totals(p.lines as InvoiceLine[], includeTax, taxRate);
    return { ok: true, intent: `${kind}.create`, doc: { ...p, ...t, taxRate, includeTax } };
  }

  private markPaid(payload?: unknown): AgentResult {
    const id = (payload as { id?: number })?.id;
    if (id == null) return { ok: false, agent: this.manifest.id, error: "id required" };
    const invoice = (this.ctx as EsccAgentContext).invoices.find((i: Invoice) => i.id === id);
    if (!invoice) return { ok: false, agent: this.manifest.id, error: "invoice not found" };
    invoice.status = "paid";
    return { ok: true, intent: "invoice.markPaid", invoice };
  }
}

export function createAgent(): BillingAgent {
  return new BillingAgent();
}

export default createAgent;
