import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { MockProvider } from "../src/llm/mock.js";
import type { CompletionResponse } from "../src/llm/types.js";
import { createForgeServer } from "../src/server/server.js";
import type { ForgeServerOptions } from "../src/server/server.js";
import { runAgent } from "../src/agent/loop.js";
import { ToolRegistry } from "../src/tools/registry.js";
import type { AgentEvent } from "../src/agent/events.js";
import { LocalSandbox } from "./helpers/localSandbox.js";

const usage = { inputTokens: 10, outputTokens: 5 };
const say = (text: string): CompletionResponse => ({ content: [{ type: "text", text }], stopReason: "end_turn", usage });
const write = (path: string, content: string): CompletionResponse => ({
  content: [{ type: "tool_use", id: `w${Math.random()}`, name: "write_file", input: { path, content } }],
  stopReason: "tool_use",
  usage,
});

const closers: Array<() => Promise<void>> = [];
afterEach(async () => {
  await Promise.all(closers.splice(0).map((close) => close()));
});

async function start(overrides: Partial<ForgeServerOptions> = {}, script: CompletionResponse[] = []) {
  const server = createForgeServer({
    createProvider: () => new MockProvider(script),
    createSandbox: () => LocalSandbox.create("grep -qx fixed result.txt"),
    allowedOrigins: ["http://allowed.test"],
    ...overrides,
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  closers.push(() => new Promise((resolve) => server.close(() => resolve())));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

const body = (extra: object = {}) =>
  JSON.stringify({ task: "fix it", files: { "result.txt": "broken\n" }, testCommand: "grep -qx fixed result.txt", ...extra });

async function events(res: Response): Promise<Array<Record<string, unknown>>> {
  const text = await res.text();
  return text.split("\n\n").filter(Boolean).map((chunk) => JSON.parse(chunk.replace(/^data: /, "")));
}

describe("POST /runs", () => {
  it("streams phase, tool, verification and done events for a run", async () => {
    const base = await start({}, [say("plan"), write("result.txt", "fixed\n"), say("done"), say("VERDICT: APPROVE")]);
    const res = await fetch(`${base}/runs`, { method: "POST", body: body() });
    expect(res.headers.get("content-type")).toBe("text/event-stream");
    const evs = await events(res);
    const types = evs.map((e) => e["type"]);
    expect(types[0]).toBe("start");
    expect(types).toContain("verification");
    expect(types.at(-1)).toBe("done");
    expect(evs.filter((e) => e["type"] === "phase_start").map((e) => e["phase"])).toEqual(["planner", "coder", "reviewer"]);
    const call = evs.find((e) => e["type"] === "agent" && (e["event"] as AgentEvent).type === "tool_call");
    expect((call?.["event"] as { name: string }).name).toBe("write_file");
    const done = evs.at(-1) as { result: { testsPass: boolean; diff: string } };
    expect(done.result.testsPass).toBe(true);
    expect(done.result.diff).toContain("+fixed");
  });

  it("rejects bad input before starting anything", async () => {
    const base = await start();
    const post = (b: string) => fetch(`${base}/runs`, { method: "POST", body: b });
    expect((await post("not json")).status).toBe(400);
    expect((await post(body({ task: "" }))).status).toBe(400);
    expect((await post(body({ files: {} }))).status).toBe(400);
    expect((await post(body({ files: { "../escape.txt": "x" } }))).status).toBe(400);
    expect((await post(body({ files: { "/etc/passwd": "x" } }))).status).toBe(400);
    expect((await post(body({ mode: "wild" }))).status).toBe(400);
  });

  it("enforces the body size limit", async () => {
    const base = await start({ maxBodyBytes: 200 });
    const res = await fetch(`${base}/runs`, { method: "POST", body: body({ task: "x".repeat(500) }) });
    expect(res.status).toBe(413);
  });

  it("requires the bearer token when configured", async () => {
    const base = await start({ token: "s3cret-token" });
    expect((await fetch(`${base}/runs`, { method: "POST", body: body() })).status).toBe(401);
    expect((await fetch(`${base}/runs`, { method: "POST", body: body(), headers: { Authorization: "Bearer nope" } })).status).toBe(401);
    const ok = await fetch(`${base}/runs`, {
      method: "POST",
      body: body(),
      headers: { Authorization: "Bearer s3cret-token" },
    });
    expect(ok.status).toBe(200);
    await ok.text();
  });

  it("allows only configured CORS origins", async () => {
    const base = await start();
    const allowed = await fetch(`${base}/health`, { headers: { Origin: "http://allowed.test" } });
    expect(allowed.headers.get("access-control-allow-origin")).toBe("http://allowed.test");
    const denied = await fetch(`${base}/health`, { headers: { Origin: "http://evil.test" } });
    expect(denied.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("allows one run at a time and always destroys the sandbox", async () => {
    let destroyed = 0;
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => (release = resolve));
    const base = await start({
      createProvider: () => ({
        model: "slow",
        async complete() {
          await gate;
          return say("plan");
        },
      }),
      createSandbox: async () => {
        const sandbox = await LocalSandbox.create("false");
        const destroy = sandbox.destroy.bind(sandbox);
        sandbox.destroy = async () => {
          destroyed += 1;
          await destroy();
        };
        return sandbox;
      },
    });
    const first = fetch(`${base}/runs`, { method: "POST", body: body() });
    await new Promise((r) => setTimeout(r, 400));
    expect((await fetch(`${base}/runs`, { method: "POST", body: body() })).status).toBe(429);
    release();
    await (await first).text();
    expect(destroyed).toBe(1);
  });

  it("redacts secret-looking values in streamed events", async () => {
    const base = await start({}, [say("the key is sk-ant-abcdefghijklmnop1234"), say("noop"), say("VERDICT: APPROVE")]);
    const text = await (await fetch(`${base}/runs`, { method: "POST", body: body() })).text();
    expect(text).not.toContain("sk-ant-abcdefghijklmnop1234");
    expect(text).toContain("[REDACTED]");
  });
});

describe("runAgent events and abort", () => {
  it("emits assistant, tool_call and tool_result events", async () => {
    const registry = new ToolRegistry();
    registry.register({ name: "echo", description: "", inputSchema: {}, risk: "read", execute: async () => "hi" });
    const seen: string[] = [];
    await runAgent({
      provider: new MockProvider([
        { content: [{ type: "text", text: "calling" }, { type: "tool_use", id: "1", name: "echo", input: {} }], stopReason: "tool_use", usage },
        say("done"),
      ]),
      tools: registry,
      system: "",
      task: "t",
      onEvent: (e) => seen.push(e.type),
    });
    expect(seen).toEqual(["assistant", "tool_call", "tool_result", "assistant"]);
  });

  it("ends with status aborted when the signal fires, and survives a throwing listener", async () => {
    const controller = new AbortController();
    const result = await runAgent({
      provider: new MockProvider([say("never reached")]),
      tools: new ToolRegistry(),
      system: "",
      task: "t",
      signal: (controller.abort(), controller.signal),
      onEvent: () => {
        throw new Error("listener bug");
      },
    });
    expect(result.status).toBe("aborted");
    expect(result.steps).toBe(0);
  });
});
