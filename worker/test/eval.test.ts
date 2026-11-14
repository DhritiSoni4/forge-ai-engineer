import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import { MockProvider } from "../src/llm/mock.js";
import type { CompletionResponse } from "../src/llm/types.js";
import { summarize, toMarkdown, wilson, percentile } from "../src/eval/report.js";
import { runEval } from "../src/eval/runner.js";
import { checkTask, loadTasks } from "../src/eval/tasks.js";
import type { EvalTask } from "../src/eval/tasks.js";
import { LocalSandbox } from "./helpers/localSandbox.js";

const hasPytest = spawnSync("python3", ["-m", "pytest", "--version"], { stdio: "ignore" }).status === 0;
const usage = { inputTokens: 100, outputTokens: 50 };
const say = (text: string): CompletionResponse => ({ content: [{ type: "text", text }], stopReason: "end_turn", usage });
const write = (path: string, content: string): CompletionResponse => ({
  content: [{ type: "tool_use", id: `w${Math.random()}`, name: "write_file", input: { path, content } }],
  stopReason: "tool_use",
  usage,
});

const made: LocalSandbox[] = [];
const makeSandbox = async () => {
  const s = await LocalSandbox.create("python3 -m pytest -x -q");
  made.push(s);
  return s;
};
afterEach(async () => {
  await Promise.all(made.splice(0).map((s) => s.destroy()));
});

describe.skipIf(!hasPytest)("bundled eval tasks", () => {
  it("every task is fair: fails at start, fails hidden-only, passes with the reference solution", async () => {
    const tasks = await loadTasks(new URL("../eval/tasks", import.meta.url).pathname);
    expect(tasks.length).toBeGreaterThanOrEqual(10);
    for (const task of tasks) {
      const check = await checkTask({ ...task, testCommand: "python3 -m pytest -x -q" }, makeSandbox);
      expect(check.problems, task.id).toEqual([]);
    }
  }, 120_000);
});

describe.skipIf(!hasPytest)("runEval", () => {
  const task: EvalTask = {
    id: "t1",
    prompt: "make add() return a+b",
    repo: { "m.py": "def add(a, b):\n    return a - b\n", "tests/test_v.py": "from m import add\ndef test_v():\n    assert add(1, 0) == 1\n" },
    hidden: { "tests/test_h.py": "from m import add\ndef test_h():\n    assert add(2, 3) == 5\n" },
    solution: {},
    testCommand: "python3 -m pytest -q",
  };

  it("resolves only when the hidden tests pass, and flags overfitting", async () => {
    const good = "def add(a, b):\n    return a + b\n";
    const overfit = "def add(a, b):\n    return a if b == 0 else a - b\n";
    const run = async (code: string) =>
      (await runEval({ tasks: [task], modes: ["single"], provider: new MockProvider([write("m.py", code), say("done")]), makeSandbox }))[0]!;

    const solved = await run(good);
    expect(solved.resolved).toBe(true);
    expect(solved.overfit).toBe(false);
    expect(solved.inputTokens).toBe(200);

    const cheated = await run(overfit);
    expect(cheated.resolved).toBe(false);
    expect(cheated.overfit).toBe(true);
  });

  it("does not let the agent see hidden tests", async () => {
    const provider = new MockProvider([say("ls")]);
    const [r] = await runEval({ tasks: [task], modes: ["single"], provider, makeSandbox });
    expect(r?.diff).not.toContain("test_h");
    expect(JSON.stringify(provider.requests)).not.toContain("test_h");
  });
});

describe("report", () => {
  it("wilson interval is wide for small n and contains the estimate", () => {
    const [lo, hi] = wilson(7, 10);
    expect(lo).toBeLessThan(0.7);
    expect(hi).toBeGreaterThan(0.7);
    expect(hi - lo).toBeGreaterThan(0.3);
    expect(wilson(0, 0)).toEqual([0, 0]);
  });

  it("percentile and summary math", () => {
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.95)).toBe(10);
    expect(percentile([5], 0.5)).toBe(5);
    const run = (resolved: boolean, mode: "single" | "multi") => ({
      taskId: "a", mode, resolved, overfit: false, steps: 4, inputTokens: 1_000_000, outputTokens: 0,
      durationMs: 2000, readOnlyViolations: 0, reviewerApproved: undefined, error: undefined, diff: "",
    });
    const [single, multi] = summarize([run(true, "single"), run(false, "single"), run(true, "multi")], { inputPerMTok: 3, outputPerMTok: 15 });
    expect(single?.rate).toBe(0.5);
    expect(single?.meanCostUsd).toBeCloseTo(3);
    expect(multi?.resolved).toBe(1);
    expect(toMarkdown([run(true, "multi")], { model: "m", date: "d" })).toContain("n/a");
  });
});
