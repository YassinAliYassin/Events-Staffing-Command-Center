/**
 * Contract-level tests for the ESCC agent.
 *
 * These tests exercise only the public API (createAgent / mount / unmount /
 * getStatus / handle) so they are valid for every ESCC agent regardless of
 * domain. They import the compiled output from `dist/`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createAgent } from "../dist/index.js";

const emptyCtx = {
  staff: [],
  events: [],
  clients: [],
  records: [],
  invoices: [],
  quotes: [],
  toast: () => {},
  apiBase: "http://localhost",
};

test("createAgent returns an object implementing the EsccAgent contract", async () => {
  const agent = createAgent();
  assert.equal(typeof agent.mount, "function");
  assert.equal(typeof agent.handle, "function");
  assert.equal(typeof agent.getStatus, "function");
  assert.equal(typeof agent.unmount, "function");
  assert.ok(agent.manifest, "agent should expose a manifest");
  assert.ok(Array.isArray(agent.manifest.capabilities), "capabilities should be an array");
  assert.ok(agent.manifest.capabilities.length > 0, "agent should declare >= 1 capability");
});

test("lifecycle: mount -> active, unmount -> idle", async () => {
  const agent = createAgent();
  assert.equal(agent.getStatus(), "idle");
  await agent.mount(emptyCtx);
  assert.equal(agent.getStatus(), "active");
  agent.unmount();
  assert.equal(agent.getStatus(), "idle");
});

test("handle on an unmounted agent rejects", async () => {
  const agent = createAgent();
  await assert.rejects(() => agent.handle("anything"), /not mounted/i);
});

test("unknown intent returns a structured error", async () => {
  const agent = createAgent();
  await agent.mount(emptyCtx);
  const res = await agent.handle("does.not.exist");
  assert.equal(res.ok, false);
  assert.ok(res.error, "should include an error message");
  assert.ok(res.available, "should list available capabilities");
});
