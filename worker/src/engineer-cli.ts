import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";
import { seedWorkspace, solveTask } from "./engineer/engineer.js";
import type { EngineerMode } from "./engineer/engineer.js";
import { AnthropicProvider } from "./llm/anthropic.js";
import { Sandbox, installShutdownHandlers } from "./sandbox/sandbox.js";

const HELP = `Usage: npm run engineer -- --dir <project dir> [--mode multi|single] [--test "cmd"] [--model ID] "<task>"

Copies the project into a fresh offline Docker sandbox, runs the Planner -> Coder -> Reviewer
agents, re-runs the tests itself, and prints the resulting diff. Your directory is never modified.
Needs Docker, the sandbox image (npm run sandbox:build), and ANTHROPIC_API_KEY.`;

const SKIP = new Set([".git", "node_modules", "__pycache__", ".venv", "dist", ".pytest_cache"]);
const MAX_FILES = 500;
const MAX_FILE_BYTES = 200_000;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    dir: { type: "string" },
    mode: { type: "string", default: "multi" },
    test: { type: "string" },
    model: { type: "string" },
    help: { type: "boolean", short: "h" },
  },
});
const task = positionals.join(" ").trim();
if (values.help || !values.dir || !task) {
  console.error(HELP);
  process.exit(values.help ? 0 : 2);
}
if (!process.env["ANTHROPIC_API_KEY"]) {
  console.error("ANTHROPIC_API_KEY is not set.");
  process.exit(2);
}

async function readProject(root: string): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  const walk = async (dir: string): Promise<void> => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (SKIP.has(entry.name)) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile() && (await stat(full)).size <= MAX_FILE_BYTES) {
        if (Object.keys(files).length >= MAX_FILES) throw new Error(`more than ${MAX_FILES} files; point --dir at a smaller project`);
        files[relative(root, full)] = await readFile(full, "utf8");
      }
    }
  };
  await walk(root);
  return files;
}

installShutdownHandlers();
const files = await readProject(resolve(values.dir));
const sandbox = await Sandbox.create({ network: { mode: "none" } });
try {
  await seedWorkspace(sandbox, files);
  const result = await solveTask({
    provider: new AnthropicProvider(values.model ? { model: values.model } : {}),
    sandbox,
    task,
    mode: values.mode as EngineerMode,
    ...(values.test ? { testCommand: values.test } : {}),
  });
  for (const p of result.phases) {
    console.error(`${p.name.padEnd(9)} ${p.status} steps=${p.steps} tokens=${p.usage.inputTokens + p.usage.outputTokens}${p.readOnlyViolation ? " READ-ONLY VIOLATION (reverted)" : ""}`);
  }
  console.error(`tests ${result.testsPass ? "PASS" : "FAIL"} · ${result.steps} steps · ${(result.durationMs / 1000).toFixed(1)}s${result.error ? ` · error: ${result.error}` : ""}`);
  console.log(result.diff || "(no changes)");
  process.exitCode = result.testsPass ? 0 : 1;
} finally {
  await sandbox.destroy();
}
