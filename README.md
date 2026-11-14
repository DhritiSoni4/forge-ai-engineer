# Forge

**A sandboxed multi-agent coding engine: Planner → Coder → Reviewer agents that edit a repository inside a locked-down Docker container, with every result verified by the harness, not by the model.**

[![worker-ci](https://github.com/DhritiSoni4/forge-ai-engineer/actions/workflows/worker.yml/badge.svg)](https://github.com/DhritiSoni4/forge-ai-engineer/actions/workflows/worker.yml)

Most "AI coding agent" demos trust whatever the model says. Forge is built around the opposite rule: **the model never grades itself and never touches the host.**

## How it works

```text
 task + repo
     │  copied into a fresh, offline, non-root Docker sandbox (git repo, base commit recorded)
     ▼
 Planner   read-only tools ──► plan            (any change it makes is detected and reverted)
     ▼
 Coder     read/write/patch/run/test tools ──► edits files, runs tests
     ▼
 Reviewer  read-only tools + the diff ──► VERDICT: APPROVE | REJECT
     │          └─ REJECT → feedback goes back to the Coder (bounded revisions)
     ▼
 Harness   re-runs the tests itself, computes the diff from git against the base commit
```

What the harness guarantees (all covered by tests in [`worker/test/engineer.test.ts`](worker/test/engineer.test.ts)):

- **Authoritative results.** `testsPass` and `diff` come from the harness re-running tests and `git diff` — a model that claims "all tests pass" without changing anything is reported as a failure.
- **Enforced read-only phases.** The Planner and Reviewer get no write tools, and the working tree is hashed before and after; any change is reverted and flagged as a violation.
- **Shared budgets.** One token budget spans all phases, plus per-phase step limits and per-tool timeouts.
- **Prompt-injection containment.** Everything read from the repo or produced by a command reaches the model inside an `<untrusted_tool_output>` envelope (envelope-closing attempts are neutralized). Tool permissions come from config, never from model or tool output.

### The sandbox ([details](worker/README.md))

One container per run: non-root, `--cap-drop ALL`, read-only root filesystem, CPU/memory/pid limits, wall-clock limits, **no network by default**. Optional per-run allowlist through an egress proxy that refuses private, loopback and cloud-metadata addresses (SSRF / DNS-rebinding defense). An orphan reaper cleans up after crashes. MCP tools are default-deny with secret redaction. Known limits (shared kernel, `setsid` escape of the process-group kill, uncapped disk) are documented honestly in the worker README.

## Live demo

**https://dhritisoni4.github.io/forge-ai-engineer/**: an **Agent runs** viewer that replays four recorded pipeline runs step by step (phases, tool calls, test output, final git diff, harness verdict):

| Replay | What it shows |
| --- | --- |
| Multi-agent success | Plan → edit → test → review → verified against hidden tests |
| A coder claims success but changed nothing | The harness reports FAIL anyway, even though the reviewer was fooled |
| The Planner tries to edit code | The read-only violation is detected, flagged and reverted |
| The Reviewer rejects a half-fix | The revision loop fixes what visible tests missed |

**What is real and what is scripted:** the sandbox pipeline, tool execution, test runs, read-only enforcement and verification in these traces are real harness output. The model's replies are scripted (a mock provider) so the scenarios are deterministic, and the page says so. They demonstrate the harness's guarantees, not model quality; model results come from the eval below. Regenerate them with `npm run record:demo`.

The site is static (GitHub Pages), so the engine itself can't run there. The other tab is the original rule-based planner prototype, which runs in the browser.

## Run it live: HTTP API + UI

```bash
cd worker
export ANTHROPIC_API_KEY=...      # never commit this
npm run sandbox:build && npm run serve        # http://127.0.0.1:8787

cd ../frontend
VITE_FORGE_API=http://127.0.0.1:8787 npm run dev   # adds a live-run panel to the Agent runs tab
```

`POST /runs` takes `{ task, files, mode, testCommand? }` and streams the run as Server-Sent Events (`phase_start`, `agent` tool calls and results, `verification`, `done`). Safeguards, all covered by [`worker/test/server.test.ts`](worker/test/server.test.ts):

- Listens on loopback by default and **refuses to bind elsewhere without `FORGE_API_TOKEN`** (it starts Docker containers). Bearer auth uses a constant-time compare.
- Strict input validation (relative paths only, file count and size limits), body size cap, and a CORS origin allowlist.
- One run at a time; the sandbox is always destroyed, a client disconnect or timeout aborts the run, and secret-shaped values are redacted from streamed events.

## Evaluation

Forge ships with an evaluation harness that compares the **multi-agent pipeline against a single-agent baseline** under the same token budget.

- **11 bug-fix / feature tasks** in [`worker/eval/tasks`](worker/eval/tasks) (pagination, LRU cache, token bucket, CSV parsing, topological sort, atomic transfers, a multi-file CLI change, …).
- Each task has **visible tests** the agent can run and **hidden tests** written into the sandbox only after the agent finishes. A task is *resolved* only if the hidden tests pass; passing visible-but-not-hidden is counted separately as **overfit**.
- Every task is **proven fair** before a model sees it ([`checkTask`](worker/src/eval/tasks.ts), run in CI): tests fail on the starting repo, hidden tests fail on it too, and the reference solution passes both. (This caught two flawed tasks while building the suite.)
- Reports include a 95% Wilson confidence interval, mean steps/tokens, p50/p95 latency and — if you pass prices — cost per task. Prices are never assumed.

```bash
cd worker && npm ci
npm run sandbox:build            # build the sandbox images (needs Docker)
npm run eval:validate            # prove all tasks are solvable (no API key needed)
export ANTHROPIC_API_KEY=...     # never commit this
npm run eval -- --mode both --price-in <USD/MTok> --price-out <USD/MTok>
```

**Results:** a full model run has not been committed yet. When it is, the table and raw JSON will live in `worker/eval/results/`. With 11 tasks the confidence intervals are wide by design — the report prints them so nobody over-reads a single run.

Try the pipeline on any local project (your directory is copied, never modified):

```bash
npm run engineer -- --dir ../my-project --test "pytest -q" "Fix the failing date parsing"
```

## Repository layout

```text
worker/    TypeScript agent engine (this is the core of the project)
  src/agent       model/tool loop with step, token, and timeout limits
  src/engineer    Planner → Coder → Reviewer pipeline + harness verification
  src/sandbox     Docker sandbox, egress proxy, reaper, agent tools
  src/mcp         MCP client (stdio + streamable HTTP), allowlists, redaction
  src/eval        task loader, fairness checker, runner, statistics
  src/server      HTTP/SSE API in front of the pipeline
  scripts         records the demo traces
  eval/tasks      11 verified tasks (repo / hidden / solution)
  test            unit + Docker integration tests
frontend/  React + TypeScript UI: agent-run viewer (replay + live) and the planner prototype
backend/   FastAPI service with a rule-based requirement analyzer and planner (early prototype)
```

## Status and honesty notes

- **Done and tested:** agent loop, MCP client, hardened sandbox, multi-agent pipeline, eval harness and tasks (offline test suite; Docker-backed tests run in CI).
- **Early prototype:** the `backend/` planner (and the UI's Planner tab) is deterministic keyword rules, **not an LLM**; it predates the worker and is not part of the agent pipeline.
- **Not yet exercised end to end:** the live-run panel and `npm run serve` are tested against a fake sandbox and mock model, but have not been run against real Docker and a real model.
- **Not yet done:** a committed model-run eval table, SWE-bench-style real-repo tasks (the sandbox is offline, so dependencies must be baked into the image), authentication and multi-user workspaces.
- Docker is not a VM boundary; for hostile code run the worker on a throwaway VM or with gVisor (`runtime: "runsc"`).

## Development

```bash
cd worker
npm ci && npm run typecheck && npm run lint && npm test
```

Docker-backed tests skip automatically when Docker or the images are unavailable.
