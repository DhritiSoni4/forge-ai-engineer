import { describe, expect, it } from "vitest";
import { runAgent } from "../src/agent/loop.js";
import { MockProvider } from "../src/llm/mock.js";
import type { CompletionResponse } from "../src/llm/types.js";
import { ToolRegistry, type Tool } from "../src/tools/registry.js";

const usage = { inputTokens: 10, outputTokens: 5 };

function toolCall(id: string, name: string, input: unknown): CompletionResponse {
  return {
    content: [{ type: "tool_use", id, name, input }],
    stopReason: "tool_use",
    usage,
  };
}

function text(value: string): CompletionResponse {
  return {
    content: [{ type: "text", text: value }],
    stopReason: "end_turn",
    usage,
  };
}

function tool(name: string, execute: Tool["execute"]): Tool {
  return {
    name,
    description: `${name} test tool`,
    inputSchema: { type: "object", properties: {} },
    risk: "read",
    execute,
  };
}

function registryWith(...tools: Tool[]): ToolRegistry {
  const registry = new ToolRegistry();
  for (const t of tools) registry.register(t);
  return registry;
}

describe("runAgent", () => {
  it("completes when the model makes no tool calls", async () => {
    const provider = new MockProvider([text("done")]);

    const result = await runAgent({
      provider,
      tools: new ToolRegistry(),
      system: "sys",
      task: "say done",
    });

    expect(result.status).toBe("completed");
    expect(result.finalText).toBe("done");
    expect(result.steps).toBe(1);
    expect(result.usage).toEqual({ inputTokens: 10, outputTokens: 5 });
  });

  it("executes a tool and feeds the result back to the model", async () => {
    const provider = new MockProvider([
      toolCall("t1", "add", { a: 2, b: 3 }),
      text("sum is 5"),
    ]);
    const add = tool("add", async (input) => {
      const { a, b } = input as { a: number; b: number };
      return String(a + b);
    });

    const result = await runAgent({
      provider,
      tools: registryWith(add),
      system: "sys",
      task: "add 2 and 3",
    });

    expect(result.status).toBe("completed");
    expect(result.steps).toBe(2);
    const secondRequest = provider.requests[1];
    expect(secondRequest?.messages.at(-1)).toEqual({
      role: "user",
      content: [
        { type: "tool_result", tool_use_id: "t1", content: "5", is_error: false },
      ],
    });
  });

  it("returns an error result for unknown tools and keeps going", async () => {
    const provider = new MockProvider([
      toolCall("t1", "missing", {}),
      text("recovered"),
    ]);

    const result = await runAgent({
      provider,
      tools: new ToolRegistry(),
      system: "sys",
      task: "x",
    });

    expect(result.status).toBe("completed");
    expect(result.messages[2]?.content[0]).toEqual({
      type: "tool_result",
      tool_use_id: "t1",
      content: "Unknown tool: missing",
      is_error: true,
    });
  });

  it("turns a throwing tool into an error result", async () => {
    const provider = new MockProvider([
      toolCall("t1", "boom", {}),
      text("handled"),
    ]);
    const boom = tool("boom", async () => {
      throw new Error("disk on fire");
    });

    const result = await runAgent({
      provider,
      tools: registryWith(boom),
      system: "sys",
      task: "x",
    });

    expect(result.status).toBe("completed");
    expect(result.messages[2]?.content[0]).toMatchObject({
      is_error: true,
      content: "disk on fire",
    });
  });

  it("times out a hanging tool without hanging the run", async () => {
    const provider = new MockProvider([
      toolCall("t1", "hang", {}),
      text("moved on"),
    ]);
    const hang = tool("hang", () => new Promise<string>(() => {}));

    const result = await runAgent({
      provider,
      tools: registryWith(hang),
      system: "sys",
      task: "x",
      limits: { toolTimeoutMs: 20 },
    });

    expect(result.status).toBe("completed");
    expect(result.messages[2]?.content[0]).toMatchObject({
      is_error: true,
      content: "Tool hang timed out after 20ms",
    });
  });

  it("truncates oversized tool output", async () => {
    const provider = new MockProvider([
      toolCall("t1", "big", {}),
      text("ok"),
    ]);
    const big = tool("big", async () => "x".repeat(500));

    const result = await runAgent({
      provider,
      tools: registryWith(big),
      system: "sys",
      task: "x",
      limits: { maxToolOutputChars: 100 },
    });

    const block = result.messages[2]?.content[0];
    expect(block).toMatchObject({ type: "tool_result", is_error: false });
    expect(
      block?.type === "tool_result" && block.content.startsWith("x".repeat(100)),
    ).toBe(true);
    expect(block?.type === "tool_result" && block.content).toContain(
      "[truncated 400 chars]",
    );
  });

  it("stops at maxSteps when the model keeps calling tools", async () => {
    const provider = new MockProvider(
      Array.from({ length: 5 }, (_, i) => toolCall(`t${i}`, "noop", {})),
    );
    const noop = tool("noop", async () => "ok");

    const result = await runAgent({
      provider,
      tools: registryWith(noop),
      system: "sys",
      task: "loop forever",
      limits: { maxSteps: 3 },
    });

    expect(result.status).toBe("max_steps");
    expect(result.steps).toBe(3);
    expect(provider.requests).toHaveLength(3);
  });

  it("stops when the total token budget is exceeded", async () => {
    const provider = new MockProvider([toolCall("t1", "noop", {}), text("never")]);
    const noop = tool("noop", async () => "ok");

    const result = await runAgent({
      provider,
      tools: registryWith(noop),
      system: "sys",
      task: "x",
      limits: { maxTotalTokens: 10 },
    });

    expect(result.status).toBe("budget_exceeded");
    expect(provider.requests).toHaveLength(1);
  });

  it("reports provider failures instead of throwing", async () => {
    const provider = new MockProvider([]);

    const result = await runAgent({
      provider,
      tools: new ToolRegistry(),
      system: "sys",
      task: "x",
    });

    expect(result.status).toBe("provider_error");
    expect(result.error).toContain("script exhausted");
  });
});
