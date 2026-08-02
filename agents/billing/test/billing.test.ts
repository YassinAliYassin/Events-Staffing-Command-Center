import { describe, it, expect } from "vitest";
import { createAgent } from "../src/index.js";
import { makeCtx } from "@escc/core/test-fixtures";

describe("BillingAgent", () => {
  it("throws when not mounted", async () => {
    await expect(createAgent().handle("invoice.list")).rejects.toThrow(/not mounted/);
  });

  it("builds an invoice with VAT", async () => {
    const a = createAgent();
    await a.mount(makeCtx());
    const r: any = await a.handle("invoice.create", { lines: [{ desc: "Chef", qty: 10, rate: 200 }] });
    expect(r.ok).toBe(true);
    expect(r.doc.subtotal).toBe(2000);
    expect(r.doc.vat).toBe(300); // 15%
    expect(r.doc.total).toBe(2300);
  });

  it("rejects document without lines", async () => {
    const a = createAgent();
    await a.mount(makeCtx());
    const r: any = await a.handle("quote.create", {});
    expect(r.ok).toBe(false);
  });

  it("marks an invoice paid", async () => {
    const a = createAgent();
    await a.mount(makeCtx());
    const r: any = await a.handle("invoice.markPaid", { id: 2 });
    expect(r.ok).toBe(true);
    expect(r.invoice.status).toBe("paid");
  });

  it("summarizes outstanding statements", async () => {
    const a = createAgent();
    await a.mount(makeCtx());
    const r: any = await a.handle("statement.summary");
    expect(r.unpaidCount).toBe(1); // INV-002 sent
    expect(r.outstanding).toBe(2000 + 300);
  });
});
