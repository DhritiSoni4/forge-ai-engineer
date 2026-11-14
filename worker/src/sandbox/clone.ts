import { spawn } from "node:child_process";

export class CloneError extends Error {}

const REF = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,199}$/;
const DIR = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;

export function validateCloneUrl(raw: string, allowedHosts: string[]): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new CloneError("Clone URL is not a valid URL");
  }
  if (url.protocol !== "https:") throw new CloneError("Only https clone URLs are allowed");
  if (url.username || url.password) throw new CloneError("Clone URLs must not embed credentials");
  if (!allowedHosts.includes(url.hostname.toLowerCase())) {
    throw new CloneError(`Clone host not allowed: ${url.hostname}`);
  }
  return url;
}

/** Refs starting with "-" would be parsed by git as options. */
export function validateRef(ref: string): string {
  if (!REF.test(ref) || ref.includes("..")) throw new CloneError(`Invalid git ref: ${ref}`);
  return ref;
}

export function validateDirName(dir: string): string {
  if (!DIR.test(dir) || dir === "." || dir === "..") {
    throw new CloneError(`Invalid directory name: ${dir}`);
  }
  return dir;
}

/**
 * Clones on the host, because the sandbox has no network. git is run with a
 * scrubbed environment (no credentials, no prompts, https only, no hooks).
 */
export function hostClone(url: URL, destination: string, timeoutMs: number): Promise<void> {
  const args = [
    "-c", "protocol.allow=never",
    "-c", "protocol.https.allow=always",
    "-c", "core.hooksPath=/dev/null",
    "-c", "credential.helper=",
    "clone", "--quiet", "--no-tags", "--", url.toString(), destination,
  ];

  return new Promise((resolve, reject) => {
    const child = spawn("git", args, {
      env: {
        PATH: process.env["PATH"] ?? "/usr/bin:/bin",
        GIT_TERMINAL_PROMPT: "0",
        GIT_CONFIG_NOSYSTEM: "1",
        GIT_CONFIG_GLOBAL: "/dev/null",
        HOME: "/nonexistent",
      },
      stdio: ["ignore", "ignore", "pipe"],
    });

    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => {
      if (stderr.length < 4000) stderr += chunk.toString("utf8");
    });
    const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(new CloneError(`git failed to start: ${error.message}`));
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else if (signal) reject(new CloneError(`git clone timed out after ${timeoutMs}ms`));
      else reject(new CloneError(`git clone failed: ${stderr.trim() || `exit ${String(code)}`}`));
    });
  });
}
