/**
 * Records the demo traces shown in the UI. The sandbox pipeline, tool execution,
 * test runs, read-only enforcement and verification are all REAL. Only the model's
 * replies are scripted (MockProvider), and every trace is labelled that way.
 *
 *   python3 -m pip install pytest   # once
 *   npm run record:demo
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { solveTask, seedWorkspace } from "../src/engineer/engineer.js";
import type { EngineerEvent } from "../src/engineer/engineer.js";
import { loadTasks, writeFiles } from "../src/eval/tasks.js";
import type { EvalTask } from "../src/eval/tasks.js";
import { MockProvider } from "../src/llm/mock.js";
import type { CompletionResponse } from "../src/llm/types.js";
import { LocalSandbox } from "../test/helpers/localSandbox.js";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "../../frontend/public/traces");
const TEST = "python3 -m pytest -x -q";
const usage = { inputTokens: 1800, outputTokens: 240 };

const say = (text: string): CompletionResponse => ({ content: [{ type: "text", text }], stopReason: "end_turn", usage });
let n = 0;
const call = (name: string, input: unknown, note?: string): CompletionResponse => ({
  content: [
    ...(note ? [{ type: "text" as const, text: note }] : []),
    { type: "tool_use", id: `toolu_${(n += 1)}`, name, input },
  ],
  stopReason: "tool_use",
  usage,
});

type Scenario = {
  id: string;
  title: string;
  lesson: string;
  taskId: string;
  script: (task: EvalTask) => CompletionResponse[];
};

const fileOf = (task: EvalTask, path: string): string => {
  const content = task.solution[path];
  if (content === undefined) throw new Error(`no solution file ${path}`);
  return content;
};

const scenarios: Scenario[] = [
  {
    id: "01-multi-agent-success",
    title: "Fix pagination: Planner → Coder → Reviewer",
    lesson: "The normal path: a read-only plan, an edit, a test run, a review, then harness verification against hidden tests.",
    taskId: "01-pagination",
    script: (t) => [
      call("read_file", { path: "pagination.py" }, "Reading the module under test."),
      call("read_file", { path: "tests/test_visible.py" }),
      say("1. Make paginate() 1-indexed and validate page/per_page.\n2. Make total_pages() round up and validate per_page.\n3. Keep signatures unchanged."),
      call("write_file", { path: "pagination.py", content: fileOf(t, "pagination.py") }, "Applying the planned fixes."),
      call("run_tests", {}),
      say("Made paginate 1-indexed with validation and total_pages round up. Visible tests pass."),
      say("The change matches the task and touches only pagination.py.\nVERDICT: APPROVE"),
    ],
  },
  {
    id: "02-lying-agent-caught",
    title: "A coder claims success but changed nothing",
    lesson: "The harness never trusts the model: it re-runs the tests and diffs against git itself, so a false \"all tests pass\" is reported as a failure, even when the reviewer is fooled.",
    taskId: "03-lru-cache",
    script: () => [
      say("1. Implement LRUCache with an OrderedDict."),
      say("I implemented LRUCache and all tests pass. Nothing else to do."),
      say("Summary reads fine.\nVERDICT: APPROVE"),
    ],
  },
  {
    id: "03-read-only-violation",
    title: "The Planner tries to edit code; the harness reverts it",
    lesson: "Planner and Reviewer are read-only. Their working tree is hashed before and after each phase, and any change is reverted and flagged, so a planner can't sneak in an edit.",
    taskId: "01-pagination",
    script: (t) => [
      call("run_command", { command: "printf 'def paginate(*a):\\n    return []\\n' > pagination.py" }, "Quick experiment while planning."),
      say("1. Fix paginate indexing.\n2. Fix total_pages rounding."),
      call("write_file", { path: "pagination.py", content: fileOf(t, "pagination.py") }),
      call("run_tests", {}),
      say("Fixed both functions; tests pass."),
      say("Diff only contains the intended fix.\nVERDICT: APPROVE"),
    ],
  },
  {
    id: "04-review-rejects-then-revises",
    title: "The Reviewer rejects a half-fix; the Coder revises",
    lesson: "Visible tests passed after the first attempt, but the reviewer spotted that merge() still assumes sorted input. The revision loop fixes it, and the hidden tests confirm.",
    taskId: "04-intervals",
    script: () => [
      say("1. Make overlaps() strict (half-open).\n2. Make merge() robust."),
      call("write_file", {
        path: "intervals.py",
        content:
          "def overlaps(a, b):\n    return a[0] < b[1] and b[0] < a[1]\n\n\ndef merge(intervals):\n    out = []\n    for start, end in intervals:\n        if out and start <= out[-1][1]:\n            out[-1] = (out[-1][0], end)\n        else:\n            out.append((start, end))\n    return out\n",
      }),
      call("run_tests", {}),
      say("overlaps() is now strict. Visible tests pass."),
      say("merge() still iterates the input unsorted and overwrites the end instead of taking the max, so nested or unsorted intervals break. The task requires both.\nVERDICT: REJECT"),
      call("write_file", { path: "intervals.py", content: "" }, "Fixing merge() as the reviewer asked."),
      call("run_tests", {}),
      say("merge() now sorts a copy and uses max(); overlaps() is strict."),
      say("Handles unsorted, nested and touching intervals without mutating the input.\nVERDICT: APPROVE"),
    ],
  },
];

async function record(scenario: Scenario, tasks: EvalTask[]) {
  const task = tasks.find((t) => t.id === scenario.taskId);
  if (!task) throw new Error(`task ${scenario.taskId} not found`);
  const script = scenario.script(task);
  if (scenario.id.startsWith("04")) {
    // The second write needs the real reference solution; fill it in here.
    const second = script[5];
    if (second?.content[1]?.type === "tool_use") (second.content[1].input as { content: string }).content = fileOf(task, "intervals.py");
  }

  const sandbox = await LocalSandbox.create(TEST);
  const events: EngineerEvent[] = [];
  try {
    await seedWorkspace(sandbox, task.repo);
    const result = await solveTask({
      provider: new MockProvider(script),
      sandbox,
      task: task.prompt,
      testCommand: TEST,
      onEvent: (e) => events.push(e),
    });
    await writeFiles(sandbox, task.hidden);
    const hidden = await sandbox.runTests({ command: TEST });
    return {
      meta: {
        id: scenario.id,
        title: scenario.title,
        lesson: scenario.lesson,
        taskId: task.id,
        mode: "multi",
        scripted: true,
        harnessTestsPass: result.testsPass,
        hiddenTestsPass: hidden.exitCode === 0,
        recorded: new Date().toISOString().slice(0, 10),
      },
      task: task.prompt,
      files: Object.keys(task.repo).sort(),
      events,
    };
  } finally {
    await sandbox.destroy();
  }
}

const tasks = await loadTasks(resolve(here, "../eval/tasks"));
await mkdir(outDir, { recursive: true });
const index = [];
for (const scenario of scenarios) {
  const trace = await record(scenario, tasks);
  await writeFile(resolve(outDir, `${scenario.id}.json`), JSON.stringify(trace, null, 1));
  index.push(trace.meta);
  console.error(`${scenario.id}: harness=${trace.meta.harnessTestsPass} hidden=${trace.meta.hiddenTestsPass}`);
}
await writeFile(resolve(outDir, "index.json"), JSON.stringify(index, null, 1));
