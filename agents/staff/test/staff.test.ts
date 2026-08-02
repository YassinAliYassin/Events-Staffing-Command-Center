import { describe, it, expect, vi } from "vitest";
import { createAgent } from "../src/index.js";
import { makeCtx } from "@escc/core/test-fixtures";

describe("StaffAgent", () => {
  it("throws when not mounted", async () => {
    const a = createAgent();
    await expect(a.handle("staff.list")).rejects.toThrow(/not mounted/);
  });

  it("reports unknown intent with available capabilities", async () => {
    const a = createAgent();
    await a.mount(makeCtx());
    const r: any = await a.handle("nope.x");
    expect(r.ok).toBe(false);
    expect(r.available).toContain("staff.create");
  });

  it("lists the roster", async () => {
    const a = createAgent();
    await a.mount(makeCtx());
    const r: any = await a.handle("staff.list");
    expect(r.ok).toBe(true);
    expect(r.staff.length).toBe(3);
  });

  it("rejects create without name/rate", async () => {
    const a = createAgent();
    await a.mount(makeCtx());
    const r: any = await a.handle("staff.create", { name: "" });
    expect(r.ok).toBe(false);
  });

  it("calls the staff API on create", async () => {
    const a = createAgent();
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 9 }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await a.mount(makeCtx({ apiBase: "http://x" }));
    const r: any = await a.handle("staff.create", { name: "New Person", rate: 100 });
    expect(r.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith("http://x/api/staff", expect.objectContaining({ method: "POST" }));
    vi.unstubAllGlobals();
  });
});
