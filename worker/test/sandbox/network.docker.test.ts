import { afterAll, describe, expect, it } from "vitest";
import { SandboxTracker, containerExists, docker, proxyImageAvailable, sandboxImageAvailable } from "../helpers/docker.js";

const tracker = new SandboxTracker();
afterAll(async () => {
  await tracker.destroyAll();
});

const fetchViaProxy = (url: string) =>
  `python3 - <<'PY'\nimport urllib.request\ntry:\n    r = urllib.request.urlopen('${url}', timeout=20)\n    print('STATUS', r.status)\nexcept Exception as e:\n    print('FAIL', e)\nPY`;

describe.skipIf(!sandboxImageAvailable || !proxyImageAvailable)("network allowlist (real Docker)", () => {
  it("blocks hosts that are not allowlisted and cannot bypass the proxy", async () => {
    const sandbox = await tracker.create({ network: { mode: "allowlist", hosts: ["example.com"] } });

    const denied = await sandbox.exec(fetchViaProxy("https://api.github.com/"));
    expect(denied.stdout).toContain("FAIL");
    expect(denied.stdout).toMatch(/403|Forbidden|Tunnel/i);

    // Ignoring the proxy gets nowhere: the network is internal-only.
    const direct = await sandbox.exec(
      "python3 -c \"import socket; socket.create_connection(('1.1.1.1', 443), timeout=3)\"",
    );
    expect(direct.exitCode).not.toBe(0);

    const metadata = await sandbox.exec(fetchViaProxy("http://169.254.169.254/latest/meta-data/"));
    expect(metadata.stdout).toContain("FAIL");
  });

  it.skipIf(process.env["FORGE_TEST_NETWORK"] !== "1")("allows allowlisted hosts through the proxy", async () => {
    const sandbox = await tracker.create({ network: { mode: "allowlist", hosts: ["example.com"] } });
    const allowed = await sandbox.exec(fetchViaProxy("https://example.com/"));
    expect(allowed.stdout).toContain("STATUS 200");
  });

  it("removes the proxy container and network on destroy", async () => {
    const sandbox = await tracker.create({ network: { mode: "allowlist", hosts: ["example.com"] } });
    const proxy = `forge-proxy-${sandbox.id}`;
    const net = `forge-net-${sandbox.id}`;
    expect(containerExists(proxy)).toBe(true);

    await sandbox.destroy();

    expect(containerExists(proxy)).toBe(false);
    expect(docker(["network", "ls", "--filter", `name=${net}`, "--format", "{{.Name}}"])).toBe("");
  });
});
