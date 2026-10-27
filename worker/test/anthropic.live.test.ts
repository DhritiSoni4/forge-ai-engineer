import { describe, expect, it } from "vitest";
import { runAgent } from "../src/agent/loop.js";
import { AnthropicProvider } from "../src/llm/anthropic.js";
import { ToolRegistry } from "../src/tools/registry.js";
import { addNumbers } from "../src/tools/builtin.js";

// Runs only when a real key is present, so CI without secrets stays green.
const live = process.env.ANTHROPIC_API_KEY ? describe : describe.skip;

live("Anthropic live tool loop", () => {
  it("calls add_numbers and reports the sum", { timeout: 60_000 }, async () => {
    const tools = new ToolRegistry();
    tools.register(addNumbers);

    const result = await runAgent({
      provider: new AnthropicProvider(),
      tools,
      system: "Use the add_numbers tool for arithmetic. Reply with the number only.",
      task: "What is 17 plus 25?",
    });

    expect(result.status).toBe("completed");
    expect(result.finalText).toContain("42");
    expect(result.usage.inputTokens).toBeGreaterThan(0);
  });
});
