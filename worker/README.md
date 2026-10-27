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
