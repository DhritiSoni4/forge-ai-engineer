import { mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { parseMcpConfig } from "../../src/mcp/config.js";
import { McpManager } from "../../src/mcp/manager.js";

const serverEntry = fileURLToPath(
  new URL(
    "../../node_modules/@modelcontextprotocol/server-filesystem/dist/index.js",
    import.meta.url,
  ),
);

describe("real filesystem MCP server (stdio)", () => {
  let workspace: string;
  let manager: McpManager;

  beforeAll(async () => {
    workspace = realpathSync(mkdtempSync(join(tmpdir(), "forge-mcp-")));
    writeFileSync(join(workspace, "hello.txt"), "hello from forge");

    manager = new McpManager({
      config: parseMcpConfig({
        servers: {
          filesystem: {
            transport: "stdio",
            command: process.execPath,
            args: [serverEntry, "${WORKSPACE}"],
            allowTools: ["list_directory", "read_text_file", "write_file"],
            risk: "read",
            toolRisks: { write_file: "write" },
          },
        },
      }),
      env: { WORKSPACE: workspace },
      connectTimeoutMs: 20_000,
    });
    await manager.start();
  }, 30_000);

  afterAll(async () => {
    await manager.close();
    rmSync(workspace, { recursive: true, force: true });
  });

  const tool = (name: string) => {
    const found = manager.tools().find((t) => t.name === name);
    if (!found) throw new Error(`tool ${name} not discovered`);
    return found;
  };

  it("connects and discovers exactly the allowlisted tools", () => {
    expect(manager.status()[0]).toMatchObject({ state: "connected", toolCount: 3 });
    expect(manager.tools().map((t) => t.name).sort()).toEqual([
      "filesystem__list_directory",
      "filesystem__read_text_file",
      "filesystem__write_file",
    ]);
    expect(manager.status()[0]?.warnings).toEqual([]);
  });

  it("lists and reads files inside the workspace", async () => {
    const listing = await tool("filesystem__list_directory").execute({ path: workspace });
    expect(listing).toContain("hello.txt");

    const content = await tool("filesystem__read_text_file").execute({
      path: join(workspace, "hello.txt"),
    });
    expect(content).toContain("hello from forge");
    expect(content.startsWith("<untrusted_tool_output")).toBe(true);
  });

  it("writes a file and reads it back", async () => {
    const path = join(workspace, "out.txt");
    await tool("filesystem__write_file").execute({ path, content: "written" });
    await expect(tool("filesystem__read_text_file").execute({ path })).resolves.toContain(
      "written",
    );
  });

  it("refuses paths outside the allowed directory", async () => {
    await expect(
      tool("filesystem__read_text_file").execute({ path: "/etc/hosts" }),
    ).rejects.toThrow(/outside allowed directories|Access denied/i);
    // A rejected call must not poison the connection.
    expect(manager.status()[0]?.state).toBe("connected");
  });
});
