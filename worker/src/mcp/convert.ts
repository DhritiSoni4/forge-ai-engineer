export const NAMESPACE_SEP = "__";
export const MAX_TOOL_NAME_LENGTH = 64;
const MAX_DESCRIPTION_LENGTH = 1000;

/** Anthropic tool names must match [a-zA-Z0-9_-]{1,64}. */
export function namespacedName(server: string, tool: string): string {
  const segment = tool.replace(/[^a-zA-Z0-9_-]/g, "_");
  const name = `${server}${NAMESPACE_SEP}${segment}`;
  if (name.length > MAX_TOOL_NAME_LENGTH) {
    throw new Error(`Namespaced tool name exceeds ${MAX_TOOL_NAME_LENGTH} chars: ${name}`);
  }
  return name;
}

/**
 * Tool descriptions come from the server and are themselves an injection
 * vector, so strip control characters and cap the length.
 */
export function sanitizeDescription(server: string, description: string | undefined): string {
  // eslint-disable-next-line no-control-regex
  const clean = (description ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
  const capped =
    clean.length > MAX_DESCRIPTION_LENGTH ? `${clean.slice(0, MAX_DESCRIPTION_LENGTH)}…` : clean;
  return `[MCP:${server}] ${capped}`.trim();
}

type RawResult = {
  content?: unknown;
  isError?: unknown;
  structuredContent?: unknown;
};

type RawBlock = {
  type?: unknown;
  text?: unknown;
  mimeType?: unknown;
  uri?: unknown;
  resource?: { text?: unknown; uri?: unknown; mimeType?: unknown } | undefined;
};

export function flattenToolResult(result: unknown): { text: string; isError: boolean } {
  const raw = (result ?? {}) as RawResult;
  const blocks = Array.isArray(raw.content) ? (raw.content as RawBlock[]) : [];

  const parts = blocks.map((block) => {
    switch (block.type) {
      case "text":
        return typeof block.text === "string" ? block.text : "";
      case "image":
      case "audio":
        return `[${String(block.type)} content omitted: ${String(block.mimeType ?? "unknown")}]`;
      case "resource": {
        const text = block.resource?.text;
        return typeof text === "string"
          ? text
          : `[binary resource omitted: ${String(block.resource?.uri ?? "unknown")}]`;
      }
      case "resource_link":
        return `[resource link: ${String(block.uri ?? "unknown")}]`;
      default:
        return `[unsupported content type: ${String(block.type)}]`;
    }
  });

  let text = parts.join("\n");
  if (!text && raw.structuredContent !== undefined) {
    text = JSON.stringify(raw.structuredContent);
  }
  return { text, isError: raw.isError === true };
}

export function truncateText(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n[truncated ${text.length - max} chars]`;
}
