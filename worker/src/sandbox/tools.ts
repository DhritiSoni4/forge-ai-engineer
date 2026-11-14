import { z } from "zod";
import { wrapUntrusted } from "../mcp/untrusted.js";
import type { Tool } from "../tools/registry.js";
import type { ExecResult, Sandbox } from "./sandbox.js";

/** The slice of Sandbox the agent tools need; lets tests and evals swap in a fake. */
export type SandboxLike = Pick<
  Sandbox,
  "exec" | "readFile" | "writeFile" | "applyPatch" | "runTests" | "cloneRepo"
>;

const MAX_STREAM_CHARS = 8000;

function schemaOf(schema: z.ZodType): Record<string, unknown> {
  const { $schema: _ignored, ...rest } = z.toJSONSchema(schema) as Record<string, unknown>;
  return rest;
}

/** Keeps the start and, more usefully for test output, the end of long text. */
export function clip(text: string, max = MAX_STREAM_CHARS): string {
  if (text.length <= max) return text;
  const head = Math.floor(max / 4);
  const tail = max - head;
  return `${text.slice(0, head)}\n[... ${text.length - max} chars omitted ...]\n${text.slice(-tail)}`;
}

export function formatExec(result: ExecResult): string {
  return [
    `exit_code: ${result.exitCode}`,
    `duration_ms: ${result.durationMs}`,
    `timed_out: ${result.timedOut}`,
    ...(result.truncated ? ["output_truncated: true"] : []),
    "--- stdout ---",
    clip(result.stdout),
    "--- stderr ---",
    clip(result.stderr),
  ].join("\n");
}

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input ?? {});
  if (!parsed.success) {
    throw new Error(
      `Invalid arguments: ${parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ")}`,
    );
  }
  return parsed.data;
}

const runCommandInput = z.object({
  command: z.string().min(1).max(10_000).describe("Shell command, run with bash -c"),
  cwd: z.string().optional().describe("Directory inside /workspace (default /workspace)"),
  timeout_sec: z.number().int().min(1).optional().describe("Wall-clock limit in seconds"),
});
const readFileInput = z.object({
  path: z.string().min(1),
  max_bytes: z.number().int().min(1).max(1_000_000).optional(),
});
const writeFileInput = z.object({ path: z.string().min(1), content: z.string() });
const applyPatchInput = z.object({
  patch: z.string().min(1).describe("Unified diff, paths relative to cwd"),
  cwd: z.string().optional().describe("Repo root inside /workspace"),
});
const runTestsInput = z.object({
  command: z.string().min(1).max(10_000).optional().describe("Defaults to the sandbox test command"),
  cwd: z.string().optional(),
  timeout_sec: z.number().int().min(1).optional(),
});
const cloneRepoInput = z.object({
  url: z.string().min(1).describe("https URL on an allowed host"),
  ref: z.string().optional().describe("Branch, tag, or commit to check out"),
  dir: z.string().optional().describe("Directory name under /workspace (default repo)"),
});

/**
 * The agent's view of a sandbox. Everything returned is wrapped as untrusted:
 * file contents and command output can carry instructions planted in a repo.
 */
export function createSandboxTools(sandbox: SandboxLike): Tool[] {
  const wrap = (tool: string, text: string) => wrapUntrusted("sandbox", tool, text);

  return [
    {
      name: "run_command",
      description:
        "Run a shell command in the isolated sandbox (no network, non-root, resource-limited). Returns exit code, stdout, stderr, and duration.",
      inputSchema: schemaOf(runCommandInput),
      risk: "write",
      async execute(input) {
        const args = parse(runCommandInput, input);
        const result = await sandbox.exec(args.command, {
          cwd: args.cwd,
          timeoutSec: args.timeout_sec,
        });
        return wrap("run_command", formatExec(result));
      },
    },
    {
      name: "read_file",
      description: "Read a text file from the sandbox workspace.",
      inputSchema: schemaOf(readFileInput),
      risk: "read",
      async execute(input) {
        const args = parse(readFileInput, input);
        const { content, truncated } = await sandbox.readFile(args.path, args.max_bytes);
        return wrap("read_file", truncated ? `${content}\n[file truncated]` : content);
      },
    },
    {
      name: "write_file",
      description: "Create or overwrite a file in the sandbox workspace. Parent directories are created.",
      inputSchema: schemaOf(writeFileInput),
      risk: "write",
      async execute(input) {
        const args = parse(writeFileInput, input);
        await sandbox.writeFile(args.path, args.content);
        return `wrote ${Buffer.byteLength(args.content, "utf8")} bytes to ${args.path}`;
      },
    },
    {
      name: "apply_patch",
      description: "Apply a unified diff with git apply. Fails atomically: on error nothing is changed.",
      inputSchema: schemaOf(applyPatchInput),
      risk: "write",
      async execute(input) {
        const args = parse(applyPatchInput, input);
        const result = await sandbox.applyPatch(args.patch, args.cwd);
        if (result.exitCode !== 0) {
          throw new Error(`patch did not apply:\n${clip(result.stderr || result.stdout)}`);
        }
        return "patch applied";
      },
    },
    {
      name: "run_tests",
      description: "Run the project's test command in the sandbox and return the result.",
      inputSchema: schemaOf(runTestsInput),
      risk: "write",
      async execute(input) {
        const args = parse(runTestsInput, input);
        const result = await sandbox.runTests({
          command: args.command,
          cwd: args.cwd,
          timeoutSec: args.timeout_sec,
        });
        return wrap("run_tests", formatExec(result));
      },
    },
    {
      name: "clone_repo",
      description:
        "Clone a git repository into the workspace (done outside the sandbox, https only, allowlisted hosts) and optionally check out a ref.",
      inputSchema: schemaOf(cloneRepoInput),
      risk: "network",
      async execute(input) {
        const args = parse(cloneRepoInput, input);
        const path = await sandbox.cloneRepo(args.url, { ref: args.ref, dir: args.dir });
        return `cloned into ${path}`;
      },
    },
  ];
}
