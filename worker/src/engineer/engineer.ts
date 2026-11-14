import { runAgent, DEFAULT_LIMITS } from "../agent/loop.js";
import type { RunLimits, RunResult } from "../agent/loop.js";
import type { LLMProvider, Usage } from "../llm/types.js";
import { wrapUntrusted } from "../mcp/untrusted.js";
import { clip, createSandboxTools, formatExec } from "../sandbox/tools.js";
import type { SandboxLike } from "../sandbox/tools.js";
import { ToolRegistry } from "../tools/registry.js";
import { CODER_SYSTEM, PLANNER_SYSTEM, REVIEWER_SYSTEM, SINGLE_SYSTEM } from "./prompts.js";

export type EngineerMode = "multi" | "single";
export type PhaseName = "planner" | "coder" | "reviewer";

export type PhaseTrace = {
  name: PhaseName;
  status: RunResult["status"];
  steps: number;
  usage: Usage;
  /** Read-only phases that changed the workspace anyway; the change is reverted. */
  readOnlyViolation: boolean;
};

export type EngineerResult = {
  mode: EngineerMode;
  /** Authoritative: computed by the harness from git, not reported by the model. */
  diff: string;
  /** Authoritative: the harness re-runs the tests after the agents finish. */
  testsPass: boolean;
  testOutput: string;
  phases: PhaseTrace[];
  steps: number;
  usage: Usage;
  durationMs: number;
  reviewerApproved: boolean | undefined;
  error: string | undefined;
};

export type EngineerOptions = {
  provider: LLMProvider;
  sandbox: SandboxLike;
  task: string;
  mode?: EngineerMode;
  testCommand?: string;
  /** Extra coder rounds after a reviewer rejection (multi mode). */
  maxRevisions?: number;
  /** Total token budget shared across all phases. */
  maxTotalTokens?: number;
  limits?: Partial<RunLimits>;
};

const PHASE_STEPS = { planner: 10, coder: 25, reviewer: 10, single: 40 } as const;
const BASE_COMMIT = ["git", "-c", "user.name=forge", "-c", "user.email=forge@localhost"].join(" ");

/** Writes the files, commits them, and returns the base commit the diff is taken against. */
export async function seedWorkspace(
  sandbox: SandboxLike,
  files: Record<string, string>,
): Promise<string> {
  for (const [path, content] of Object.entries(files)) {
    await sandbox.writeFile(path, content);
  }
  if (!(".gitignore" in files)) {
    await sandbox.writeFile(".gitignore", "__pycache__/\n.pytest_cache/\n*.pyc\n");
  }
  const result = await sandbox.exec(
    `git init -q && git add -A && ${BASE_COMMIT} commit -qm base && git rev-parse HEAD`,
  );
  if (result.exitCode !== 0) throw new Error(`seed failed: ${result.stderr}`);
  return result.stdout.trim();
}

export async function solveTask(options: EngineerOptions): Promise<EngineerResult> {
  const started = Date.now();
  const mode = options.mode ?? "multi";
  const { sandbox } = options;
  const testCommand = options.testCommand;
  const budget = options.maxTotalTokens ?? DEFAULT_LIMITS.maxTotalTokens;
  const usage: Usage = { inputTokens: 0, outputTokens: 0 };
  const phases: PhaseTrace[] = [];
  let steps = 0;
  let reviewerApproved: boolean | undefined;
  let error: string | undefined;

  const base = (await sandbox.exec("git rev-parse HEAD")).stdout.trim();
  const allTools = createSandboxTools(sandbox);
  const registryOf = (names: string[]): ToolRegistry => {
    const registry = new ToolRegistry();
    for (const tool of allTools) if (names.includes(tool.name)) registry.register(tool);
    return registry;
  };

  async function phase(
    name: PhaseName,
    system: string,
    task: string,
    tools: string[],
    maxSteps: number,
    readOnly: boolean,
  ): Promise<RunResult> {
    const before = readOnly ? await snapshot(sandbox) : "";
    const used = usage.inputTokens + usage.outputTokens;
    const result = await runAgent({
      provider: options.provider,
      tools: registryOf(tools),
      system,
      task,
      limits: {
        ...options.limits,
        maxSteps,
        maxTotalTokens: Math.max(1, budget - used),
      },
    });
    let violation = false;
    if (readOnly && (await snapshot(sandbox)) !== before) {
      violation = true;
      await restore(sandbox, before);
    }
    usage.inputTokens += result.usage.inputTokens;
    usage.outputTokens += result.usage.outputTokens;
    steps += result.steps;
    phases.push({
      name,
      status: result.status,
      steps: result.steps,
      usage: result.usage,
      readOnlyViolation: violation,
    });
    if (result.error && !error) error = `${name}: ${result.error}`;
    return result;
  }

  const outOfBudget = () => usage.inputTokens + usage.outputTokens >= budget;

  try {
    if (mode === "single") {
      await phase("coder", SINGLE_SYSTEM, taskPrompt(options.task), CODER_TOOLS, PHASE_STEPS.single, false);
    } else {
      const plan = await phase("planner", PLANNER_SYSTEM, taskPrompt(options.task), PLANNER_TOOLS, PHASE_STEPS.planner, true);
      let coderTask = `${taskPrompt(options.task)}\n\nPlan from the Planner:\n${wrapUntrusted("planner", "plan", plan.finalText || "(no plan produced)")}`;

      for (let round = 0; round <= (options.maxRevisions ?? 1); round += 1) {
        if (outOfBudget()) break;
        await phase("coder", CODER_SYSTEM, coderTask, CODER_TOOLS, PHASE_STEPS.coder, false);
        if (outOfBudget()) break;

        const diff = await diffAgainst(sandbox, base);
        const tests = await runVerification(sandbox, testCommand);
        const review = await phase(
          "reviewer",
          REVIEWER_SYSTEM,
          `${taskPrompt(options.task)}\n\nDiff:\n${wrapUntrusted("harness", "diff", clip(diff, 12_000))}\n\nLatest test output:\n${wrapUntrusted("harness", "tests", clip(tests.output, 4_000))}`,
          REVIEWER_TOOLS,
          PHASE_STEPS.reviewer,
          true,
        );
        reviewerApproved = parseVerdict(review.finalText);
        if (reviewerApproved) break;
        coderTask =
          `${taskPrompt(options.task)}\n\nA reviewer rejected your previous attempt. Fix these problems:\n` +
          wrapUntrusted("reviewer", "feedback", clip(review.finalText, 4_000));
      }
    }
  } catch (caught) {
    error = caught instanceof Error ? caught.message : String(caught);
  }

  const diff = await diffAgainst(sandbox, base).catch(() => "");
  const verification = await runVerification(sandbox, testCommand).catch((caught: unknown) => {
    error ??= caught instanceof Error ? caught.message : String(caught);
    return { pass: false, output: "" };
  });

  return {
    mode,
    diff,
    testsPass: verification.pass,
    testOutput: clip(verification.output, 4_000),
    phases,
    steps,
    usage,
    durationMs: Date.now() - started,
    reviewerApproved,
    error,
  };
}

const PLANNER_TOOLS = ["read_file", "run_command"];
const CODER_TOOLS = ["read_file", "write_file", "apply_patch", "run_command", "run_tests"];
const REVIEWER_TOOLS = ["read_file", "run_command", "run_tests"];

function taskPrompt(task: string): string {
  return `Task:\n${task}`;
}

export function parseVerdict(text: string): boolean {
  const last = text.trim().split("\n").at(-1)?.trim().toUpperCase() ?? "";
  return last === "VERDICT: APPROVE";
}

async function runVerification(
  sandbox: SandboxLike,
  testCommand: string | undefined,
): Promise<{ pass: boolean; output: string }> {
  const result = await sandbox.runTests(testCommand ? { command: testCommand } : {});
  return { pass: result.exitCode === 0 && !result.timedOut, output: formatExec(result) };
}

async function diffAgainst(sandbox: SandboxLike, base: string): Promise<string> {
  const result = await sandbox.exec(`git add -A && git diff --cached ${base}`);
  if (result.exitCode !== 0) throw new Error(`diff failed: ${result.stderr}`);
  return result.stdout;
}

/** Content hash of the whole working tree (tracked + untracked, ignoring .gitignored). */
async function snapshot(sandbox: SandboxLike): Promise<string> {
  const result = await sandbox.exec("git add -A && git write-tree");
  if (result.exitCode !== 0) throw new Error(`snapshot failed: ${result.stderr}`);
  return result.stdout.trim();
}

async function restore(sandbox: SandboxLike, tree: string): Promise<void> {
  const result = await sandbox.exec(
    `git read-tree ${tree} && git checkout-index -a -f && git clean -fdq`,
  );
  if (result.exitCode !== 0) throw new Error(`restore failed: ${result.stderr}`);
}

