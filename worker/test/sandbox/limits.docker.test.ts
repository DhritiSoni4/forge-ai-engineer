import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir, userInfo } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SandboxPathError } from "../../src/sandbox/paths.js";
import { createSandboxTools } from "../../src/sandbox/tools.js";
import { SandboxTracker, containerExists, docker, sandboxImageAvailable } from "../helpers/docker.js";

const tracker = new SandboxTracker();
const hostDir = mkdtempSync(join(tmpdir(), "forge-host-secret-"));
const hostSecretPath = join(hostDir, "secret.txt");
const HOST_SECRET = "HOST-ONLY-SECRET-4f9c2b";

beforeAll(() => {
  mkdirSync(hostDir, { recursive: true });
  writeFileSync(hostSecretPath, HOST_SECRET);
  process.env["FORGE_TEST_SECRET"] = "env-secret-should-not-leak";
  process.env["ANTHROPIC_API_KEY"] = "sk-ant-env-secret-should-not-leak";
});

afterAll(async () => {
  await tracker.destroyAll();
  delete process.env["FORGE_TEST_SECRET"];
  delete process.env["ANTHROPIC_API_KEY"];
});

describe.skipIf(!sandboxImageAvailable)("sandbox limits (real Docker)", () => {
  it("runs commands and returns stdout, stderr, exit code, and duration", async () => {
    const sandbox = await tracker.create();
    const result = await sandbox.exec("echo out; echo err >&2; exit 3");

    expect(result).toMatchObject({ stdout: "out\n", stderr: "err\n", exitCode: 3, timedOut: false });
    expect(result.durationMs).toBeGreaterThan(0);
  });

  it("keeps state between commands and shares the workspace with the host dir", async () => {
    const sandbox = await tracker.create();
    await sandbox.exec("echo persisted > note.txt");

    expect((await sandbox.exec("cat note.txt")).stdout).toBe("persisted\n");
    expect((await sandbox.readFile("note.txt")).content).toBe("persisted\n");
  });

  it("kills a command at its wall-clock timeout and stays usable", async () => {
    const sandbox = await tracker.create();
    const result = await sandbox.exec("sleep 60", { timeoutSec: 2 });

    expect(result.timedOut).toBe(true);
    expect(result.durationMs).toBeLessThan(8_000);
    // The killed process is really gone, and the sandbox still works.
    const survivors = await sandbox.exec("pgrep -fx 'sleep 60' || echo none");
    expect(survivors.stdout.trim()).toBe("none");
    expect((await sandbox.exec("echo alive")).stdout).toBe("alive\n");
  });

  it("kills the whole process group, not just the shell", async () => {
    const sandbox = await tracker.create();
    const result = await sandbox.exec("(sleep 60 & sleep 60 & wait)", { timeoutSec: 2 });

    expect(result.timedOut).toBe(true);
    expect((await sandbox.exec("pgrep -fx 'sleep 60' || echo none")).stdout.trim()).toBe("none");
  });

  it("enforces the memory limit (OOM-kill, no swap)", async () => {
    const sandbox = await tracker.create({ limits: { memoryMb: 128 } });
    const result = await sandbox.exec(
      "python3 -c \"b = bytearray(600*1024*1024); print('allocated')\"",
    );

    expect(result.stdout).not.toContain("allocated");
    expect(result.exitCode).toBe(137);
    // The container itself survived and the limit is what Docker reports.
    expect((await sandbox.exec("echo ok")).stdout).toBe("ok\n");
    const limit = docker(["inspect", "--format", "{{.HostConfig.Memory}} {{.HostConfig.MemorySwap}}", sandbox.containerName]);
    expect(limit).toBe(`${128 * 1024 * 1024} ${128 * 1024 * 1024}`);
  });

  it("enforces the pids limit (fork bomb is contained)", async () => {
    const sandbox = await tracker.create({ limits: { pids: 32 } });
    const bomb = [
      "import os, time",
      "pids, failed = [], 0",
      "for _ in range(200):",
      "    try:",
      "        pid = os.fork()",
      "    except OSError:",
      "        failed += 1",
      "        continue",
      "    if pid == 0:",
      "        time.sleep(2)",
      "        os._exit(0)",
      "    pids.append(pid)",
      "print('FORKED', len(pids), 'REFUSED', failed)",
      "for pid in pids:",
      "    os.waitpid(pid, 0)",
    ].join("\n");
    await sandbox.writeFile("bomb.py", bomb);

    const result = await sandbox.exec("python3 bomb.py", { timeoutSec: 30 });

    const forked = Number(/FORKED (\d+)/.exec(result.stdout)?.[1]);
    const refused = Number(/REFUSED (\d+)/.exec(result.stdout)?.[1]);
    expect(forked).toBeGreaterThan(0);
    expect(forked).toBeLessThan(32); // the limit counts the parent and the init/sleep processes too
    expect(refused).toBeGreaterThan(0);
    expect(forked + refused).toBe(200);
    expect((await sandbox.exec("echo ok")).stdout).toBe("ok\n");
  });

  it("truncates runaway output instead of buffering it all", async () => {
    const sandbox = await tracker.create();
    const result = await sandbox.exec("head -c 12000000 /dev/zero | tr '\\0' 'a'");

    expect(result.truncated).toBe(true);
    expect(result.stdout.length).toBeLessThanOrEqual(4 * 1024 * 1024);
  });
});

describe.skipIf(!sandboxImageAvailable)("sandbox isolation (real Docker)", () => {
  it("has no network at all: no interfaces, no sockets, no DNS", async () => {
    const sandbox = await tracker.create();

    // Only the unconfigured loopback/tunnel stubs exist: no route to anywhere.
    const routes = (await sandbox.exec("cat /proc/net/route")).stdout.trim().split("\n");
    expect(routes).toHaveLength(1); // header only
    expect((await sandbox.exec("cat /sys/class/net/eth0/operstate")).exitCode).not.toBe(0);

    const connect = await sandbox.exec(
      "python3 -c \"import socket; socket.create_connection(('1.1.1.1', 53), timeout=3)\"",
    );
    expect(connect.exitCode).not.toBe(0);
    expect(connect.stderr).toMatch(/unreachable|refused|Errno|timed out/i);

    const dns = await sandbox.exec("python3 -c \"import socket; socket.gethostbyname('example.com')\"");
    expect(dns.exitCode).not.toBe(0);
    expect(docker(["inspect", "--format", "{{.HostConfig.NetworkMode}}", sandbox.containerName])).toBe("none");
  });

  it("cannot read host paths outside the workspace", async () => {
    const sandbox = await tracker.create();

    const direct = await sandbox.exec(`cat '${hostSecretPath}'`);
    expect(direct.exitCode).not.toBe(0);
    expect(direct.stdout).not.toContain(HOST_SECRET);

    const listing = await sandbox.exec(`ls '${hostDir}'`);
    expect(listing.exitCode).not.toBe(0);
  });

  it("cannot follow a planted symlink to a host path", async () => {
    const sandbox = await tracker.create();
    const result = await sandbox.exec(`ln -s '${hostSecretPath}' trap && cat trap`);

    expect(result.exitCode).not.toBe(0);
    expect(result.stdout).not.toContain(HOST_SECRET);
    // The tools resolve symlinks inside the container too, never on the host.
    await expect(sandbox.readFile("trap")).rejects.toThrow();
  });

  it("sees the container's own /etc/passwd, not the host's, via path traversal", async () => {
    const sandbox = await tracker.create();
    const result = await sandbox.exec("cat ../../../../etc/passwd");

    expect(result.stdout).toContain("root:");
    expect(result.stdout).not.toContain(userInfo().username.length > 3 ? userInfo().username : "\u0000never");
  });

  it("rejects out-of-workspace paths in the file tools before touching Docker", async () => {
    const sandbox = await tracker.create();
    for (const path of ["../../etc/passwd", "/etc/passwd", hostSecretPath]) {
      await expect(sandbox.readFile(path)).rejects.toThrow(SandboxPathError);
      await expect(sandbox.writeFile(path, "x")).rejects.toThrow(SandboxPathError);
    }
    expect((await sandbox.exec("ls /etc/forge-pwned 2>&1 || true")).stdout).toContain("No such file");
  });

  it("runs as non-root with no capabilities and no privilege escalation", async () => {
    const sandbox = await tracker.create();

    expect((await sandbox.exec("id -u")).stdout.trim()).not.toBe("0");
    const status = (await sandbox.exec("grep -E 'CapEff|CapBnd|NoNewPrivs' /proc/self/status")).stdout;
    expect(status).toMatch(/CapEff:\s+0000000000000000/);
    expect(status).toMatch(/CapBnd:\s+0000000000000000/);
    expect(status).toMatch(/NoNewPrivs:\s+1/);
    expect((await sandbox.exec("su -c id root </dev/null")).exitCode).not.toBe(0);
  });

  it("has a read-only root filesystem with writable workspace and /tmp", async () => {
    const sandbox = await tracker.create();

    expect((await sandbox.exec("touch /etc/forge-pwned")).exitCode).not.toBe(0);
    expect((await sandbox.exec("touch /usr/local/bin/forge-pwned")).exitCode).not.toBe(0);
    expect((await sandbox.exec("touch /workspace/ok && touch /tmp/ok")).exitCode).toBe(0);
  });

  it("mounts nothing from the host except the workspace, and has no docker socket", async () => {
    const sandbox = await tracker.create();

    const mounts = JSON.parse(
      docker(["inspect", "--format", "{{json .Mounts}}", sandbox.containerName]),
    ) as Array<{ Type: string; Destination: string; Source: string }>;
    expect(mounts).toHaveLength(1);
    expect(mounts[0]).toMatchObject({ Type: "bind", Destination: "/workspace" });
    expect(mounts[0]?.Source.endsWith(`forge-${sandbox.id}`)).toBe(true);

    expect((await sandbox.exec("test -e /var/run/docker.sock")).exitCode).not.toBe(0);
    expect((await sandbox.exec("test -e /run/docker.sock")).exitCode).not.toBe(0);
  });

  it("is configured with the hardening Docker reports back", async () => {
    const sandbox = await tracker.create();
    const info = JSON.parse(docker(["inspect", "--format", "{{json .HostConfig}}", sandbox.containerName])) as {
      Privileged: boolean; ReadonlyRootfs: boolean; CapDrop: string[]; SecurityOpt: string[];
      PidsLimit: number; NanoCpus: number; PidMode: string;
    };

    expect(info.Privileged).toBe(false);
    expect(info.ReadonlyRootfs).toBe(true);
    expect(info.CapDrop).toEqual(["ALL"]);
    expect(info.SecurityOpt).toContain("no-new-privileges");
    expect(info.PidsLimit).toBe(512);
    expect(info.NanoCpus).toBe(2_000_000_000);
    expect(info.PidMode).toBe("");
  });

  it("holds no host secrets in its environment", async () => {
    const sandbox = await tracker.create();
    const env = (await sandbox.exec("env")).stdout;

    expect(env).not.toContain("env-secret-should-not-leak");
    expect(env).not.toContain("ANTHROPIC_API_KEY");
    expect(env).not.toContain("FORGE_TEST_SECRET");
  });

  it("isolates concurrent runs from each other", async () => {
    const [a, b] = await Promise.all([tracker.create(), tracker.create()]);
    await a.writeFile("only-in-a.txt", "a");

    expect((await a.exec("ls")).stdout).toContain("only-in-a.txt");
    expect((await b.exec("ls")).stdout).not.toContain("only-in-a.txt");
    expect(a.workspaceDir).not.toBe(b.workspaceDir);
  });
});

describe.skipIf(!sandboxImageAvailable)("sandbox cleanup (real Docker)", () => {
  it("removes the container and workspace on destroy, idempotently", async () => {
    const sandbox = await tracker.create();
    await sandbox.writeFile("x.txt", "x");
    expect(containerExists(sandbox.containerName)).toBe(true);

    await sandbox.destroy();
    await sandbox.destroy();

    expect(containerExists(sandbox.containerName)).toBe(false);
    expect(docker(["ps", "-a", "-q", "--filter", `label=forge.run=${sandbox.id}`])).toBe("");
    await expect(sandbox.exec("echo hi")).rejects.toThrow("not running");
  });

  it("leaves nothing behind when the image is missing", async () => {
    const root = mkdtempSync(join(tmpdir(), "forge-missing-"));
    const { Sandbox } = await import("../../src/sandbox/sandbox.js");

    await expect(
      Sandbox.create({ runId: "missing-image", rootDir: root, image: "forge-does-not-exist:nope" }),
    ).rejects.toThrow("not found");
    expect(containerExists("forge-sbx-missing-image")).toBe(false);
  });

  it("cleans up even when the command inside the sandbox fails or times out", async () => {
    const { withSandbox } = await import("../../src/sandbox/sandbox.js");
    let name = "";

    await expect(
      withSandbox({}, async (sandbox) => {
        name = sandbox.containerName;
        await sandbox.exec("sleep 30", { timeoutSec: 1 });
        throw new Error("agent crashed");
      }),
    ).rejects.toThrow("agent crashed");

    expect(name).not.toBe("");
    expect(containerExists(name)).toBe(false);
  });
});

describe.skipIf(!sandboxImageAvailable)("sandbox tools (real Docker)", () => {
  it("lets an agent edit code and run tests end to end", async () => {
    const { runAgent } = await import("../../src/agent/loop.js");
    const { MockProvider } = await import("../../src/llm/mock.js");
    const { ToolRegistry } = await import("../../src/tools/registry.js");

    const sandbox = await tracker.create();
    const registry = new ToolRegistry();
    for (const tool of createSandboxTools(sandbox)) registry.register(tool);

    const usage = { inputTokens: 1, outputTokens: 1 };
    const call = (id: string, name: string, input: unknown) => ({
      content: [{ type: "tool_use" as const, id, name, input }],
      stopReason: "tool_use" as const,
      usage,
    });
    const fix = [
      "--- a/calc.py",
      "+++ b/calc.py",
      "@@ -1,2 +1,2 @@",
      " def add(a, b):",
      "-    return a - b",
      "+    return a + b",
      "",
    ].join("\n");

    const provider = new MockProvider([
      call("1", "write_file", { path: "proj/calc.py", content: "def add(a, b):\n    return a - b\n" }),
      call("2", "write_file", {
        path: "proj/test_calc.py",
        content: "from calc import add\n\ndef test_add():\n    assert add(2, 3) == 5\n",
      }),
      call("3", "run_tests", { cwd: "proj", command: "python -m pytest -q -p no:cacheprovider" }),
      call("4", "apply_patch", { cwd: "proj", patch: fix }),
      call("5", "run_tests", { cwd: "proj", command: "python -m pytest -q -p no:cacheprovider" }),
      call("6", "read_file", { path: "proj/calc.py" }),
      { content: [{ type: "text" as const, text: "fixed" }], stopReason: "end_turn" as const, usage },
    ]);

    const result = await runAgent({ provider, tools: registry, system: "s", task: "fix add" });
    expect(result.status).toBe("completed");

    const toolResults = result.messages.flatMap((m) =>
      m.content.flatMap((b) => (b.type === "tool_result" ? [b] : [])),
    );
    const byId = Object.fromEntries(toolResults.map((r) => [r.tool_use_id, r]));

    expect(byId["3"]?.content).toContain("exit_code: 1");
    expect(byId["3"]?.content).toMatch(/1 failed/);
    expect(byId["4"]).toMatchObject({ is_error: false, content: "patch applied" });
    expect(byId["5"]?.content).toContain("exit_code: 0");
    expect(byId["5"]?.content).toMatch(/1 passed/);
    expect(byId["6"]?.content).toContain("return a + b");
    expect(byId["3"]?.content.startsWith("<untrusted_tool_output")).toBe(true);
  });

  it("reports a patch that does not apply as an error and changes nothing", async () => {
    const sandbox = await tracker.create();
    const tools = Object.fromEntries(createSandboxTools(sandbox).map((t) => [t.name, t]));
    await tools["write_file"]!.execute({ path: "a.py", content: "x = 1\n" });

    const bad = "--- a/a.py\n+++ b/a.py\n@@ -1 +1 @@\n-nope = 1\n+nope = 2\n";
    await expect(tools["apply_patch"]!.execute({ patch: bad })).rejects.toThrow("patch did not apply");
    expect((await sandbox.readFile("a.py")).content).toBe("x = 1\n");
  });

  it("returns non-zero exits as results, not errors, so the agent can react", async () => {
    const sandbox = await tracker.create();
    const run = createSandboxTools(sandbox).find((t) => t.name === "run_command")!;

    const out = await run.execute({ command: "echo boom >&2; exit 7" });
    expect(out).toContain("exit_code: 7");
    expect(out).toContain("boom");
  });

  it("refuses to clone from disallowed hosts before running anything", async () => {
    const sandbox = await tracker.create();
    const clone = createSandboxTools(sandbox).find((t) => t.name === "clone_repo")!;

    await expect(clone.execute({ url: "https://evil.example/o/r" })).rejects.toThrow("not allowed");
    await expect(clone.execute({ url: "http://github.com/o/r" })).rejects.toThrow("https");
    await expect(clone.execute({ url: "https://github.com/o/r", ref: "--upload-pack=x" })).rejects.toThrow(
      "Invalid git ref",
    );
  });
});
