import { useEffect, useMemo, useState } from "react";
import LivePanel from "../components/runs/LivePanel";
import RunViewer from "../components/runs/RunViewer";
import type { Trace, TraceMeta } from "../types/runs";

const TRACES = `${import.meta.env.BASE_URL}traces/`;
const API = import.meta.env.VITE_FORGE_API as string | undefined;
const STEP_MS = 650;

export default function Runs() {
  const [index, setIndex] = useState<TraceMeta[]>([]);
  const [selected, setSelected] = useState<string>();
  const [trace, setTrace] = useState<Trace>();
  const [shown, setShown] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    fetch(`${TRACES}index.json`)
      .then((r) => (r.ok ? (r.json() as Promise<TraceMeta[]>) : Promise.reject(new Error("no traces found"))))
      .then((list) => {
        setIndex(list);
        setSelected(list[0]?.id);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!selected) return;
    fetch(`${TRACES}${selected}.json`)
      .then((r) => r.json() as Promise<Trace>)
      .then((t) => {
        setTrace(t);
        setShown(0);
        setPlaying(true);
      })
      .catch((e: Error) => setError(e.message));
  }, [selected]);

  useEffect(() => {
    if (!playing || !trace) return;
    const timer = setInterval(() => {
      setShown((n) => {
        if (n + 1 >= trace.events.length) setPlaying(false);
        return Math.min(n + 1, trace.events.length);
      });
    }, STEP_MS);
    return () => clearInterval(timer);
  }, [playing, trace]);

  const pick = (id: string) => {
    setSelected(id);
    setTrace(undefined);
    setPlaying(false);
  };

  const events = useMemo(() => trace?.events.slice(0, shown) ?? [], [trace, shown]);
  const btn = "rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/10";

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-12">
      <header>
        <h1 className="text-3xl font-bold text-white">Agent runs</h1>
        <p className="mt-2 max-w-3xl text-zinc-400">
          Watch Forge&apos;s Planner → Coder → Reviewer pipeline work inside a sandbox, then see the harness verify the
          result itself.
        </p>
      </header>

      {API && <LivePanel apiBase={API} />}

      <section className="space-y-4">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          <strong>Recorded replays.</strong> The sandbox, tool execution, test runs, read-only enforcement and
          verification in these traces are real harness output. The model&apos;s replies are scripted so each
          scenario is deterministic: they show what the harness guarantees, not how well a model performs. Real model
          results will come from <code>npm run eval</code>.
        </div>

        {error && <p className="text-rose-300">{error}</p>}

        <div className="flex flex-wrap gap-2">
          {index.map((m) => (
            <button
              key={m.id}
              onClick={() => pick(m.id)}
              className={`rounded-xl border px-4 py-2 text-left text-sm transition ${
                m.id === selected
                  ? "border-violet-500/50 bg-violet-500/15 text-white"
                  : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
              }`}
            >
              {m.title}
            </button>
          ))}
        </div>

        {trace && (
          <>
            <p className="text-sm text-zinc-400">{trace.meta.lesson}</p>
            <div className="flex flex-wrap items-center gap-2">
              <button className={btn} onClick={() => setPlaying((p) => !p)}>
                {playing ? "Pause" : shown >= trace.events.length ? "Replay finished" : "Play"}
              </button>
              <button
                className={btn}
                onClick={() => {
                  setShown(0);
                  setPlaying(true);
                }}
              >
                Restart
              </button>
              <button
                className={btn}
                onClick={() => {
                  setPlaying(false);
                  setShown(trace.events.length);
                }}
              >
                Show all
              </button>
              <span className="text-xs text-zinc-500">
                event {shown}/{trace.events.length}
              </span>
            </div>
            <RunViewer
              events={events}
              meta={shown >= trace.events.length ? trace.meta : undefined}
              task={trace.task}
              scripted={trace.meta.scripted}
            />
          </>
        )}
      </section>
    </main>
  );
}
