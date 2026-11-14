import { afterAll, describe, expect, it } from "vitest";
import { createSandboxTools } from "../../src/sandbox/tools.js";
import { SandboxTracker, sandboxImageAvailable } from "../helpers/docker.js";

const tracker = new SandboxTracker();
afterAll(async () => {
  await tracker.destroyAll();
});

// Needs internet on the host (the clone happens outside the sandbox).
const enabled = sandboxImageAvailable && process.env["FORGE_TEST_NETWORK"] === "1";

describe.skipIf(!enabled)("clone into the sandbox (real Docker + network)", () => {
  const REPO = "https://github.com/octocat/Hello-World";
  const COMMIT = "7fd1a60b01f91b314f59955a4e4d4e80d8edf11d";

  it("clones on the host, checks out the exact commit offline, and edits inside the sandbox", async () => {
    const sandbox = await tracker.create();
    const tools = Object.fromEntries(createSandboxTools(sandbox).map((t) => [t.name, t]));

    expect(await tools["clone_repo"]!.execute({ url: REPO, ref: COMMIT })).toBe("cloned into /workspace/repo");

    const head = await sandbox.exec("git rev-parse HEAD", { cwd: "repo" });
    expect(head.stdout.trim()).toBe(COMMIT);

    await tools["write_file"]!.execute({ path: "repo/NOTES.md", content: "agent was here\n" });
    const status = await sandbox.exec("git status --porcelain", { cwd: "repo" });
    expect(status.stdout).toContain("NOTES.md");

    // The checkout and edits happened with no network inside the container.
    const offline = await sandbox.exec(
      "python3 -c \"import socket; socket.create_connection(('github.com', 443), timeout=3)\"",
    );
    expect(offline.exitCode).not.toBe(0);
  });

  it("rejects a ref that does not exist without leaving the sandbox in a bad state", async () => {
    const sandbox = await tracker.create();
    await expect(sandbox.cloneRepo(REPO, { ref: "deadbeefdeadbeefdeadbeef", dir: "r2" })).rejects.toThrow(
      "checkout",
    );
    expect((await sandbox.exec("echo ok")).stdout).toBe("ok\n");
  });
});
