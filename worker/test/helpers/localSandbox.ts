import { spawn } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import type { ExecResult } from "../../src/sandbox/sandbox.js";
import type { SandboxLike } from "../../src/sandbox/tools.js";

/**
 * TEST-ONLY stand-in for Sandbox: runs commands directly on the host in a temp
 * directory. It has none of the real sandbox's isolation. It exists so the
 * agent pipeline can be tested deterministically without Docker.
 */
export class LocalSandbox implements SandboxLike {
  private constructor(readonly dir: string, private readonly testCommand: string) {}

  static async create(testCommand: string): Promise<LocalSandbox> {
    return new LocalSandbox(await mkdtemp(join(tmpdir(), "forge-local-")), testCommand);
  }

  async destroy(): Promise<void> {
    await rm(this.dir, { recursive: true, force: true });
  }

  private resolvePath(path: string): string {
    const full = resolve(this.dir, path.replace(/^\/workspace\/?/, ""));
    if (full !== this.dir && !full.startsWith(this.dir + sep)) throw new Error("path escapes workspace");
    return full;
  }

  exec(command: string, options: { cwd?: string | undefined; timeoutSec?: number | undefined; input?: string | undefined } = {}): Promise<ExecResult> {
    const started = Date.now();
    return new Promise((done) => {
      const child = spawn("bash", ["-c", command], {
        cwd: options.cwd ? this.resolvePath(options.cwd) : this.dir,
        env: { PATH: process.env["PATH"] ?? "", HOME: this.dir },
      });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
      child.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
      child.on("close", (code) =>
        done({ stdout, stderr, exitCode: code ?? 1, durationMs: Date.now() - started, timedOut: false, truncated: false }),
      );
      if (options.input !== undefined) child.stdin.end(options.input);
      else child.stdin.end();
    });
  }

  async readFile(path: string): Promise<{ content: string; truncated: boolean }> {
    return { content: await readFile(this.resolvePath(path), "utf8"), truncated: false };
  }

  async writeFile(path: string, content: string): Promise<void> {
    const full = this.resolvePath(path);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, content);
  }

  applyPatch(patch: string, cwd?: string): Promise<ExecResult> {
    return this.exec("git apply --recount --whitespace=nowarn -", { input: patch, cwd });
  }

  runTests(options: { command?: string | undefined } = {}): Promise<ExecResult> {
    return this.exec(options.command ?? this.testCommand);
  }

  cloneRepo(): Promise<string> {
    return Promise.reject(new Error("cloneRepo unsupported in LocalSandbox"));
  }
}
