import { readdir, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { DockerCli } from "./docker.js";
import type { Docker } from "./docker.js";
import { LABEL_CREATED, LABEL_SANDBOX, WORKSPACE_PREFIX } from "./sandbox.js";

export type ReapOptions = {
  docker?: Docker;
  /** Anything older than this is considered orphaned. Keep it above the container lifetime. */
  maxAgeMs?: number;
  /** Host directory holding per-run workspaces. */
  rootDir?: string;
  now?: number;
};

export type ReapReport = {
  containers: string[];
  networks: string[];
  workspaces: string[];
};

export const DEFAULT_REAP_MAX_AGE_MS = 2 * 60 * 60 * 1000;
const WORKSPACE_DIR = /^forge-[a-z0-9][a-z0-9-]{0,39}$/;

function ageOf(created: string, now: number): number {
  const parsed = Number(created);
  // Unlabeled or garbled timestamps are treated as ancient so they get cleaned.
  return Number.isFinite(parsed) && parsed > 0 ? now - parsed : Number.POSITIVE_INFINITY;
}

/**
 * Safety net for runs whose worker died before cleaning up. It only touches
 * resources carrying Forge's labels or workspace-name pattern.
 */
export async function reapOrphans(options: ReapOptions = {}): Promise<ReapReport> {
  const docker = options.docker ?? new DockerCli();
  const maxAge = options.maxAgeMs ?? DEFAULT_REAP_MAX_AGE_MS;
  const now = options.now ?? Date.now();
  const report: ReapReport = { containers: [], networks: [], workspaces: [] };

  const listed = await docker.run([
    "ps", "-a",
    "--filter", `label=${LABEL_SANDBOX}=1`,
    "--format", `{{.Names}}|{{.Label "${LABEL_CREATED}"}}`,
  ]);
  const surviving = new Set<string>();
  for (const line of listed.stdout.split("\n").filter(Boolean)) {
    const [name = "", created = ""] = line.split("|");
    if (ageOf(created, now) >= maxAge) {
      const removed = await docker.run(["rm", "-f", name]);
      if (removed.exitCode === 0) report.containers.push(name);
    } else {
      surviving.add(name);
    }
  }

  // Networks only after their containers are gone.
  const networks = await docker.run([
    "network", "ls",
    "--filter", `label=${LABEL_SANDBOX}=1`,
    "--format", "{{.Name}}",
  ]);
  for (const name of networks.stdout.split("\n").filter(Boolean)) {
    const inspect = await docker.run([
      "network", "inspect", "--format", `{{index .Labels "${LABEL_CREATED}"}}`, name,
    ]);
    if (ageOf(inspect.stdout.trim(), now) >= maxAge) {
      const removed = await docker.run(["network", "rm", name]);
      if (removed.exitCode === 0) report.networks.push(name);
    }
  }

  if (options.rootDir !== undefined) {
    const entries = await readdir(options.rootDir).catch(() => [] as string[]);
    for (const entry of entries) {
      if (!WORKSPACE_DIR.test(entry)) continue;
      const runId = entry.slice(WORKSPACE_PREFIX.length);
      if (surviving.has(`forge-sbx-${runId}`)) continue;

      const path = join(options.rootDir, entry);
      const info = await stat(path).catch(() => undefined);
      if (info && now - info.mtimeMs >= maxAge) {
        await rm(path, { recursive: true, force: true });
        report.workspaces.push(entry);
      }
    }
  }

  return report;
}

/** Periodic reaper for the long-running worker. The timer never blocks exit. */
export function startReaper(
  intervalMs: number,
  options: ReapOptions = {},
  onReport: (report: ReapReport) => void = () => {},
): () => void {
  const timer = setInterval(() => {
    reapOrphans(options).then(onReport, () => {});
  }, intervalMs);
  timer.unref();
  return () => clearInterval(timer);
}
