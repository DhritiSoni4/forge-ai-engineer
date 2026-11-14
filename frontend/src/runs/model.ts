import type { EngineerEvent, EngineerResult, PhaseName, PhaseTrace } from "../types/runs";

export type Item =
  | { kind: "say"; text: string }
  | { kind: "call"; id: string; name: string; input: unknown; result?: { output: string; isError: boolean } };

export interface PhaseView {
  key: string;
  name: PhaseName;
  running: boolean;
  trace?: PhaseTrace;
  items: Item[];
}

export interface RunView {
  phases: PhaseView[];
  verification?: { testsPass: boolean; output: string };
  result?: EngineerResult;
  error?: string;
}

/** Folds a stream of engineer events into what the UI renders. Pure, so it can replay any prefix. */
export function buildRunView(events: EngineerEvent[]): RunView {
  const view: RunView = { phases: [] };
  let current: PhaseView | undefined;

  for (const event of events) {
    switch (event.type) {
      case "phase_start":
        current = { key: `${event.phase}-${view.phases.length}`, name: event.phase, running: true, items: [] };
        view.phases.push(current);
        break;
      case "agent": {
        if (!current) break;
        const e = event.event;
        if (e.type === "assistant") current.items.push({ kind: "say", text: e.text });
        else if (e.type === "tool_call") current.items.push({ kind: "call", id: e.id, name: e.name, input: e.input });
        else {
          const call = current.items.find((i) => i.kind === "call" && i.id === e.id);
          if (call?.kind === "call") call.result = { output: e.output, isError: e.isError };
        }
        break;
      }
      case "phase_end":
        if (current) {
          current.running = false;
          current.trace = event.trace;
        }
        break;
      case "verification":
        view.verification = { testsPass: event.testsPass, output: event.output };
        break;
      case "done":
        view.result = event.result;
        break;
      case "error":
        view.error = event.message;
        break;
      case "start":
        break;
    }
  }
  return view;
}

const UNTRUSTED = /^<untrusted_tool_output[^>]*>\n?|\n?<\/untrusted_tool_output>$/g;

export function stripEnvelope(text: string): string {
  return text.replace(UNTRUSTED, "");
}

export function describeCall(name: string, input: unknown): string {
  const args = (input ?? {}) as Record<string, unknown>;
  switch (name) {
    case "read_file":
      return String(args["path"] ?? "");
    case "write_file":
      return `${String(args["path"] ?? "")} (${String(args["content"] ?? "").length} chars)`;
    case "run_command":
      return String(args["command"] ?? "");
    case "run_tests":
      return String(args["command"] ?? "project tests");
    default:
      return JSON.stringify(input).slice(0, 120);
  }
}
