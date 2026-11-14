import { spawn } from "node:child_process";

export type DockerResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
  /** The docker client itself was killed because it exceeded `timeoutMs`. */
  timedOut: boolean;
  truncated: boolean;
};

export type DockerRunOptions = {
  input?: string | Buffer;
  timeoutMs?: number;
  /** Per-stream capture cap; excess output is drained and discarded. */
  maxBytes?: number;
};

export interface Docker {
  run(args: string[], options?: DockerRunOptions): Promise<DockerResult>;
}

export class DockerUnavailableError extends Error {}

// The docker CLI only needs its own configuration, not the agent's secrets.
const PASSTHROUGH_ENV = [
  "PATH",
  "HOME",
  "DOCKER_HOST",
  "DOCKER_CONTEXT",
  "DOCKER_CONFIG",
  "DOCKER_CERT_PATH",
  "DOCKER_TLS_VERIFY",
  "XDG_RUNTIME_DIR",
];

const DEFAULT_MAX_BYTES = 4 * 1024 * 1024;

class Capture {
  private readonly chunks: Buffer[] = [];
  private size = 0;
  truncated = false;

  constructor(private readonly max: number) {}

  push(chunk: Buffer): void {
    const room = this.max - this.size;
    if (room <= 0) {
      this.truncated = true;
      return;
    }
    if (chunk.length > room) {
      this.chunks.push(chunk.subarray(0, room));
      this.size = this.max;
      this.truncated = true;
      return;
    }
    this.chunks.push(chunk);
    this.size += chunk.length;
  }

  text(): string {
    return Buffer.concat(this.chunks).toString("utf8");
  }
}

/** Runs the docker CLI with argv arrays only: no shell is ever involved. */
export class DockerCli implements Docker {
  constructor(private readonly bin = "docker") {}

  run(args: string[], options: DockerRunOptions = {}): Promise<DockerResult> {
    const max = options.maxBytes ?? DEFAULT_MAX_BYTES;
    const env: NodeJS.ProcessEnv = {};
    for (const key of PASSTHROUGH_ENV) {
      const value = process.env[key];
      if (value !== undefined) env[key] = value;
    }

    return new Promise((resolve, reject) => {
      const child = spawn(this.bin, args, { env, stdio: ["pipe", "pipe", "pipe"] });
      const stdout = new Capture(max);
      const stderr = new Capture(max);
      let timedOut = false;
      let timer: NodeJS.Timeout | undefined;

      if (options.timeoutMs !== undefined) {
        timer = setTimeout(() => {
          timedOut = true;
          child.kill("SIGKILL");
        }, options.timeoutMs);
      }

      child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
      child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
      child.stdin.on("error", () => {}); // EPIPE when the process exits early
      child.stdin.end(options.input);

      child.on("error", (error: NodeJS.ErrnoException) => {
        clearTimeout(timer);
        reject(
          error.code === "ENOENT"
            ? new DockerUnavailableError("docker CLI not found on PATH")
            : error,
        );
      });

      child.on("close", (code) => {
        clearTimeout(timer);
        resolve({
          stdout: stdout.text(),
          stderr: stderr.text(),
          exitCode: code ?? -1,
          timedOut,
          truncated: stdout.truncated || stderr.truncated,
        });
      });
    });
  }
}
