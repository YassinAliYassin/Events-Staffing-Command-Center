import { describe, it, expect } from "vitest";
import { createAgent } from "../src/index.js";
import { makeCtx } from "@escc/core/test-fixtures";

describe("FinanceAgent", () => {
  it("throws when not mounted", async () => {
    await expect(createAgent().handle("payroll.summary")).rejects.toThrow(/not mounted/);
  });

  it("summarizes payroll from completed timesheets", async () => {
    const a = createAgent();
    await a.mount(makeCtx());
    const r: any = await a.handle("payroll.summary");
    expect(r.ok).toBe(true);
    // staff 1: 1h * 120 = 120; staff 2: 0.8h * 90 = 72
    expect(r.totalPay).toBeCloseTo(192, 2);
    expect(r.byStaff.find((b: any) => b.staffId === 3).hours).toBe(0); // open shift
    expect(r.totalPayZar).toMatch(/R/);
  });

  it("composes a payment reminder and delegates send to dispatch", async () => {
    const a = createAgent();
    await a.mount(makeCtx());
    const r: any = await a.handle("payment.remind", { staffId: 1 });
    expect(r.ok).toBe(true);
    expect(r.amount).toBeCloseTo(120, 2);
    expect(r.delegate).toBe("dispatch");
    expect(r.message).toMatch(/Ama Ncube/);
  });

  it("reports unknown intent", async () => {
    const a = createAgent();
    await a.mount(makeCtx());
    const r: any = await a.handle("bogus");
    expect(r.ok).toBe(false);
    expect(r.available).toContain("payroll.summary");
  });
});
