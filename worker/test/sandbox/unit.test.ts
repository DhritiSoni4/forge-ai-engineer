import { existsSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createProxy, hostAllowed, isPrivateAddress, resolvePublic } from "../../sandbox/proxy/proxy.mjs";
import { CloneError, validateCloneUrl, validateDirName, validateRef } from "../../src/sandbox/clone.js";
import type { Docker, DockerResult, DockerRunOptions } from "../../src/sandbox/docker.js";
import { SandboxPathError, resolveWorkspacePath } from "../../src/sandbox/paths.js";
import { Sandbox } from "../../src/sandbox/sandbox.js";
import { clip, createSandboxTools, formatExec } from "../../src/sandbox/tools.js";

const okResult: DockerResult = { stdout: "", stderr: "", exitCode: 0, timedOut: false, truncated: false };

class FakeDocker implements Docker {
  readonly calls: string[][] = [];
  constructor(private readonly respond: (args: string[]) => Partial<DockerResult> = () => ({})) {}

  async run(args: string[], _options?: DockerRunOptions): Promise<DockerResult> {
    this.calls.push(args);
    return { ...okResult, ...this.respond(args) };
  }
}

const roots: string[] = [];
function root(): string {
  const dir = mkdtempSync(join(tmpdir(), "forge-unit-"));
  roots.push(dir);
  return dir;
}

afterEach(() => {
  delete process.env["ANTHROPIC_API_KEY"];
});

describe("resolveWorkspacePath", () => {
  it("keeps relative and absolute workspace paths inside /workspace", () => {
    expect(resolveWorkspacePath("src/a.py")).toBe("/workspace/src/a.py");
    expect(resolveWorkspacePath("/workspace/repo/./x")).toBe("/workspace/repo/x");
    expect(resolveWorkspacePath(".")).toBe("/workspace");
  });

  it.each(["../etc/passwd", "/etc/passwd", "/workspace/../etc", "a/../../b", "", "a\0b"])(
    "rejects %j",
    (bad) => {
      expect(() => resolveWorkspacePath(bad)).toThrow(SandboxPathError);
    },
  );

  it("does not treat a sibling prefix as inside the workspace", () => {
    expect(() => resolveWorkspacePath("/workspace-evil/x")).toThrow(SandboxPathError);
  });
});

describe("clone validation", () => {
  const hosts = ["github.com"];

  it("accepts https URLs on allowed hosts", () => {
    expect(validateCloneUrl("https://github.com/o/r.git", hosts).hostname).toBe("github.com");
  });

  it.each([
    "http://github.com/o/r",
    "git://github.com/o/r",
    "file:///etc",
    "ssh://git@github.com/o/r",
    "https://evil.example/o/r",
    "https://github.com.evil.example/o/r",
    "https://user:pass@github.com/o/r",
    "not a url",
  ])("rejects %s", (url) => {
    expect(() => validateCloneUrl(url, hosts)).toThrow(CloneError);
  });

  it("rejects refs and dirs that git or the filesystem would misparse", () => {
    for (const ref of ["--upload-pack=evil", "-x", "a..b", "", "a b", "$(x)"]) {
      expect(() => validateRef(ref)).toThrow(CloneError);
    }
    for (const dir of ["..", ".", "a/b", "-rf", ""]) {
      expect(() => validateDirName(dir)).toThrow(CloneError);
    }
    expect(validateRef("a1b2c3d4")).toBe("a1b2c3d4");
    expect(validateRef("feature/x-1.2")).toBe("feature/x-1.2");
  });
});

describe("Sandbox container configuration", () => {
  it("applies the hardening flags and mounts only the workspace", async () => {
    process.env["ANTHROPIC_API_KEY"] = "sk-ant-should-never-reach-the-container";
    const docker = new FakeDocker();
    const sandbox = await Sandbox.create({ runId: "unit-a", rootDir: root(), docker });

    const run = docker.calls.find((args) => args[0] === "run");
    expect(run).toBeDefined();
    const joined = run!.join(" ");

    expect(joined).toContain("--cap-drop ALL");
    expect(joined).toContain("--security-opt no-new-privileges");
    expect(joined).toContain("--read-only");
    expect(joined).toContain("--network none");
    expect(joined).toContain("--pull never");
    expect(run).toContain("--pids-limit");
    expect(run).toContain("--init");

    const memory = run![run!.indexOf("--memory") + 1];
    const swap = run![run!.indexOf("--memory-swap") + 1];
    expect(memory).toBe(swap);

    const user = run![run!.indexOf("--user") + 1];
    expect(user).not.toMatch(/^0(:|$)/);

    const mounts = run!.flatMap((arg, i) => (run![i - 1] === "--mount" ? [arg] : []));
    expect(mounts).toHaveLength(1);
    expect(mounts[0]).toContain("target=/workspace");

    expect(joined).not.toContain("--privileged");
    expect(joined).not.toContain("docker.sock");
    expect(joined).not.toMatch(/(^| )(-v|--volume)( |$)/);
    expect(joined).not.toContain("sk-ant-should-never");
    expect(joined).not.toContain("--network host");

    await sandbox.destroy();
  });

  it("passes through an alternative OCI runtime such as gVisor", async () => {
    const docker = new FakeDocker();
    const sandbox = await Sandbox.create({ runId: "unit-rt", rootDir: root(), docker, runtime: "runsc" });
    const run = docker.calls.find((a) => a[0] === "run")!;
    expect(run[run.indexOf("--runtime") + 1]).toBe("runsc");
    await sandbox.destroy();
  });

  it("points the sandbox at the egress proxy only in allowlist mode", async () => {
    const docker = new FakeDocker();
    const sandbox = await Sandbox.create({
      runId: "unit-b",
      rootDir: root(),
      docker,
      network: { mode: "allowlist", hosts: ["pypi.org", "*.pythonhosted.org"] },
    });

    const run = docker.calls.find((a) => a[0] === "run" && a.includes(sandbox.containerName))!;
    expect(run[run.indexOf("--network") + 1]).toBe("forge-net-unit-b");
    expect(run.join(" ")).toContain("HTTPS_PROXY=http://forge-proxy-unit-b:3128");
    expect(docker.calls.some((a) => a[0] === "network" && a.includes("--internal"))).toBe(true);

    await sandbox.destroy();
    expect(docker.calls.some((a) => a.join(" ") === "network rm forge-net-unit-b")).toBe(true);
    expect(docker.calls.some((a) => a.join(" ") === "rm -f forge-proxy-unit-b")).toBe(true);
  });

  it("rejects bad run ids and empty or malformed allowlists", async () => {
    const docker = new FakeDocker();
    await expect(Sandbox.create({ runId: "../x", rootDir: root(), docker })).rejects.toThrow("Invalid run id");
    await expect(
      Sandbox.create({ runId: "unit-c", rootDir: root(), docker, network: { mode: "allowlist", hosts: [] } }),
    ).rejects.toThrow("allowlist");
    await expect(
      Sandbox.create({ runId: "unit-d", rootDir: root(), docker, network: { mode: "allowlist", hosts: ["a b;rm"] } }),
    ).rejects.toThrow("allowlist");
  });

  it("cleans up the workspace and container when startup fails", async () => {
    const docker = new FakeDocker((args) =>
      args[0] === "run" ? { exitCode: 125, stderr: "boom" } : {},
    );
    const rootDir = root();
    await expect(Sandbox.create({ runId: "unit-e", rootDir, docker })).rejects.toThrow("boom");
    expect(existsSync(join(rootDir, "forge-unit-e"))).toBe(false);
    expect(docker.calls.some((a) => a.join(" ") === "rm -f forge-sbx-unit-e")).toBe(true);
  });

  it("explains a missing image instead of failing obscurely", async () => {
    const docker = new FakeDocker((args) =>
      args[0] === "image" ? { exitCode: 1, stderr: "No such image" } : {},
    );
    await expect(Sandbox.create({ runId: "unit-f", rootDir: root(), docker })).rejects.toThrow(
      "npm run sandbox:build",
    );
  });

  it("destroys the sandbox when a command outlives its hard deadline", async () => {
    const docker = new FakeDocker((args) =>
      args[0] === "exec" ? { timedOut: true, exitCode: -1 } : {},
    );
    const sandbox = await Sandbox.create({ runId: "unit-g", rootDir: root(), docker });

    const result = await sandbox.exec("sleep 1", { timeoutSec: 1 });
    expect(result.timedOut).toBe(true);
    expect(sandbox.isAlive).toBe(false);
    expect(docker.calls.some((a) => a.join(" ") === "rm -f forge-sbx-unit-g")).toBe(true);
    await expect(sandbox.exec("echo hi")).rejects.toThrow("not running");
  });

  it("caps the per-command timeout an agent can request", async () => {
    const docker = new FakeDocker();
    const sandbox = await Sandbox.create({
      runId: "unit-h",
      rootDir: root(),
      docker,
      limits: { maxCommandTimeoutSec: 30 },
    });

    await sandbox.exec("true", { timeoutSec: 99_999 });
    const exec = docker.calls.find((a) => a[0] === "exec")!;
    expect(exec).toContain("30s");
    await sandbox.destroy();
  });

  it("uses argv, never a shell string, for file operations", async () => {
    const docker = new FakeDocker();
    const sandbox = await Sandbox.create({ runId: "unit-i", rootDir: root(), docker });
    await sandbox.writeFile("a'; rm -rf /; echo '.txt", "x");

    const exec = docker.calls.find((a) => a[0] === "exec")!;
    expect(exec).toContain("/workspace/a'; rm -rf /; echo '.txt");
    // The hostile name is a separate argv element passed as $1, never spliced into the script.
    const script = exec[exec.indexOf("-c") + 1];
    expect(script).not.toContain("rm -rf");
    await sandbox.destroy();
  });
});

describe("sandbox tools", () => {
  it("exposes the five required tools plus clone_repo with JSON schemas", async () => {
    const sandbox = await Sandbox.create({ runId: "unit-j", rootDir: root(), docker: new FakeDocker() });
    const tools = createSandboxTools(sandbox);

    expect(tools.map((t) => t.name)).toEqual([
      "run_command", "read_file", "write_file", "apply_patch", "run_tests", "clone_repo",
    ]);
    for (const tool of tools) {
      expect(tool.inputSchema["type"]).toBe("object");
      expect(tool.inputSchema).not.toHaveProperty("$schema");
    }
    expect(tools.find((t) => t.name === "clone_repo")?.risk).toBe("network");
    expect(tools.find((t) => t.name === "read_file")?.risk).toBe("read");
    await sandbox.destroy();
  });

  it("rejects invalid arguments with a readable error", async () => {
    const sandbox = await Sandbox.create({ runId: "unit-k", rootDir: root(), docker: new FakeDocker() });
    const run = createSandboxTools(sandbox).find((t) => t.name === "run_command")!;

    await expect(run.execute({})).rejects.toThrow(/Invalid arguments: command/);
    await expect(run.execute({ command: "ls", timeout_sec: 0 })).rejects.toThrow(/Invalid arguments/);
    await sandbox.destroy();
  });

  it("formats exit code, duration, and clipped output", () => {
    const text = formatExec({
      stdout: "a".repeat(20_000),
      stderr: "err",
      exitCode: 3,
      durationMs: 42,
      timedOut: false,
      truncated: false,
    });
    expect(text).toContain("exit_code: 3");
    expect(text).toContain("duration_ms: 42");
    expect(text).toContain("chars omitted");
    expect(clip("short")).toBe("short");
    expect(clip("x".repeat(100), 40).endsWith("x".repeat(30))).toBe(true);
  });
});

describe("egress proxy rules", () => {
  it("matches exact hosts and subdomain wildcards only", () => {
    const allow = ["pypi.org", "*.pythonhosted.org"];
    expect(hostAllowed("pypi.org", allow)).toBe(true);
    expect(hostAllowed("PYPI.ORG.", allow)).toBe(true);
    expect(hostAllowed("files.pythonhosted.org", allow)).toBe(true);
    expect(hostAllowed("pythonhosted.org", allow)).toBe(false);
    expect(hostAllowed("evilpypi.org", allow)).toBe(false);
    expect(hostAllowed("pypi.org.evil.com", allow)).toBe(false);
  });

  it.each([
    "127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1",
    "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1",
    "::1", "::", "fe80::1", "fc00::1", "::ffff:127.0.0.1", "::ffff:10.0.0.1",
    "not-an-ip",
  ])("treats %s as non-public", (ip) => {
    expect(isPrivateAddress(ip)).toBe(true);
  });

  it.each(["8.8.8.8", "140.82.112.3", "172.32.0.1", "2606:4700:4700::1111"])(
    "treats %s as public",
    (ip) => {
      expect(isPrivateAddress(ip)).toBe(false);
    },
  );

  it("refuses names that resolve to private addresses (DNS rebinding / SSRF)", async () => {
    const lookup = async () => [{ address: "169.254.169.254", family: 4 }];
    await expect(resolvePublic("metadata.evil.example", lookup)).rejects.toThrow("non-public");
    const mixed = async () => [
      { address: "8.8.8.8", family: 4 },
      { address: "10.0.0.1", family: 4 },
    ];
    await expect(resolvePublic("mixed.example", mixed)).rejects.toThrow("non-public");
    const fine = async () => [{ address: "8.8.8.8", family: 4 }];
    await expect(resolvePublic("ok.example", fine)).resolves.toBe("8.8.8.8");
  });

  it("denies non-allowlisted hosts and non-standard ports over plain HTTP", async () => {
    const server = createProxy(["allowed.example"]);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;

    const request = (target: string) =>
      fetch(`http://127.0.0.1:${port}/`, { method: "GET", headers: { host: target } }).then((r) => r.status);
    // A direct (non-proxy) request has a relative URL, which the proxy must refuse.
    expect(await request("allowed.example")).toBe(403);
    await new Promise((resolve) => server.close(resolve));
  });
});
