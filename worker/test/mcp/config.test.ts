import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  McpConfigError,
  parseMcpConfig,
  resolveServer,
  resolveTemplate,
} from "../../src/mcp/config.js";
import { redact } from "../../src/mcp/redact.js";

const stdio = {
  transport: "stdio",
  command: "node",
  allowTools: ["a"],
};

describe("parseMcpConfig", () => {
  it("applies defaults", () => {
    const config = parseMcpConfig({ servers: { fs: stdio } });
    expect(config.servers["fs"]).toMatchObject({
      enabled: true,
      risk: "external",
      args: [],
      env: {},
      toolRisks: {},
    });
  });

  it("requires an explicit allowlist", () => {
    const { allowTools: _omit, ...noAllow } = stdio;
    expect(() => parseMcpConfig({ servers: { fs: noAllow } })).toThrow(McpConfigError);
  });

  it("rejects unknown keys and bad server names", () => {
    expect(() => parseMcpConfig({ servers: { fs: { ...stdio, extra: 1 } } })).toThrow(
      McpConfigError,
    );
    expect(() => parseMcpConfig({ servers: { "my__server": stdio } })).toThrow(McpConfigError);
    expect(() => parseMcpConfig({ servers: { Upper: stdio } })).toThrow(McpConfigError);
  });

  it("parses the shipped forge.mcp.json", () => {
    const raw = JSON.parse(readFileSync(new URL("../../forge.mcp.json", import.meta.url), "utf8"));
    const config = parseMcpConfig(raw);
    expect(Object.keys(config.servers)).toEqual(["filesystem", "github"]);
    expect(config.servers["github"]?.transport).toBe("http");
  });
});

describe("resolveTemplate", () => {
  it("substitutes env values and records them as secrets", () => {
    const secrets = new Set<string>();
    const value = resolveTemplate("Bearer ${TOKEN}", { TOKEN: "s3cret-value" }, secrets);
    expect(value).toBe("Bearer s3cret-value");
    expect(secrets.has("s3cret-value")).toBe(true);
  });

  it("does not treat plain values like paths as secrets", () => {
    const secrets = new Set<string>();
    resolveTemplate("${FORGE_WORKSPACE}", { FORGE_WORKSPACE: "/work/space" }, secrets);
    expect(secrets.size).toBe(0);
  });

  it("always records header values as secrets", () => {
    const config = parseMcpConfig({
      servers: {
        r: {
          transport: "http",
          url: "https://example.com/mcp",
          headers: { "X-Org": "${ORG}" },
          allowTools: ["a"],
        },
      },
    }).servers["r"]!;
    const secrets = new Set<string>();
    resolveServer(config, { ORG: "acme-corp-123" }, secrets);
    expect(secrets.has("acme-corp-123")).toBe(true);
  });

  it("names the missing variable without leaking anything", () => {
    expect(() => resolveTemplate("${NOPE}", {}, new Set())).toThrow(
      "Environment variable NOPE is not set",
    );
  });
});

describe("resolveServer", () => {
  it("refuses plaintext http to a remote host", () => {
    const config = parseMcpConfig({
      servers: { r: { transport: "http", url: "http://example.com/mcp", allowTools: ["a"] } },
    }).servers["r"]!;
    expect(() => resolveServer(config, {}, new Set())).toThrow("must use https");
  });

  it("allows http to localhost", () => {
    const config = parseMcpConfig({
      servers: { r: { transport: "http", url: "http://localhost:3000/mcp", allowTools: ["a"] } },
    }).servers["r"]!;
    expect(resolveServer(config, {}, new Set()).transport).toBe("http");
  });
});

describe("redact", () => {
  it("removes known secrets and common token shapes", () => {
    const text = "key=abcdef123456 token ghp_" + "a".repeat(30) + " Bearer abcdefghijkl";
    const out = redact(text, ["abcdef123456"]);
    expect(out).not.toContain("abcdef123456");
    expect(out).not.toContain("ghp_");
    expect(out).not.toContain("abcdefghijkl");
  });

  it("ignores very short secrets so it does not mangle text", () => {
    expect(redact("a 1 b", ["1"])).toBe("a 1 b");
  });
});
