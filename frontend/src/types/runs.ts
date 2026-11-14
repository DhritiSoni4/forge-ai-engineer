// Mirrors worker/src/engineer/engineer.ts and worker/src/agent/events.ts (the wire format).

export type PhaseName = "planner" | "coder" | "reviewer";

export type AgentEvent =
  | { type: "assistant"; step: number; text: string }
  | { type: "tool_call"; step: number; id: string; name: string; input: unknown }
  | { type: "tool_result"; step: number; id: string; name: string; output: string; isError: boolean };

export interface PhaseTrace {
  name: PhaseName;
  status: string;
  steps: number;
  usage: { inputTokens: number; outputTokens: number };
  readOnlyViolation: boolean;
}

export interface EngineerResult {
  mode: string;
  diff: string;
  testsPass: boolean;
  testOutput: string;
  phases: PhaseTrace[];
  steps: number;
  usage: { inputTokens: number; outputTokens: number };
  durationMs: number;
  reviewerApproved: boolean | undefined;
  error: string | undefined;
}

export type EngineerEvent =
  | { type: "start"; mode: string }
  | { type: "phase_start"; phase: PhaseName }
  | { type: "agent"; phase: PhaseName; event: AgentEvent }
  | { type: "phase_end"; phase: PhaseName; trace: PhaseTrace }
  | { type: "verification"; testsPass: boolean; output: string }
  | { type: "done"; result: EngineerResult }
  | { type: "error"; message: string };

export interface TraceMeta {
  id: string;
  title: string;
  lesson: string;
  taskId: string;
  mode: string;
  /** True when the model's replies were scripted (the harness itself is real). */
  scripted: boolean;
  harnessTestsPass: boolean;
  hiddenTestsPass: boolean;
  recorded: string;
}

export interface Trace {
  meta: TraceMeta;
  task: string;
  files: string[];
  events: EngineerEvent[];
}
