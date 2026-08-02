import { describe, it, expect } from "vitest";
import { createAgent } from "../src/index.js";
import { makeCtx } from "@escc/core/test-fixtures";

describe("CrmAgent", () => {
  it("throws when not mounted", async () => {
    await expect(createAgent().handle("client.list")).rejects.toThrow(/not mounted/);
  });

  it("lists clients", async () => {
    const a = createAgent();
    await a.mount(makeCtx());
    const r: any = await a.handle("client.list");
    expect(r.ok).toBe(true);
    expect(r.clients.length).toBe(2);
  });

  it("creates a client with validated fields", async () => {
    const a = createAgent();
    await a.mount(makeCtx());
    const r: any = await a.handle("client.create", { name: "Co", email: "c@co.zw" });
    expect(r.ok).toBe(true);
    expect(r.client.status).toBe("lead");
  });

  it("rejects client.create without name/email", async () => {
    const a = createAgent();
    await a.mount(makeCtx());
    const r: any = await a.handle("client.create", { name: "x" });
    expect(r.ok).toBe(false);
  });

  it("scores a client by event history", async () => {
    const a = createAgent();
    await a.mount(makeCtx());
    const r: any = await a.handle("client.score", { clientId: 1 });
    expect(r.score).toBe(55); // 1 event *15 + 40
  });

  it("validates pipeline stage", async () => {
    const a = createAgent();
    await a.mount(makeCtx());
    expect((await a.handle("pipeline.move", { stage: "won" })).ok).toBe(true);
    expect((await a.handle("pipeline.move", { stage: "bogus" })).ok).toBe(false);
  });
});
