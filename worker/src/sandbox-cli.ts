import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { reapOrphans } from "./sandbox/reaper.js";
import { DEFAULT_IMAGE, DEFAULT_PROXY_IMAGE } from "./sandbox/sandbox.js";

const command = process.argv[2];

function build(tag: string, context: string): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn("docker", ["build", "-t", tag, context], { stdio: "inherit" });
    child.on("close", (code) => resolve(code ?? 1));
    child.on("error", () => resolve(1));
  });
}

if (command === "build") {
  const imageDir = fileURLToPath(new URL("../sandbox/image", import.meta.url));
  const proxyDir = fileURLToPath(new URL("../sandbox/proxy", import.meta.url));
  const first = await build(DEFAULT_IMAGE, imageDir);
  const second = first === 0 ? await build(DEFAULT_PROXY_IMAGE, proxyDir) : first;
  process.exit(second);
} else if (command === "reap") {
  const report = await reapOrphans({ rootDir: join(tmpdir(), "forge-sandbox") });
  console.log(JSON.stringify(report, null, 2));
} else {
  console.error("Usage: npm run sandbox -- build | reap");
  process.exit(2);
}
