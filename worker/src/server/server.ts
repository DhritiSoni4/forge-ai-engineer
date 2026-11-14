import { timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { z } from "zod";
import { seedWorkspace, solveTask } from "../engineer/engineer.js";
import type { EngineerEvent } from "../engineer/engineer.js";
import type { LLMProvider } from "../llm/types.js";
import { redact } from "../mcp/redact.js";
import type { SandboxLike } from "../sandbox/tools.js";

export type ForgeServerOptions = {
  createProvider: () => LLMProvider;
  createSandbox: () => Promise<SandboxLike & { destroy(): Promise<void> }>;
  /** If set, every /runs request must send `Authorization: Bearer <token>`. */
  token?: string;
  /** Origins allowed to call the API from a browser. Empty = same-origin tools only. */
  allowedOrigins?: string[];
  maxBodyBytes?: number;
  runTimeoutMs?: number;
  maxTotalTokens?: number;
};

const MAX_FILES = 500;
const MAX_FILE_CHARS = 200_000;

const safePath = z
  .string()
  .min(1)
  .max(300)
  .refine((p) => !p.startsWith("/") && !p.split("/").includes(".."), "path must be relative and stay inside the project");

const runRequest = z.object({
  task: z.string().min(1).max(10_000),
  files: z
    .record(safePath, z.string().max(MAX_FILE_CHARS))
    .refine((f) => Object.keys(f).length > 0 && Object.keys(f).length <= MAX_FILES, `1 to ${MAX_FILES} files`),
  mode: z.enum(["multi", "single"]).default("multi"),
  testCommand: z.string().min(1).max(500).optional(),
});

/**
 * HTTP API in front of the engineer pipeline. POST /runs streams the run as
 * Server-Sent Events. One run at a time: each run owns a Docker container, and
 * this service is meant to run on a dedicated machine (see worker/README.md).
 */
export function createForgeServer(options: ForgeServerOptions): Server {
  const maxBody = options.maxBodyBytes ?? 2_000_000;
  const origins = new Set(options.allowedOrigins ?? []);
  let busy = false;

  return createServer((req, res) => {
    void handle(req, res).catch((error: unknown) => {
      if (!res.headersSent) json(res, 500, { error: "internal error" });
      else res.end();
      console.error(redact(error instanceof Error ? error.message : String(error)));
    });
  });

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    applyCors(req, res);
    const url = new URL(req.url ?? "/", "http://localhost");

    if (req.method === "OPTIONS") return void res.writeHead(204).end();
    if (req.method === "GET" && url.pathname === "/health") return json(res, 200, { ok: true, busy });
    if (!(req.method === "POST" && url.pathname === "/runs")) return json(res, 404, { error: "not found" });

    if (options.token && !authorized(req, options.token)) return json(res, 401, { error: "unauthorized" });
    if (busy) return json(res, 429, { error: "a run is already in progress" });

    let body: unknown;
    try {
      body = JSON.parse(await readBody(req, maxBody));
    } catch (error) {
      const tooBig = error instanceof BodyTooLarge;
      if (tooBig) {
        // Answer first, then drop the connection so the rest of the upload is discarded.
        res.setHeader("Connection", "close");
        res.on("finish", () => req.destroy());
      }
      return json(res, tooBig ? 413 : 400, { error: tooBig ? "request body too large" : "invalid JSON" });
    }
    const parsed = runRequest.safeParse(body);
    if (!parsed.success) {
      return json(res, 400, { error: parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ") });
    }

    busy = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.runTimeoutMs ?? 600_000);
    res.on("close", () => controller.abort());
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    });
    const send = (event: EngineerEvent | { type: "error"; message: string }) => {
      if (!res.writableEnded) res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    let sandbox: Awaited<ReturnType<typeof options.createSandbox>> | undefined;
    try {
      sandbox = await options.createSandbox();
      await seedWorkspace(sandbox, parsed.data.files);
      await solveTask({
        provider: options.createProvider(),
        sandbox,
        task: parsed.data.task,
        mode: parsed.data.mode,
        ...(parsed.data.testCommand ? { testCommand: parsed.data.testCommand } : {}),
        ...(options.maxTotalTokens ? { maxTotalTokens: options.maxTotalTokens } : {}),
        signal: controller.signal,
        onEvent: send,
      });
    } catch (error) {
      send({ type: "error", message: redact(error instanceof Error ? error.message : String(error)) });
    } finally {
      clearTimeout(timer);
      await sandbox?.destroy().catch(() => {});
      busy = false;
      res.end();
    }
  }

  function applyCors(req: IncomingMessage, res: ServerResponse): void {
    const origin = req.headers.origin;
    if (origin && origins.has(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    }
  }
}

class BodyTooLarge extends Error {}

function readBody(req: IncomingMessage, max: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > max) {
        if (chunks.length) chunks.length = 0;
        reject(new BodyTooLarge());
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function authorized(req: IncomingMessage, token: string): boolean {
  const header = req.headers.authorization ?? "";
  const given = Buffer.from(header.startsWith("Bearer ") ? header.slice(7) : "");
  const expected = Buffer.from(token);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

function json(res: ServerResponse, status: number, payload: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify(payload));
}
