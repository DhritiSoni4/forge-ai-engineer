import { useRef, useState } from "react";
import { streamRun } from "../../runs/stream";
import type { EngineerEvent } from "../../types/runs";
import RunViewer from "./RunViewer";

const field =
  "w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500/50";

export default function LivePanel({ apiBase }: { apiBase: string }) {
  const [task, setTask] = useState("Fix the bug so that the tests pass.");
  const [path, setPath] = useState("solution.py");
  const [code, setCode] = useState("def add(a, b):\n    return a - b\n");
  const [tests, setTests] = useState("from solution import add\n\ndef test_add():\n    assert add(2, 3) == 5\n");
  const [token, setToken] = useState("");
  const [mode, setMode] = useState<"multi" | "single">("multi");
  const [events, setEvents] = useState<EngineerEvent[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string>();
  const abort = useRef<AbortController | undefined>(undefined);

  async function run() {
    abort.current = new AbortController();
    setEvents([]);
    setError(undefined);
    setRunning(true);
    try {
      const files = { [path]: code, "test_solution.py": tests };
      for await (const event of streamRun(apiBase, { task, files, mode }, token || undefined, abort.current.signal)) {
        setEvents((prev) => [...prev, event]);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="font-semibold text-white">Live run against your Forge API</h3>
        <p className="text-xs text-zinc-500">
          Sends the files below to <code>{apiBase}</code>, which runs the agents in a Docker sandbox and streams
          events back.
        </p>
        <textarea className={field} rows={2} value={task} onChange={(e) => setTask(e.target.value)} />
        <input className={field} value={path} onChange={(e) => setPath(e.target.value)} placeholder="source file name" />
        <textarea className={`${field} font-mono`} rows={4} value={code} onChange={(e) => setCode(e.target.value)} />
        <textarea className={`${field} font-mono`} rows={4} value={tests} onChange={(e) => setTests(e.target.value)} />
        <div className="flex flex-wrap items-center gap-3">
          <select className={`${field} w-auto`} value={mode} onChange={(e) => setMode(e.target.value as "multi" | "single")}>
            <option value="multi">multi-agent</option>
            <option value="single">single-agent baseline</option>
          </select>
          <input
            className={`${field} w-56`}
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="API token (if set)"
          />
          <button
            onClick={running ? () => abort.current?.abort() : run}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white"
          >
            {running ? "Stop" : "Run"}
          </button>
        </div>
        {error && <p className="text-sm text-rose-300">{error}</p>}
      </div>
      {events.length > 0 && <RunViewer events={events} />}
    </div>
  );
}
