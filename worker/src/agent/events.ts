/** Events emitted while an agent runs; the UI and API stream these as they happen. */
export type AgentEvent =
  | { type: "assistant"; step: number; text: string }
  | { type: "tool_call"; step: number; id: string; name: string; input: unknown }
  | { type: "tool_result"; step: number; id: string; name: string; output: string; isError: boolean };

export const MAX_EVENT_CHARS = 2_000;
