import type { EngineerEvent } from "../types/runs";

export interface RunRequest {
  task: string;
  files: Record<string, string>;
  mode: "multi" | "single";
  testCommand?: string;
}

/** POSTs a run to the Forge API and yields its Server-Sent Events as they arrive. */
export async function* streamRun(
  apiBase: string,
  request: RunRequest,
  token: string | undefined,
  signal: AbortSignal,
): AsyncGenerator<EngineerEvent> {
  const response = await fetch(`${apiBase.replace(/\/$/, "")}/runs`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(request),
  });
  if (!response.ok || !response.body) {
    const detail = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error((detail as { error?: string }).error ?? `request failed (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let boundary: number;
    while ((boundary = buffer.indexOf("\n\n")) !== -1) {
      const chunk = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      if (chunk.startsWith("data: ")) yield JSON.parse(chunk.slice(6)) as EngineerEvent;
    }
  }
}
