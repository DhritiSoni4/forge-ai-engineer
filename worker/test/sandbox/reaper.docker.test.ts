import { existsSync, mkdirSync, mkdtempSync, utimesSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { reapOrphans } from "../../src/sandbox/reaper.js";
import { SandboxTracker, containerExists, docker, sandboxImageAvailable } from "../helpers/docker.js";

const tracker = new SandboxTracker();
afterAll(async () => {
  await tracker.destroyAll();
});

describe.skipIf(!sandboxImageAvailable)("orphan reaper (real Docker)", () => {
  it("removes stale containers, networks, and workspaces but spares live runs", async () => {
    const rootDir = mkdtempSync(join(tmpdir(), "forge-reap-"));
    const suffix = Math.random().toString(16).slice(2, 10);
    const orphanId = `orphan-${suffix}`;
    const hoursAgo = Date.now() - 3 * 60 * 60 * 1000;
    const labels = ["--label", "forge.sandbox=1", "--label", `forge.created=${hoursAgo}`];

    // A crashed worker leaves all three behind.
    docker(["run", "-d", "--name", `forge-sbx-${orphanId}`, ...labels, "--pull", "never", "forge-sandbox:latest", "sleep", "600"]);
    docker(["network", "create", ...labels, `forge-net-${orphanId}`]);
    const orphanDir = join(rootDir, `forge-${orphanId}`);
    mkdirSync(orphanDir);
    const old = new Date(hoursAgo);
    utimesSync(orphanDir, old, old);

    const live = await tracker.create({ rootDir });
    expect(containerExists(`forge-sbx-${orphanId}`)).toBe(true);

    const report = await reapOrphans({ rootDir, maxAgeMs: 2 * 60 * 60 * 1000 });

    expect(report.containers).toContain(`forge-sbx-${orphanId}`);
    expect(report.networks).toContain(`forge-net-${orphanId}`);
    expect(report.workspaces).toContain(`forge-${orphanId}`);
    expect(containerExists(`forge-sbx-${orphanId}`)).toBe(false);
    expect(existsSync(orphanDir)).toBe(false);
    expect(docker(["network", "ls", "--filter", `name=forge-net-${orphanId}`, "--format", "{{.Name}}"])).toBe("");

    // The fresh run is untouched and still works.
    expect(containerExists(live.containerName)).toBe(true);
    expect((await live.exec("echo still-here")).stdout).toBe("still-here\n");
    expect(report.containers).not.toContain(live.containerName);
  });

  it("never touches containers that are not Forge sandboxes", async () => {
    const name = `forge-unrelated-${Math.random().toString(16).slice(2, 8)}`;
    docker(["run", "-d", "--name", name, "--pull", "never", "forge-sandbox:latest", "sleep", "60"]);
    try {
      // Realistic max age: other test files have live sandboxes right now.
      const report = await reapOrphans({ maxAgeMs: 2 * 60 * 60 * 1000 });
      expect(report.containers).not.toContain(name);
      expect(containerExists(name)).toBe(true);
    } finally {
      docker(["rm", "-f", name]);
    }
  });
});
