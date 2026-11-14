import { seedWorkspace, solveTask } from "../engineer/engineer.js";
import type { EngineerMode, EngineerResult } from "../engineer/engineer.js";
import type { LLMProvider } from "../llm/types.js";
import type { SandboxLike } from "../sandbox/tools.js";
import { writeFiles } from "./tasks.js";
import type { EvalTask } from "./tasks.js";

export type TaskRun = {
  taskId: string;
  mode: EngineerMode;
  /** Hidden tests pass: the only number that counts as "resolved". */
  resolved: boolean;
  /** Visible tests passed but hidden did not = overfit to the visible tests. */
  overfit: boolean;
  steps: number;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  readOnlyViolations: number;
  reviewerApproved: boolean | undefined;
  error: string | undefined;
  diff: string;
};

export type RunEvalOptions = {
  tasks: EvalTask[];
  modes: EngineerMode[];
  provider: LLMProvider;
  makeSandbox: () => Promise<SandboxLike & { destroy(): Promise<void> }>;
  maxTotalTokens?: number;
  onResult?: (run: TaskRun) => void;
};

export async function runEval(options: RunEvalOptions): Promise<TaskRun[]> {
  const runs: TaskRun[] = [];
  for (const task of options.tasks) {
    for (const mode of options.modes) {
      const run = await runOne(task, mode, options);
      runs.push(run);
      options.onResult?.(run);
    }
  }
  return runs;
}

async function runOne(task: EvalTask, mode: EngineerMode, options: RunEvalOptions): Promise<TaskRun> {
  const sandbox = await options.makeSandbox();
  try {
    await seedWorkspace(sandbox, task.repo);
    let result: EngineerResult;
    try {
      result = await solveTask({
        provider: options.provider,
        sandbox,
        task: task.prompt,
        mode,
        testCommand: task.testCommand,
        ...(options.maxTotalTokens ? { maxTotalTokens: options.maxTotalTokens } : {}),
      });
    } catch (error) {
      return failed(task.id, mode, error);
    }

    // Hidden tests are written only now, after the agents have finished.
    await writeFiles(sandbox, task.hidden);
    const hidden = await sandbox.runTests({ command: task.testCommand });
    const resolved = hidden.exitCode === 0 && !hidden.timedOut;
    return {
      taskId: task.id,
      mode,
      resolved,
      overfit: result.testsPass && !resolved,
      steps: result.steps,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      durationMs: result.durationMs,
      readOnlyViolations: result.phases.filter((p) => p.readOnlyViolation).length,
      reviewerApproved: result.reviewerApproved,
      error: result.error,
      diff: result.diff,
    };
  } finally {
    await sandbox.destroy().catch(() => {});
  }
}

function failed(taskId: string, mode: EngineerMode, error: unknown): TaskRun {
  return {
    taskId, mode, resolved: false, overfit: false, steps: 0, inputTokens: 0, outputTokens: 0,
    durationMs: 0, readOnlyViolations: 0, reviewerApproved: undefined, diff: "",
    error: error instanceof Error ? error.message : String(error),
  };
}
