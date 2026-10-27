# Forge worker

Agent runtime for Forge: an LLM provider interface, a typed tool registry, and a bounded model/tool loop. Phase 0 of the agent upgrade; MCP (Phase 1) and the sandbox (Phase 2) build on this.

## Setup

```bash
cd worker
npm install
npm run typecheck
npm test
```

Live test (optional, makes one real API call):

```bash
export ANTHROPIC_API_KEY=...   # never commit this
npm test
```

Run the agent from the CLI:

```bash
npm run run:agent -- "What is 17 plus 25?"
```

## Design

- `runAgent` loops model → tool calls → tool results until the model stops calling tools or a limit trips: `maxSteps`, `maxTotalTokens`, a per-tool timeout, and tool output truncation.
- Tool errors, unknown tools, and timeouts come back to the model as `is_error` results. They never crash the loop.
- Provider failures return `status: "provider_error"` rather than throwing.
- The Anthropic key is read from `ANTHROPIC_API_KEY` by the SDK and is never logged.

## MCP client (Phase 1)

Forge connects to MCP servers with the official `@modelcontextprotocol/sdk`, over **stdio** and **streamable HTTP**. Servers are declared in [forge.mcp.json](forge.mcp.json):

```jsonc
{
  "servers": {
    "filesystem": {
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem@2.0.1", "${FORGE_WORKSPACE}"],
      "allowTools": ["read_text_file", "write_file"],  // default deny: unlisted tools are never exposed
      "risk": "read",
      "toolRisks": { "write_file": "write" }
    }
  }
}
```

`${VAR}` placeholders are resolved from environment variables at connect time. Secrets never live in the config file.

```bash
export FORGE_WORKSPACE=/path/to/scratch/dir
export GITHUB_TOKEN=...            # optional; github server shows "unavailable" without it
npm run mcp -- list                # connect, show server status and tools
npm run mcp -- call filesystem__list_directory '{"path":"/path/to/scratch/dir"}'
```

### How it behaves

- **Namespacing:** tools appear as `server__tool`; names are sanitized to the model API's charset, and collisions are skipped with a warning.
- **Failure isolation:** a missing secret, failed spawn, hung connect, crashed server, or hung call never throws into the agent loop. Tools return error results, a dropped connection is re-established on the next call, and `start()` can be called again to retry servers that were down at startup. Calls are not retried automatically, since they may not be idempotent.
- **Limits:** connect, list, and per-call timeouts; output is truncated below the agent loop's own cap so the safety envelope is never cut.
- **Untrusted output:** every result is wrapped in `<untrusted_tool_output>` tags, with attempts to close the envelope early neutralized, and the system prompt tells the model to treat it as data. Risk classes and allowlists come only from config, never from tool output, so an injected instruction cannot widen what a tool may do. Tool descriptions are length-capped and stripped of control characters.
- **Secrets:** read from env only. Values of secret-looking variables (`*TOKEN*`, `*KEY*`, `*SECRET*`, ...) and all header values are redacted from output, errors, and logs, along with common token shapes (`ghp_...`, `sk-ant-...`, `Bearer ...`). Stdio server stderr is discarded, and child processes receive only a minimal default environment plus what the config lists. HTTP servers must use https unless they are local.
- **Tool set is fixed at discovery.** A server that later advertises new tools does not get them exposed.
