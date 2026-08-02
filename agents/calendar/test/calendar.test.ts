import { describe, it, expect, vi } from "vitest";
import { createAgent } from "../src/index.js";
import { makeCtx } from "@escc/core/test-fixtures";

describe("CalendarAgent", () => {
  it("throws when not mounted", async () => {
    await expect(createAgent().handle("event.list")).rejects.toThrow(/not mounted/);
  });

  it("lists events", async () => {
    const a = createAgent();
    await a.mount(makeCtx());
    const r: any = await a.handle("event.list");
    expect(r.ok).toBe(true);
    expect(r.events.length).toBe(2);
  });

  it("rejects event.create without title", async () => {
    const a = createAgent();
    await a.mount(makeCtx());
    const r: any = await a.handle("event.create", {});
    expect(r.ok).toBe(false);
  });

  it("calls the events API on event.create", async () => {
    const a = createAgent();
    const fm = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fm);
    await a.mount(makeCtx({ apiBase: "http://x" }));
    const r: any = await a.handle("event.create", { title: "Party" });
    expect(r.ok).toBe(true);
    expect(fm).toHaveBeenCalledWith("http://x/api/events", expect.objectContaining({ method: "POST" }));
    vi.unstubAllGlobals();
  });

  it("hits apple sync endpoint", async () => {
    const a = createAgent();
    const fm = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fm);
    await a.mount(makeCtx({ apiBase: "http://x" }));
    const r: any = await a.handle("calendar.sync.apple");
    expect(r.ok).toBe(true);
    vi.unstubAllGlobals();
  });
});
