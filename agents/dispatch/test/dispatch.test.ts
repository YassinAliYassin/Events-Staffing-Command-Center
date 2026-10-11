import { describe, it, expect, vi } from "vitest";
import { createAgent } from "../src/index.js";
import { makeCtx } from "@escc/core/test-fixtures";

describe("DispatchAgent", () => {
  it("throws when not mounted", async () => {
    await expect(createAgent().handle("dispatch.event")).rejects.toThrow(/not mounted/);
  });

  it("builds a run sheet for one event without a network call", async () => {
    const a = createAgent();
    const fm = vi.fn();
    vi.stubGlobal("fetch", fm);
    await a.mount(makeCtx({ apiBase: "http://x" }));
    const r: any = await a.handle("dispatch.event", { eventId: 1 });
    expect(r.ok).toBe(true);
    expect(r.runSheet).toContain("Gala Dinner");
    expect(r.runSheet).toContain("Ama Ncube");
    expect(fm).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("builds run sheets for today's events", async () => {
    const a = createAgent();
    const today = new Date().toISOString().slice(0, 10);
    const ctx = makeCtx({ events: [{ id: 7, title: "Now", date: today, venue: "Hall", staffIds: [1], startTime: "10:00", endTime: "12:00", clientId: 1 }] });
    await a.mount(ctx);
    const r: any = await a.handle("dispatch.bulk");
    expect(r.ok).toBe(true);
    expect(r.results.length).toBe(1);
    expect(r.results[0].runSheet).toContain("Now");
  });

  it("rejects a missing event", async () => {
    const a = createAgent();
    await a.mount(makeCtx());
    expect((await a.handle("dispatch.runsheet", { eventId: 999 })).ok).toBe(false);
  });
});
