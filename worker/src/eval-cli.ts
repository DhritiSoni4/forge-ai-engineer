import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import type { EngineerMode } from "./engineer/engineer.js";
import { AnthropicProvider } from "./llm/anthropic.js";
import { toMarkdown } from "./eval/report.js";
import { runEval } from "./eval/runner.js";
import { checkTask, loadTasks } from "./eval/tasks.js";
import { Sandbox, installShutdownHandlers } from "./sandbox/sandbox.js";

const HELP = `Usage:
  npm run eval -- [--mode multi|single|both] [--tasks 01,02] [--model ID]
                  [--price-in USD_PER_MTOK --price-out USD_PER_MTOK] [--max-tokens N] [--out FILE]
  npm run eval:validate            # prove every task is solvable (no model, no API key)

Requires Docker and the sandbox image (npm run sandbox:build). The run command also needs ANTHROPIC_API_KEY.
Prices are never assumed; pass them to get cost columns.`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    mode: { type: "string", default: "both" },
    tasks: { type: "string" },
    model: { type: "string" },
    "price-in": { type: "string" },
    "price-out": { type: "string" },
    "max-tokens": { type: "string" },
    out: { type: "string" },
    help: { type: "boolean", short: "h" },
  },
});
if (values.help) {
  console.log(HELP);
  process.exit(0);
}

const here = dirname(fileURLToPath(import.meta.url));
const tasks = await loadTasks(resolve(here, "../eval/tasks"), values.tasks?.split(","));
if (tasks.length === 0) {
  console.error("No tasks matched.");
  process.exit(2);
}
installShutdownHandlers();
const makeSandbox = () => Sandbox.create({ network: { mode: "none" } });

if (positionals[0] === "validate") {
  let failures = 0;
  for (const task of tasks) {
    const check = await checkTask(task, makeSandbox);
    console.log(`${check.ok ? "ok  " : "FAIL"} ${task.id}${check.problems.map((p) => `\n     ${p}`).join("")}`);
    if (!check.ok) failures += 1;
  }
  process.exit(failures ? 1 : 0);
}

if (!process.env["ANTHROPIC_API_KEY"]) {
  console.error("ANTHROPIC_API_KEY is not set.\n\n" + HELP);
  process.exit(2);
}
const modes: EngineerMode[] = values.mode === "both" ? ["single", "multi"] : [values.mode as EngineerMode];
if (!modes.every((m) => m === "single" || m === "multi")) {
  console.error(HELP);
  process.exit(2);
}
const provider = new AnthropicProvider(values.model ? { model: values.model } : {});
const prices =
  values["price-in"] && values["price-out"]
    ? { inputPerMTok: Number(values["price-in"]), outputPerMTok: Number(values["price-out"]) }
    : undefined;

const runs = await runEval({
  tasks,
  modes,
  provider,
  makeSandbox,
  ...(values["max-tokens"] ? { maxTotalTokens: Number(values["max-tokens"]) } : {}),
  onResult: (r) =>
    console.error(`${r.resolved ? "pass" : r.overfit ? "overfit" : "FAIL"} ${r.taskId} [${r.mode}] steps=${r.steps} ${r.error ? `error=${r.error}` : ""}`),
});

const meta = { model: provider.model, date: new Date().toISOString().slice(0, 10) };
const markdown = toMarkdown(runs, meta, prices);
console.log("\n" + markdown);

const out = resolve(values.out ?? `eval/results/${meta.date}-${provider.model}`);
await mkdir(dirname(out), { recursive: true });
await writeFile(`${out}.json`, JSON.stringify({ meta, prices, runs }, null, 2));
await writeFile(`${out}.md`, markdown);
console.error(`wrote ${out}.json and ${out}.md`);
