import { describe, it, expect, vi } from "vitest";
import { createAgent } from "../src/index.js";
import { makeCtx } from "@escc/core/test-fixtures";

describe("TimesheetAgent", () => {
  it("throws when not mounted", async () => {
    await expect(createAgent().handle("timesheet.list")).rejects.toThrow(/not mounted/);
  });

  it("lists records", async () => {
    const a = createAgent();
    await a.mount(makeCtx());
    const r: any = await a.handle("timesheet.list");
    expect(r.ok).toBe(true);
    expect(r.records.length).toBe(3);
  });

  it("exports CSV of completed shifts", async () => {
    const a = createAgent();
    await a.mount(makeCtx());
    const r: any = await a.handle("timesheet.export");
    const lines = r.csv.split("\n");
    expect(lines[0]).toBe("staffId,clockIn,clockOut");
    expect(lines.length).toBe(3); // header + 2 completed
  });

  it("requires staffId for clock.in", async () => {
    const a = createAgent();
    await a.mount(makeCtx());
    const r: any = await a.handle("clock.in", {});
    expect(r.ok).toBe(false);
  });

  it("calls the staff API on clock.in", async () => {
    const a = createAgent();
    const fm = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fm);
    await a.mount(makeCtx({ apiBase: "http://x" }));
    const r: any = await a.handle("clock.in", { staffId: 1 });
    expect(r.ok).toBe(true);
    expect(fm).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
