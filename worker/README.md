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

## Sandboxed execution (Phase 2)

Agent code and shell commands run in Docker, never on the worker's host. The sandbox is a library plus agent tools; it is deployed with the worker, **not** with the Vercel UI.

```bash
npm run sandbox:build        # builds forge-sandbox and forge-egress-proxy (needs network once)
npm run sandbox:reap         # remove orphaned containers/networks/workspaces
```

```ts
const sandbox = await Sandbox.create({ network: { mode: "none" } });
for (const tool of createSandboxTools(sandbox)) registry.register(tool);
// run_command, read_file, write_file, apply_patch, run_tests, clone_repo
await sandbox.destroy(); // or use withSandbox(options, fn), which always cleans up
```

### What a sandbox is

One fresh container per run (`docker run -d --init`), with commands executed via `docker exec`, so edits and test runs share state.

| Control | Setting |
| --- | --- |
| User | non-root (host uid, never 0), `--cap-drop ALL`, `no-new-privileges` |
| Filesystem | `--read-only` root, writable `/tmp` tmpfs, per-run workspace bind mount at `/workspace` |
| Host access | the workspace directory only; no docker socket, no `--privileged`, no env passthrough |
| Resources | `--cpus`, `--memory` (swap disabled), `--pids-limit`, `nofile`, no core dumps |
| Time | per-command wall-clock limit enforced in-container with `timeout` (process group, then SIGKILL); if that fails the container is destroyed; the container also exits on its own after `lifetimeSec` |
| Network | none by default; opt-in allowlist (below) |
| Secrets | none enter the container; the docker CLI is spawned with a minimal environment |

All file operations (`read_file`, `write_file`, `apply_patch`) run *inside* the container, so a symlink the agent plants cannot make the host read its own files. Paths are also confined to `/workspace` before any call is made.

### Network allowlist

`network: { mode: "allowlist", hosts: ["pypi.org", "*.pythonhosted.org"] }` puts the sandbox on a per-run `--internal` Docker network whose only neighbor is an egress proxy. Ignoring `HTTP(S)_PROXY` gets nowhere because there is no route out. The proxy only permits ports 80/443 to allowlisted hostnames and refuses any name that resolves to a private, loopback, link-local, or metadata address (SSRF and DNS-rebinding defense).

### Cloning

The sandbox is offline, so `clone_repo` clones **on the host**: https only, allowlisted hosts (default `github.com`), no embedded credentials, scrubbed git environment, no hooks. The ref is then checked out inside the container.

### Cleanup

Containers are destroyed on success, failure, and timeout. `reapOrphans` / `startReaper` remove anything labeled `forge.sandbox=1` older than a threshold (default 2h, above the container lifetime), plus its network and stale workspace directory. It never touches unlabeled containers.

### Limitations

- **Docker is not a VM boundary.** Containers share the host kernel. For hostile code at scale, pass `runtime: "runsc"` (gVisor) or run the worker on a throwaway VM.
- **The worker needs Docker daemon access, which is root-equivalent on its host.** Use a dedicated machine or rootless Docker.
- **Disk is not capped.** The workspace is a host directory; use filesystem quotas on `rootDir` in production. `/tmp` is a size-limited tmpfs, but it counts against container memory.
- **`setsid` escapes the process-group kill.** A deliberately detached process survives a command timeout until the container is destroyed; it is still bound by the pid, memory, and lifetime limits.
- **The clone runs git on the host** against attacker-influenced data. Inputs are tightly validated, but a git vulnerability would land on the worker host, not in a container.
- **Tested on** Docker Desktop (macOS arm64, cgroup v2) locally and on Linux in CI. Resource-limit behavior can differ on other setups.

## HTTP API

`npm run serve` starts `POST /runs` (SSE stream of run events) and `GET /health`. See the root README for the request shape and safeguards. Environment: `ANTHROPIC_API_KEY` (required), `FORGE_HOST` (default `127.0.0.1`), `FORGE_PORT` (8787), `FORGE_API_TOKEN` (required for non-loopback hosts), `FORGE_CORS_ORIGINS`, `FORGE_MODEL`, `FORGE_MAX_TOKENS`.
