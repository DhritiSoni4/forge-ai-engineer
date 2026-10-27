import { readFileSync } from "node:fs";
import { z } from "zod";
import type { Risk } from "../tools/registry.js";

export class McpConfigError extends Error {}

const SERVER_NAME = /^[a-z][a-z0-9-]*$/;

const riskSchema = z.enum(["read", "write", "destructive", "external", "network"]);

const common = {
  enabled: z.boolean().default(true),
  // Default deny: only tools named here are exposed to the agent.
  allowTools: z.array(z.string().min(1)),
  risk: riskSchema.default("external"),
  toolRisks: z.record(z.string(), riskSchema).default({}),
  callTimeoutMs: z.number().int().positive().optional(),
};

const stdioSchema = z
  .object({
    transport: z.literal("stdio"),
    command: z.string().min(1),
    args: z.array(z.string()).default([]),
    env: z.record(z.string(), z.string()).default({}),
    ...common,
  })
  .strict();

const httpSchema = z
  .object({
    transport: z.literal("http"),
    url: z.string().min(1),
    headers: z.record(z.string(), z.string()).default({}),
    ...common,
  })
  .strict();

const serverSchema = z.discriminatedUnion("transport", [stdioSchema, httpSchema]);

export const configSchema = z
  .object({
    servers: z.record(z.string().regex(SERVER_NAME), serverSchema),
  })
  .strict();

export type McpServerConfig = z.infer<typeof serverSchema>;
export type McpConfig = z.infer<typeof configSchema>;
export type ServerRisk = Risk;

export function parseMcpConfig(raw: unknown): McpConfig {
  const parsed = configSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new McpConfigError(`Invalid MCP config: ${issues}`);
  }
  return parsed.data;
}

export function loadMcpConfig(path: string): McpConfig {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    throw new McpConfigError(`Cannot read MCP config at ${path}`);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new McpConfigError(`MCP config at ${path} is not valid JSON`);
  }
  return parseMcpConfig(raw);
}

export type ResolvedServer =
  | { transport: "stdio"; command: string; args: string[]; env: Record<string, string> }
  | { transport: "http"; url: URL; headers: Record<string, string> };

const PLACEHOLDER = /\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g;
const SECRET_NAME = /TOKEN|KEY|SECRET|PASSWORD|PASSWD|AUTH|CREDENTIAL/i;

/**
 * Substitutes ${VAR} from the environment. Values of secret-looking variables
 * (or any value when `alwaysSecret` is set, e.g. headers) are recorded for
 * redaction. Plain values such as paths stay visible to the model.
 */
export function resolveTemplate(
  value: string,
  env: NodeJS.ProcessEnv,
  secrets: Set<string>,
  alwaysSecret = false,
): string {
  return value.replace(PLACEHOLDER, (_match, name: string) => {
    const resolved = env[name];
    if (!resolved) {
      throw new McpConfigError(`Environment variable ${name} is not set`);
    }
    if (alwaysSecret || SECRET_NAME.test(name)) secrets.add(resolved);
    return resolved;
  });
}

function resolveRecord(
  record: Record<string, string>,
  env: NodeJS.ProcessEnv,
  secrets: Set<string>,
  alwaysSecret = false,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      resolveTemplate(value, env, secrets, alwaysSecret),
    ]),
  );
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function resolveServer(
  config: McpServerConfig,
  env: NodeJS.ProcessEnv,
  secrets: Set<string>,
): ResolvedServer {
  if (config.transport === "stdio") {
    return {
      transport: "stdio",
      command: config.command,
      args: config.args.map((arg) => resolveTemplate(arg, env, secrets)),
      env: resolveRecord(config.env, env, secrets),
    };
  }

  let url: URL;
  try {
    url = new URL(resolveTemplate(config.url, env, secrets));
  } catch (error) {
    if (error instanceof McpConfigError) throw error;
    throw new McpConfigError("MCP server url is not a valid URL");
  }

  // Credentials must not travel over plaintext to a remote host.
  if (url.protocol !== "https:" && !LOCAL_HOSTS.has(url.hostname)) {
    throw new McpConfigError("MCP http servers must use https unless they are local");
  }

  return {
    transport: "http",
    url,
    headers: resolveRecord(config.headers, env, secrets, true),
  };
}
