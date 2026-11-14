import { spawnSync } from "node:child_process";
import { Sandbox } from "../../src/sandbox/sandbox.js";
import type { SandboxOptions } from "../../src/sandbox/sandbox.js";

function ok(args: string[]): boolean {
  return spawnSync("docker", args, { stdio: "ignore" }).status === 0;
}

export const dockerAvailable = ok(["info"]);
export const sandboxImageAvailable = dockerAvailable && ok(["image", "inspect", "forge-sandbox:latest"]);
export const proxyImageAvailable =
  dockerAvailable && ok(["image", "inspect", "forge-egress-proxy:latest"]);

export function docker(args: string[]): string {
  const result = spawnSync("docker", args, { encoding: "utf8" });
  return `${result.stdout}${result.stderr}`.trim();
}

export function containerExists(name: string): boolean {
  return docker(["ps", "-a", "--filter", `name=^${name}$`, "--format", "{{.Names}}"]) === name;
}

/** Creates sandboxes and guarantees they are destroyed even if a test throws. */
export class SandboxTracker {
  private readonly created: Sandbox[] = [];

  async create(options: SandboxOptions = {}): Promise<Sandbox> {
    const sandbox = await Sandbox.create(options);
    this.created.push(sandbox);
    return sandbox;
  }

  async destroyAll(): Promise<void> {
    await Promise.all(this.created.map((sandbox) => sandbox.destroy().catch(() => {})));
  }
}
