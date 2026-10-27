import { runAgent } from "./agent/loop.js";
import { AnthropicProvider } from "./llm/anthropic.js";
import { ToolRegistry } from "./tools/registry.js";
import { addNumbers } from "./tools/builtin.js";
import { consoleLogger, createManagerFromEnv } from "./mcp/setup.js";
import { UNTRUSTED_SYSTEM_NOTICE } from "./mcp/untrusted.js";

const task = process.argv.slice(2).join(" ").trim();

if (!task) {
  console.error('Usage: npm run run:agent -- "<task>"');
  process.exit(2);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is not set. Export it and retry.");
  process.exit(2);
}

const tools = new ToolRegistry();
tools.register(addNumbers);

const mcp = createManagerFromEnv(consoleLogger);
await mcp.start();
mcp.registerInto(tools);

const result = await runAgent({
  provider: new AnthropicProvider(),
  tools,
  system:
    "You are Forge's agent. Use tools when they help and answer concisely.\n\n" +
    UNTRUSTED_SYSTEM_NOTICE,
  task,
});

await mcp.close();

console.log(result.finalText);
console.error(
  `status=${result.status} steps=${result.steps} ` +
    `input_tokens=${result.usage.inputTokens} output_tokens=${result.usage.outputTokens}`,
);
if (result.error) {
  console.error(`error: ${result.error}`);
  process.exit(1);
}
