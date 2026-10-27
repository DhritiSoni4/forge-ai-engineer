import { consoleLogger, createManagerFromEnv } from "./mcp/setup.js";

const [command, toolName, rawArgs] = process.argv.slice(2);

if (command !== "list" && command !== "call") {
  console.error("Usage: npm run mcp -- list | call <namespaced_tool> '<json args>'");
  process.exit(2);
}

const manager = createManagerFromEnv(consoleLogger);
await manager.start();

let exitCode = 0;
try {
  if (command === "list") {
    for (const status of manager.status()) {
      const detail = status.error ? ` (${status.error})` : "";
      console.log(`${status.name} [${status.transport}] ${status.state}${detail}`);
      for (const warning of status.warnings) console.log(`  warning: ${warning}`);
    }
    for (const tool of manager.tools()) {
      console.log(`  ${tool.name}  risk=${tool.risk}`);
    }
  } else {
    const tool = manager.tools().find((candidate) => candidate.name === toolName);
    if (!tool) {
      console.error(`Unknown tool: ${toolName ?? "(none)"}`);
      exitCode = 1;
    } else {
      console.log(await tool.execute(rawArgs ? JSON.parse(rawArgs) : {}));
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  exitCode = 1;
} finally {
  await manager.close();
}
process.exit(exitCode);
