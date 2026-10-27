import { fileURLToPath } from "node:url";
import { loadMcpConfig } from "./config.js";
import { McpManager } from "./manager.js";
import type { Logger } from "./manager.js";

const DEFAULT_CONFIG = fileURLToPath(new URL("../../forge.mcp.json", import.meta.url));

export function createManagerFromEnv(logger?: Logger): McpManager {
  const path = process.env["FORGE_MCP_CONFIG"] ?? DEFAULT_CONFIG;
  return new McpManager({
    config: loadMcpConfig(path),
    ...(logger ? { logger } : {}),
  });
}

export const consoleLogger: Logger = (level, message) => {
  console.error(`${level.toUpperCase()} ${message}`);
};
