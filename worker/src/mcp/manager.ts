import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { Tool, ToolRegistry } from "../tools/registry.js";
import { withTimeout } from "../util/timeout.js";
import { McpConfigError, resolveServer } from "./config.js";
import type { McpConfig, McpServerConfig, ResolvedServer } from "./config.js";
import {
  flattenToolResult,
  namespacedName,
  sanitizeDescription,
  truncateText,
} from "./convert.js";
import { redact } from "./redact.js";
import { wrapUntrusted } from "./untrusted.js";

export type ServerState = "connected" | "failed" | "unavailable" | "disabled";

export type ServerStatus = {
  name: string;
  state: ServerState;
  transport: "stdio" | "http";
  toolCount: number;
  error?: string;
  warnings: string[];
};

export type TransportFactory = (name: string, server: ResolvedServer) => Transport;

export type Logger = (level: "info" | "warn" | "error", message: string) => void;

export type McpManagerOptions = {
  config: McpConfig;
  env?: NodeJS.ProcessEnv;
  connectTimeoutMs?: number;
  callTimeoutMs?: number;
  /** Must stay below the agent loop's own output cap so the envelope is never cut. */
  maxOutputChars?: number;
  logger?: Logger;
  transportFactory?: TransportFactory;
};

type Connection = {
  name: string;
  config: McpServerConfig;
  state: ServerState;
  error?: string;
  warnings: string[];
  tools: Tool[];
  secrets: Set<string>;
  client?: Client | undefined;
  discovered: boolean;
  connecting?: Promise<void> | undefined;
};

const CLIENT_INFO = { name: "forge", version: "0.1.0" };

export function defaultTransportFactory(_name: string, server: ResolvedServer): Transport {
  if (server.transport === "stdio") {
    return new StdioClientTransport({
      command: server.command,
      args: server.args,
      env: server.env,
      // Server stderr could echo credentials; do not forward it.
      stderr: "ignore",
    });
  }
  return new StreamableHTTPClientTransport(server.url, {
    requestInit: { headers: server.headers },
  });
}

/**
 * Owns MCP server connections and exposes their allowlisted tools as Forge
 * tools. No failure here (bad config, missing secret, crashed server, hung
 * call) propagates as an exception into the agent loop: tools return errors
 * and the next call reconnects.
 */
export class McpManager {
  private readonly connections = new Map<string, Connection>();
  private readonly usedToolNames = new Set<string>();
  private readonly env: NodeJS.ProcessEnv;
  private readonly connectTimeoutMs: number;
  private readonly callTimeoutMs: number;
  private readonly maxOutputChars: number;
  private readonly logger: Logger;
  private readonly transportFactory: TransportFactory;

  constructor(options: McpManagerOptions) {
    this.env = options.env ?? process.env;
    this.connectTimeoutMs = options.connectTimeoutMs ?? 15_000;
    this.callTimeoutMs = options.callTimeoutMs ?? 30_000;
    this.maxOutputChars = options.maxOutputChars ?? 16_000;
    this.logger = options.logger ?? (() => {});
    this.transportFactory = options.transportFactory ?? defaultTransportFactory;

    for (const [name, config] of Object.entries(options.config.servers)) {
      this.connections.set(name, {
        name,
        config,
        state: config.enabled ? "failed" : "disabled",
        warnings: [],
        tools: [],
        secrets: new Set(),
        discovered: false,
      });
    }
  }

  /**
   * Connects every enabled server that is not already connected, in parallel.
   * Never throws. Safe to call again to retry servers that failed at startup.
   */
  async start(): Promise<void> {
    await Promise.all(
      [...this.connections.values()]
        .filter((conn) => conn.config.enabled && conn.state !== "connected")
        .map((conn) => this.connect(conn)),
    );
  }

  tools(): Tool[] {
    return [...this.connections.values()].flatMap((conn) => conn.tools);
  }

  registerInto(registry: ToolRegistry): void {
    for (const tool of this.tools()) registry.register(tool);
  }

  status(): ServerStatus[] {
    return [...this.connections.values()].map((conn) => ({
      name: conn.name,
      state: conn.state,
      transport: conn.config.transport,
      toolCount: conn.tools.length,
      ...(conn.error ? { error: conn.error } : {}),
      warnings: [...conn.warnings],
    }));
  }

  async close(): Promise<void> {
    await Promise.all(
      [...this.connections.values()].map(async (conn) => {
        const client = conn.client;
        conn.client = undefined;
        if (client) await client.close().catch(() => {});
        if (conn.config.enabled) conn.state = "failed";
      }),
    );
  }

  private connect(conn: Connection): Promise<void> {
    conn.connecting ??= this.doConnect(conn).finally(() => {
      conn.connecting = undefined;
    });
    return conn.connecting;
  }

  private async doConnect(conn: Connection): Promise<void> {
    const previous = conn.client;
    conn.client = undefined;
    if (previous) await previous.close().catch(() => {});

    let client: Client | undefined;
    try {
      const resolved = resolveServer(conn.config, this.env, conn.secrets);
      const transport = this.transportFactory(conn.name, resolved);

      client = new Client(CLIENT_INFO);
      const attempt = client;
      attempt.onclose = () => {
        if (conn.client === attempt) {
          conn.client = undefined;
          conn.state = "failed";
          conn.error = "connection closed";
          this.log("warn", conn, "connection closed");
        }
      };

      await withTimeout(
        attempt.connect(transport),
        this.connectTimeoutMs,
        `Connecting to MCP server ${conn.name}`,
      );
      conn.client = attempt;

      if (!conn.discovered) {
        await withTimeout(
          this.discover(conn, attempt),
          this.connectTimeoutMs,
          `Listing tools for MCP server ${conn.name}`,
        );
        conn.discovered = true;
      }

      conn.state = "connected";
      delete conn.error;
      this.log("info", conn, `connected (${conn.tools.length} tools)`);
    } catch (error) {
      conn.state = error instanceof McpConfigError ? "unavailable" : "failed";
      conn.error = this.safeMessage(conn, error);
      conn.client = undefined;
      if (client) await client.close().catch(() => {});
      this.log("warn", conn, conn.error);
    }
  }

  private async discover(conn: Connection, client: Client): Promise<void> {
    const offered: Awaited<ReturnType<Client["listTools"]>>["tools"] = [];
    let cursor: string | undefined;
    do {
      const page = await client.listTools(cursor ? { cursor } : {});
      offered.push(...page.tools);
      cursor = page.nextCursor;
    } while (cursor);

    const offeredNames = new Set(offered.map((tool) => tool.name));
    for (const allowed of conn.config.allowTools) {
      if (!offeredNames.has(allowed)) {
        conn.warnings.push(`allowlisted tool not offered by server: ${allowed}`);
      }
    }

    const allow = new Set(conn.config.allowTools);
    const tools: Tool[] = [];
    for (const raw of offered) {
      if (!allow.has(raw.name)) continue;

      let name: string;
      try {
        name = namespacedName(conn.name, raw.name);
      } catch (error) {
        conn.warnings.push(`skipped ${raw.name}: ${this.safeMessage(conn, error)}`);
        continue;
      }
      if (this.usedToolNames.has(name)) {
        conn.warnings.push(`skipped ${raw.name}: name collision on ${name}`);
        continue;
      }
      this.usedToolNames.add(name);

      tools.push({
        name,
        description: sanitizeDescription(conn.name, raw.description),
        inputSchema: raw.inputSchema as Record<string, unknown>,
        // Risk comes from config only, never from the server or its output.
        risk: conn.config.toolRisks[raw.name] ?? conn.config.risk,
        execute: (input) => this.callTool(conn, raw.name, input),
      });
    }
    conn.tools = tools;
  }

  private async callTool(conn: Connection, tool: string, input: unknown): Promise<string> {
    if (conn.state !== "connected" || !conn.client) {
      await this.connect(conn);
    }
    const client = conn.client;
    if (conn.state !== "connected" || !client) {
      throw new Error(
        `MCP server "${conn.name}" is unavailable: ${conn.error ?? "unknown error"}`,
      );
    }

    if (input !== undefined && (typeof input !== "object" || input === null || Array.isArray(input))) {
      throw new Error("Tool arguments must be a JSON object");
    }

    let result: unknown;
    try {
      result = await client.callTool(
        { name: tool, arguments: (input ?? {}) as Record<string, unknown> },
        undefined,
        { timeout: conn.config.callTimeoutMs ?? this.callTimeoutMs },
      );
    } catch (error) {
      // Protocol-level errors leave the connection healthy; anything else
      // (timeout, closed pipe) marks it failed so the next call reconnects.
      const protocolError =
        error instanceof McpError &&
        error.code !== ErrorCode.ConnectionClosed &&
        error.code !== ErrorCode.RequestTimeout;
      if (!protocolError) {
        conn.state = "failed";
        conn.error = this.safeMessage(conn, error);
      }
      // No `cause`: the original error may contain unredacted secrets.
      // eslint-disable-next-line preserve-caught-error
      throw new Error(this.safeMessage(conn, error));
    }

    const { text, isError } = flattenToolResult(result);
    const body = truncateText(redact(text, conn.secrets), this.maxOutputChars);
    const wrapped = wrapUntrusted(conn.name, tool, body);
    if (isError) throw new Error(wrapped);
    return wrapped;
  }

  private safeMessage(conn: Connection, error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    return redact(message, conn.secrets);
  }

  private log(level: "info" | "warn" | "error", conn: Connection, message: string): void {
    this.logger(level, `[mcp:${conn.name}] ${redact(message, conn.secrets)}`);
  }
}
