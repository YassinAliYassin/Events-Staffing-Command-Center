import { describe, it, expect, vi } from "vitest";
import { createAgent } from "../src/index.js";
import { makeCtx } from "@escc/core/test-fixtures";

describe("ExecutiveAgent", () => {
  it("throws when not mounted", async () => {
    await expect(createAgent().handle("kpi.refresh")).rejects.toThrow(/not mounted/);
  });

  it("refreshes KPIs from context", async () => {
    const a = createAgent();
    await a.mount(makeCtx());
    const r: any = await a.handle("kpi.refresh");
    expect(r.ok).toBe(true);
    expect(r.kpis.rosterSize).toBe(3);
    expect(r.kpis.openInvoices).toBe(1);
  });

  it("returns live status", async () => {
    const a = createAgent();
    await a.mount(makeCtx());
    const r: any = await a.handle("status.live");
    expect(r.ok).toBe(true);
    expect(r.status).toBe("analyzing");
  });

  it("generates an insight via hy3 (mocked OpenRouter)", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";
    const a = createAgent();
    const fm = vi.fn(async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: "Focus on unpaid invoices." } }] }), { status: 200 })
    );
    vi.stubGlobal("fetch", fm);
    await a.mount(makeCtx());
    const r: any = await a.handle("insight.generate");
    expect(r.ok).toBe(true);
    expect(r.insights[0].message).toBe("Focus on unpaid invoices.");
    vi.unstubAllGlobals();
    delete process.env.OPENROUTER_API_KEY;
  });
});
