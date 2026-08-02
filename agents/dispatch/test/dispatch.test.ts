import { describe, it, expect, vi } from "vitest";
import { createAgent } from "../src/index.js";
import { makeCtx } from "@escc/core/test-fixtures";

describe("DispatchAgent", () => {
  it("throws when not mounted", async () => {
    await expect(createAgent().handle("dispatch.event")).rejects.toThrow(/not mounted/);
  });

  it("dispatches a single event to the API", async () => {
    const a = createAgent();
    const fm = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fm);
    await a.mount(makeCtx({ apiBase: "http://x" }));
    const r: any = await a.handle("dispatch.event", { eventId: 1, staffIds: [1, 2] });
    expect(r.ok).toBe(true);
    expect(fm).toHaveBeenCalledWith("http://x/api/dispatch-staff", expect.objectContaining({ method: "POST" }));
    vi.unstubAllGlobals();
  });

  it("dispatches all of today's events in bulk", async () => {
    const a = createAgent();
    const today = new Date().toISOString().slice(0, 10);
    const ctx = makeCtx({ events: [{ id: 7, title: "Now", date: today, venue: "x", staffIds: [1], startTime: "10:00", endTime: "12:00", clientId: 1 }] });
    const fm = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fm);
    await a.mount(ctx);
    const r: any = await a.handle("dispatch.bulk");
    expect(r.ok).toBe(true);
    expect(r.results.length).toBe(1);
    vi.unstubAllGlobals();
  });

  it("validates whatsapp webhook payload", async () => {
    const a = createAgent();
    await a.mount(makeCtx());
    expect((await a.handle("whatsapp.webhook", { from: "2712", body: "hi" })).ok).toBe(true);
    expect((await a.handle("whatsapp.webhook", {})).ok).toBe(false);
  });
});
