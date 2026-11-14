import { AnthropicProvider } from "./llm/anthropic.js";
import { Sandbox, installShutdownHandlers } from "./sandbox/sandbox.js";
import { createForgeServer } from "./server/server.js";

const env = process.env;
if (!env["ANTHROPIC_API_KEY"]) {
  console.error("ANTHROPIC_API_KEY is not set.");
  process.exit(2);
}
const host = env["FORGE_HOST"] ?? "127.0.0.1";
const port = Number(env["FORGE_PORT"] ?? 8787);
const token = env["FORGE_API_TOKEN"];
const loopback = ["127.0.0.1", "::1", "localhost"].includes(host);
if (!loopback && !token) {
  console.error("Refusing to listen on a non-loopback address without FORGE_API_TOKEN: this service starts Docker containers.");
  process.exit(2);
}

installShutdownHandlers();
const server = createForgeServer({
  createProvider: () => new AnthropicProvider(env["FORGE_MODEL"] ? { model: env["FORGE_MODEL"] } : {}),
  createSandbox: () => Sandbox.create({ network: { mode: "none" } }),
  ...(token ? { token } : {}),
  allowedOrigins: (env["FORGE_CORS_ORIGINS"] ?? "http://localhost:5173").split(",").map((o) => o.trim()).filter(Boolean),
  ...(env["FORGE_MAX_TOKENS"] ? { maxTotalTokens: Number(env["FORGE_MAX_TOKENS"]) } : {}),
});
server.listen(port, host, () => console.error(`Forge API on http://${host}:${port} (POST /runs, GET /health)`));
