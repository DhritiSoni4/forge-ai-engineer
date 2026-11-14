import { posix } from "node:path";

export const WORKSPACE = "/workspace";

export class SandboxPathError extends Error {}

/**
 * Maps an agent-supplied path to an absolute path inside the container's
 * workspace. The container is the real boundary; this gives clean errors early
 * and keeps tools from wandering outside the repo.
 */
export function resolveWorkspacePath(input: string): string {
  if (input.includes("\0")) throw new SandboxPathError("Path contains a null byte");
  if (input.trim() === "") throw new SandboxPathError("Path is empty");

  const absolute = input.startsWith("/") ? input : posix.join(WORKSPACE, input);
  const normalized = posix.normalize(absolute);
  if (normalized !== WORKSPACE && !normalized.startsWith(`${WORKSPACE}/`)) {
    throw new SandboxPathError(`Path must stay inside ${WORKSPACE}: ${input}`);
  }
  return normalized;
}
