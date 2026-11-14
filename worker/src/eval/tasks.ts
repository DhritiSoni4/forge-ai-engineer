import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { seedWorkspace } from "../engineer/engineer.js";
import type { SandboxLike } from "../sandbox/tools.js";

export const DEFAULT_TEST_COMMAND = "python -m pytest -x -q";

export type EvalTask = {
  id: string;
  prompt: string;
  /** Starting repository, including the visible tests the agent can see. */
  repo: Record<string, string>;
  /** Extra tests the agent never sees; they decide whether the task is resolved. */
  hidden: Record<string, string>;
  /** Reference solution files, used only to prove the task is solvable. */
  solution: Record<string, string>;
  testCommand: string;
};

async function readTree(dir: string): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  const walk = async (current: string): Promise<void> => {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) await walk(full);
      else files[relative(dir, full)] = await readFile(full, "utf8");
    }
  };
  if (await stat(dir).then((s) => s.isDirectory(), () => false)) await walk(dir);
  return files;
}

export async function loadTasks(root: string, only?: string[]): Promise<EvalTask[]> {
  const ids = (await readdir(root, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()
    .filter((id) => !only?.length || only.some((prefix) => id.startsWith(prefix)));

  return Promise.all(
    ids.map(async (id) => ({
      id,
      prompt: await readFile(join(root, id, "task.md"), "utf8"),
      repo: await readTree(join(root, id, "repo")),
      hidden: await readTree(join(root, id, "hidden")),
      solution: await readTree(join(root, id, "solution")),
      testCommand: DEFAULT_TEST_COMMAND,
    })),
  );
}

export async function writeFiles(sandbox: SandboxLike, files: Record<string, string>): Promise<void> {
  for (const [path, content] of Object.entries(files)) await sandbox.writeFile(path, content);
}

export type TaskCheck = { id: string; ok: boolean; problems: string[] };

/**
 * Proves a task is fair before any model sees it: the visible tests must fail on
 * the starting repo, the hidden tests must fail on it too (so they measure real
 * work), and the reference solution must pass both.
 */
export async function checkTask(
  task: EvalTask,
  makeSandbox: () => Promise<SandboxLike & { destroy(): Promise<void> }>,
): Promise<TaskCheck> {
  const problems: string[] = [];
  const run = async (label: string, mutate: (s: SandboxLike) => Promise<void>, expectPass: boolean) => {
    const sandbox = await makeSandbox();
    try {
      await seedWorkspace(sandbox, task.repo);
      await mutate(sandbox);
      const result = await sandbox.runTests({ command: task.testCommand });
      if ((result.exitCode === 0) !== expectPass) {
        problems.push(`${label}: expected tests to ${expectPass ? "pass" : "fail"} (exit ${result.exitCode})`);
      }
    } finally {
      await sandbox.destroy();
    }
  };

  await run("starting repo", async () => {}, false);
  await run("starting repo + hidden", (s) => writeFiles(s, task.hidden), false);
  await run("solution + hidden", async (s) => {
    await writeFiles(s, task.solution);
    await writeFiles(s, task.hidden);
  }, true);
  return { id: task.id, ok: problems.length === 0, problems };
}
