import { useMemo } from "react";
import { buildRunView, describeCall, stripEnvelope } from "../../runs/model";
import type { Item, PhaseView } from "../../runs/model";
import type { EngineerEvent, TraceMeta } from "../../types/runs";
import DiffView from "./DiffView";

const PHASE_LABEL = { planner: "Planner", coder: "Coder", reviewer: "Reviewer" } as const;
const PHASE_NOTE = {
  planner: "read-only",
  coder: "can edit + run tests",
  reviewer: "read-only",
} as const;

function Pill({ tone, children }: { tone: "ok" | "bad" | "warn" | "info"; children: React.ReactNode }) {
  const tones = {
    ok: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    bad: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    warn: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    info: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
  } as const;
  return <span className={`rounded-full border px-3 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

function ItemRow({ item }: { item: Item }) {
  if (item.kind === "say") {
    return <p className="whitespace-pre-wrap text-sm text-zinc-300">{item.text}</p>;
  }
  const output = item.result ? stripEnvelope(item.result.output) : undefined;
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <code className="rounded bg-violet-500/20 px-2 py-0.5 text-violet-300">{item.name}</code>
        <code className="break-all text-zinc-400">{describeCall(item.name, item.input)}</code>
        {item.result?.isError && <Pill tone="bad">error</Pill>}
      </div>
      {output !== undefined && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300">output</summary>
          <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap text-xs text-zinc-400">{output}</pre>
        </details>
      )}
    </div>
  );
}

function PhaseCard({ phase, showTokens }: { phase: PhaseView; showTokens: boolean }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <header className="mb-3 flex flex-wrap items-center gap-3">
        <h3 className="font-semibold text-white">{PHASE_LABEL[phase.name]}</h3>
        <span className="text-xs text-zinc-500">{PHASE_NOTE[phase.name]}</span>
        {phase.running && <Pill tone="info">running…</Pill>}
        {phase.trace && (
          <span className="text-xs text-zinc-500">
            {phase.trace.steps} steps
            {showTokens && ` · ${phase.trace.usage.inputTokens + phase.trace.usage.outputTokens} tokens`}
          </span>
        )}
        {phase.trace?.readOnlyViolation && <Pill tone="warn">modified files while read-only: reverted</Pill>}
      </header>
      <div className="space-y-3">
        {phase.items.map((item, i) => (
          <ItemRow key={i} item={item} />
        ))}
      </div>
    </section>
  );
}

interface Props {
  events: EngineerEvent[];
  meta?: TraceMeta;
  task?: string;
  /** Scripted replays carry placeholder token counts, so they are not shown. */
  scripted?: boolean;
}

export default function RunViewer({ events, meta, task, scripted = false }: Props) {
  const view = useMemo(() => buildRunView(events), [events]);
  const { result, verification } = view;

  return (
    <div className="space-y-4">
      {task && (
        <details className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <summary className="cursor-pointer text-sm font-semibold text-white">Task given to the agents</summary>
          <pre className="mt-3 whitespace-pre-wrap text-sm text-zinc-400">{task}</pre>
        </details>
      )}

      {view.phases.map((phase) => (
        <PhaseCard key={phase.key} phase={phase} showTokens={!scripted} />
      ))}

      {view.error && <Pill tone="bad">{view.error}</Pill>}

      {verification && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="mb-1 font-semibold text-white">Harness verification</h3>
          <p className="mb-3 text-xs text-zinc-500">
            After the agents finish, the harness re-runs the tests and computes the diff from git itself. The model's
            own claims are never used.
          </p>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Pill tone={verification.testsPass ? "ok" : "bad"}>
              tests {verification.testsPass ? "PASS" : "FAIL"}
            </Pill>
            {result?.reviewerApproved !== undefined && (
              <Pill tone={result.reviewerApproved ? "ok" : "warn"}>
                reviewer {result.reviewerApproved ? "approved" : "did not approve"}
              </Pill>
            )}
            {meta && (
              <Pill tone={meta.hiddenTestsPass ? "ok" : "bad"}>
                hidden tests {meta.hiddenTestsPass ? "PASS" : "FAIL"}
              </Pill>
            )}
            {result && (
              <span className="text-xs text-zinc-500">
                {result.steps} steps{!scripted && ` · ${result.usage.inputTokens + result.usage.outputTokens} tokens`} ·{" "}
                {(result.durationMs / 1000).toFixed(1)}s
              </span>
            )}
          </div>
          <pre className="mb-4 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-zinc-400">
            {stripEnvelope(verification.output)}
          </pre>
          {result && (
            <>
              <h4 className="mb-2 text-sm font-semibold text-white">Final diff (from git)</h4>
              <DiffView diff={result.diff} />
            </>
          )}
        </section>
      )}
    </div>
  );
}
