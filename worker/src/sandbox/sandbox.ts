import { randomBytes } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { CloneError, hostClone, validateCloneUrl, validateDirName, validateRef } from "./clone.js";
import { DockerCli, DockerUnavailableError } from "./docker.js";
import type { Docker } from "./docker.js";
import { WORKSPACE, resolveWorkspacePath } from "./paths.js";

const execFileAsync = promisify(execFile);

export const DEFAULT_IMAGE = "forge-sandbox:latest";
export const DEFAULT_PROXY_IMAGE = "forge-egress-proxy:latest";
export const LABEL_SANDBOX = "forge.sandbox";
export const LABEL_RUN = "forge.run";
export const LABEL_CREATED = "forge.created";
export const WORKSPACE_PREFIX = "forge-";

const FALLBACK_UID = 10001;
const HARD_DEADLINE_GRACE_SEC = 10;
const PROXY_PORT = 3128;
const RUN_ID = /^[a-z0-9][a-z0-9-]{0,39}$/;
const HOST_PATTERN = /^(\*\.)?[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/i;

export class SandboxError extends Error {}

export type SandboxLimits = {
  cpus: number;
  memoryMb: number;
  pids: number;
  tmpfsMb: number;
  /** Default per-command wall-clock limit. */
  commandTimeoutSec: number;
  /** Hard ceiling an agent cannot raise. */
  maxCommandTimeoutSec: number;
  testTimeoutSec: number;
  /** The container exits by itself after this long, even if the worker dies. */
  lifetimeSec: number;
  maxFileBytes: number;
};

export const DEFAULT_SANDBOX_LIMITS: SandboxLimits = {
  cpus: 2,
  memoryMb: 2048,
  pids: 512,
  tmpfsMb: 512,
  commandTimeoutSec: 120,
  maxCommandTimeoutSec: 900,
  testTimeoutSec: 600,
  lifetimeSec: 3600,
  maxFileBytes: 1_000_000,
};

export type NetworkPolicy =
  | { mode: "none" }
  | { mode: "allowlist"; hosts: string[] };

export type SandboxOptions = {
  image?: string;
  proxyImage?: string;
  runId?: string;
  /** Host directory under which per-run workspaces are created. */
  rootDir?: string;
  limits?: Partial<SandboxLimits>;
  network?: NetworkPolicy;
  /** Hosts that clone_repo may fetch from (host-side, https only). */
  cloneHosts?: string[];
  testCommand?: string;
  /** OCI runtime, e.g. "runsc" (gVisor) for kernel-level isolation beyond plain Docker. */
  runtime?: string;
  docker?: Docker;
};

export type ExecResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  timedOut: boolean;
  truncated: boolean;
};

export type ExecOptions = {
  timeoutSec?: number | undefined;
  cwd?: string | undefined;
  input?: string | undefined;
};

const live = new Set<Sandbox>();

/**
 * One fresh, locked-down container per agent run. Commands run inside it with
 * `docker exec`; the only host path it can see is its own workspace directory.
 */
export class Sandbox {
  readonly id: string;
  readonly containerName: string;
  readonly workspaceDir: string;
  readonly limits: SandboxLimits;

  private readonly docker: Docker;
  private readonly image: string;
  private readonly proxyImage: string;
  private readonly rootDir: string;
  private readonly network: NetworkPolicy;
  private readonly cloneHosts: string[];
  private readonly testCommand: string;
  private readonly runtime: string | undefined;
  private readonly createdAt = Date.now();
  private readonly networkName: string;
  private readonly proxyName: string;
  private alive = false;
  private destroying: Promise<void> | undefined;

  private constructor(id: string, rootDir: string, options: SandboxOptions) {
    this.id = id;
    this.rootDir = rootDir;
    this.containerName = `forge-sbx-${id}`;
    this.networkName = `forge-net-${id}`;
    this.proxyName = `forge-proxy-${id}`;
    this.workspaceDir = join(rootDir, `${WORKSPACE_PREFIX}${id}`);
    this.limits = { ...DEFAULT_SANDBOX_LIMITS, ...options.limits };
    this.docker = options.docker ?? new DockerCli();
    this.image = options.image ?? DEFAULT_IMAGE;
    this.proxyImage = options.proxyImage ?? DEFAULT_PROXY_IMAGE;
    this.network = options.network ?? { mode: "none" };
    this.cloneHosts = (options.cloneHosts ?? ["github.com"]).map((host) => host.toLowerCase());
    this.testCommand = options.testCommand ?? "python -m pytest -x -q";
    this.runtime = options.runtime;
  }

  static async create(options: SandboxOptions = {}): Promise<Sandbox> {
    const id = options.runId ?? randomBytes(6).toString("hex");
    if (!RUN_ID.test(id)) throw new SandboxError(`Invalid run id: ${id}`);

    const base = options.rootDir ?? join(tmpdir(), "forge-sandbox");
    await mkdir(base, { recursive: true, mode: 0o700 });
    const sandbox = new Sandbox(id, await realpath(base), options);

    try {
      await sandbox.start();
    } catch (error) {
      await sandbox.destroy().catch(() => {});
      throw error;
    }
    return sandbox;
  }

  /** Builds the `docker run` argv. Exposed for tests that assert the hardening. */
  buildRunArgs(uid: number, gid: number): string[] {
    const { limits } = this;
    const labels = this.labels();
    const env: string[] = [
      "HOME=/tmp",
      "LANG=C.UTF-8",
      // The workspace is the only thing in this container worth trusting git on.
      "GIT_CONFIG_COUNT=1",
      "GIT_CONFIG_KEY_0=safe.directory",
      "GIT_CONFIG_VALUE_0=*",
    ];
    if (this.network.mode === "allowlist") {
      const proxy = `http://${this.proxyName}:${PROXY_PORT}`;
      env.push(
        `HTTP_PROXY=${proxy}`, `HTTPS_PROXY=${proxy}`,
        `http_proxy=${proxy}`, `https_proxy=${proxy}`,
        "NO_PROXY=localhost,127.0.0.1", "no_proxy=localhost,127.0.0.1",
      );
    }

    return [
      "run", "-d", "--init", "--pull", "never",
      ...(this.runtime === undefined ? [] : ["--runtime", this.runtime]),
      "--name", this.containerName,
      ...labels.flatMap((label) => ["--label", label]),
      "--user", `${uid}:${gid}`,
      "--read-only",
      "--tmpfs", `/tmp:rw,exec,nosuid,nodev,size=${limits.tmpfsMb}m,mode=1777`,
      "--mount", `type=bind,source=${this.workspaceDir},target=${WORKSPACE}`,
      "--workdir", WORKSPACE,
      "--cpus", String(limits.cpus),
      "--memory", `${limits.memoryMb}m`,
      "--memory-swap", `${limits.memoryMb}m`,
      "--pids-limit", String(limits.pids),
      "--ulimit", "nofile=1024:1024",
      "--ulimit", "core=0",
      "--cap-drop", "ALL",
      "--security-opt", "no-new-privileges",
      "--network", this.network.mode === "allowlist" ? this.networkName : "none",
      ...env.flatMap((entry) => ["--env", entry]),
      this.image,
      "sleep", String(limits.lifetimeSec),
    ];
  }

  private labels(): string[] {
    return [
      `${LABEL_SANDBOX}=1`,
      `${LABEL_RUN}=${this.id}`,
      `${LABEL_CREATED}=${this.createdAt}`,
    ];
  }

  private async start(): Promise<void> {
    await this.requireImage(this.image);

    const hostUid = process.getuid?.() ?? FALLBACK_UID;
    const uid = hostUid === 0 ? FALLBACK_UID : hostUid;
    const gid = hostUid === 0 ? FALLBACK_UID : (process.getgid?.() ?? FALLBACK_UID);

    await mkdir(this.workspaceDir, { mode: 0o700 });
    if (hostUid === 0) await execFileAsync("chown", [`${uid}:${gid}`, this.workspaceDir]);

    if (this.network.mode === "allowlist") await this.startEgressProxy();

    const run = await this.docker.run(this.buildRunArgs(uid, gid));
    if (run.exitCode !== 0) {
      throw new SandboxError(`Failed to start sandbox container: ${run.stderr.trim()}`);
    }
    this.alive = true;
    live.add(this);
  }

  private async requireImage(image: string): Promise<void> {
    const inspect = await this.docker.run(["image", "inspect", "--format", "{{.Id}}", image]);
    if (inspect.exitCode === 0) return;
    if (/Cannot connect to the Docker daemon|Is the docker daemon running/i.test(inspect.stderr)) {
      throw new DockerUnavailableError("Docker daemon is not reachable");
    }
    throw new SandboxError(`Image ${image} not found. Build it with: npm run sandbox:build`);
  }

  private async startEgressProxy(): Promise<void> {
    if (this.network.mode !== "allowlist") return;
    const hosts = this.network.hosts;
    if (hosts.length === 0 || !hosts.every((host) => HOST_PATTERN.test(host))) {
      throw new SandboxError("Network allowlist must be a non-empty list of hostnames");
    }
    await this.requireImage(this.proxyImage);

    const steps: string[][] = [
      ["network", "create", "--internal", ...this.labels().flatMap((l) => ["--label", l]), this.networkName],
      [
        "run", "-d", "--pull", "never", "--name", this.proxyName,
        ...this.labels().flatMap((l) => ["--label", l]),
        "--read-only", "--cap-drop", "ALL", "--security-opt", "no-new-privileges",
        "--memory", "128m", "--pids-limit", "64",
        "--env", `ALLOWED_HOSTS=${hosts.join(",")}`,
        this.proxyImage,
      ],
      ["network", "connect", this.networkName, this.proxyName],
    ];
    for (const args of steps) {
      const result = await this.docker.run(args);
      if (result.exitCode !== 0) {
        throw new SandboxError(`Failed to set up network allowlist: ${result.stderr.trim()}`);
      }
    }
  }

  get isAlive(): boolean {
    return this.alive;
  }

  /** Runs a shell command inside the sandbox. */
  exec(command: string, options: ExecOptions = {}): Promise<ExecResult> {
    return this.execArgv(["bash", "-c", command], options);
  }

  /** Runs argv directly (no shell). */
  async execArgv(argv: string[], options: ExecOptions = {}): Promise<ExecResult> {
    if (!this.alive) throw new SandboxError("Sandbox is not running");

    const timeoutSec = clamp(
      Math.ceil(options.timeoutSec ?? this.limits.commandTimeoutSec),
      1,
      this.limits.maxCommandTimeoutSec,
    );
    const cwd = options.cwd === undefined ? WORKSPACE : resolveWorkspacePath(options.cwd);
    const args = [
      "exec",
      ...(options.input === undefined ? [] : ["-i"]),
      "--workdir", cwd,
      this.containerName,
      // In-container deadline: kills the whole process group, then SIGKILLs.
      "timeout", "-k", "2s", `${timeoutSec}s`,
      ...argv,
    ];

    const started = Date.now();
    const result = await this.docker.run(args, {
      ...(options.input === undefined ? {} : { input: options.input }),
      timeoutMs: (timeoutSec + HARD_DEADLINE_GRACE_SEC) * 1000,
    });
    const durationMs = Date.now() - started;

    if (result.timedOut) {
      // The in-container deadline did not fire (e.g. a process escaped its
      // group). Nothing in this container can be trusted any more; destroy it.
      await this.destroy().catch(() => {});
      return {
        stdout: result.stdout,
        stderr: `${result.stderr}\n[sandbox destroyed: command exceeded its hard deadline]`,
        exitCode: -1,
        durationMs,
        timedOut: true,
        truncated: result.truncated,
      };
    }

    if (result.exitCode !== 0 && /^Error response from daemon:/.test(result.stderr)) {
      throw new SandboxError(result.stderr.trim());
    }

    const timedOut =
      result.exitCode === 124 ||
      (result.exitCode === 137 && durationMs >= timeoutSec * 1000 - 250);

    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      durationMs,
      timedOut,
      truncated: result.truncated,
    };
  }

  async readFile(path: string, maxBytes = 200_000): Promise<{ content: string; truncated: boolean }> {
    const target = resolveWorkspacePath(path);
    const result = await this.execArgv(["head", "-c", String(maxBytes + 1), "--", target]);
    if (result.exitCode !== 0) {
      throw new SandboxError(result.stderr.trim() || `Could not read ${path}`);
    }
    const bytes = Buffer.from(result.stdout, "utf8");
    const truncated = bytes.length > maxBytes;
    return {
      content: truncated ? bytes.subarray(0, maxBytes).toString("utf8") : result.stdout,
      truncated,
    };
  }

  async writeFile(path: string, content: string): Promise<void> {
    const target = resolveWorkspacePath(path);
    if (Buffer.byteLength(content, "utf8") > this.limits.maxFileBytes) {
      throw new SandboxError(`File exceeds ${this.limits.maxFileBytes} bytes`);
    }
    const result = await this.execArgv(
      ["sh", "-c", 'mkdir -p -- "$(dirname -- "$1")" && cat > "$1"', "sh", target],
      { input: content },
    );
    if (result.exitCode !== 0) {
      throw new SandboxError(result.stderr.trim() || `Could not write ${path}`);
    }
  }

  async applyPatch(patch: string, cwd?: string): Promise<ExecResult> {
    if (Buffer.byteLength(patch, "utf8") > this.limits.maxFileBytes) {
      throw new SandboxError(`Patch exceeds ${this.limits.maxFileBytes} bytes`);
    }
    return this.execArgv(["git", "apply", "--recount", "--whitespace=nowarn", "-"], {
      input: patch,
      cwd,
    });
  }

  runTests(
    options: { command?: string | undefined; cwd?: string | undefined; timeoutSec?: number | undefined } = {},
  ): Promise<ExecResult> {
    return this.exec(options.command ?? this.testCommand, {
      timeoutSec: options.timeoutSec ?? this.limits.testTimeoutSec,
      cwd: options.cwd,
    });
  }

  /**
   * Clones on the host (the sandbox is offline), then checks out the ref
   * inside the container. Returns the in-container repo path.
   */
  async cloneRepo(
    rawUrl: string,
    options: { ref?: string | undefined; dir?: string | undefined } = {},
  ): Promise<string> {
    if (!this.alive) throw new SandboxError("Sandbox is not running");
    const url = validateCloneUrl(rawUrl, this.cloneHosts);
    const dir = validateDirName(options.dir ?? "repo");
    const ref = options.ref === undefined ? undefined : validateRef(options.ref);

    await hostClone(url, join(this.workspaceDir, dir), 300_000);
    if (process.getuid?.() === 0) {
      await execFileAsync("chown", ["-R", `${FALLBACK_UID}:${FALLBACK_UID}`, join(this.workspaceDir, dir)]);
    }

    const repoPath = `${WORKSPACE}/${dir}`;
    if (ref !== undefined) {
      const checkout = await this.execArgv(["git", "-C", repoPath, "checkout", "--quiet", "--detach", ref]);
      if (checkout.exitCode !== 0) {
        throw new CloneError(`git checkout ${ref} failed: ${checkout.stderr.trim()}`);
      }
    }
    return repoPath;
  }

  /** Idempotent. Removes the container, proxy, network, and workspace. */
  destroy(): Promise<void> {
    this.destroying ??= this.doDestroy();
    return this.destroying;
  }

  private async doDestroy(): Promise<void> {
    this.alive = false;
    live.delete(this);

    const failures: string[] = [];
    const attempt = async (label: string, args: string[]) => {
      try {
        const result = await this.docker.run(args);
        if (result.exitCode !== 0 && !/No such (container|network)/i.test(result.stderr)) {
          failures.push(`${label}: ${result.stderr.trim()}`);
        }
      } catch (error) {
        failures.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    await attempt("remove container", ["rm", "-f", this.containerName]);
    if (this.network.mode === "allowlist") {
      await attempt("remove proxy", ["rm", "-f", this.proxyName]);
      await attempt("remove network", ["network", "rm", this.networkName]);
    }
    try {
      await rm(this.workspaceDir, { recursive: true, force: true });
    } catch (error) {
      failures.push(`remove workspace: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (failures.length > 0) {
      throw new SandboxError(`Sandbox cleanup incomplete (the reaper will retry): ${failures.join("; ")}`);
    }
  }
}

/** Runs `fn` with a fresh sandbox and always cleans up, even on error. */
export async function withSandbox<T>(
  options: SandboxOptions,
  fn: (sandbox: Sandbox) => Promise<T>,
): Promise<T> {
  const sandbox = await Sandbox.create(options);
  try {
    return await fn(sandbox);
  } finally {
    await sandbox.destroy().catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : String(error));
    });
  }
}

export async function destroyAllSandboxes(): Promise<void> {
  await Promise.all([...live].map((sandbox) => sandbox.destroy().catch(() => {})));
}

/** For CLI entry points: tear sandboxes down on Ctrl-C / SIGTERM. */
export function installShutdownHandlers(): void {
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => {
      void destroyAllSandboxes().finally(() => process.exit(130));
    });
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
