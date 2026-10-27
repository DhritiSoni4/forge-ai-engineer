import type {
  ContentBlock,
  LLMProvider,
  Message,
  ToolUseBlock,
  Usage,
} from "../llm/types.js";
import type { ToolRegistry } from "../tools/registry.js";

export type RunLimits = {
  maxSteps: number;
  maxTotalTokens: number;
  maxOutputTokens: number;
  toolTimeoutMs: number;
  maxToolOutputChars: number;
};

export const DEFAULT_LIMITS: RunLimits = {
  maxSteps: 20,
  maxTotalTokens: 200_000,
  maxOutputTokens: 4096,
  toolTimeoutMs: 30_000,
  maxToolOutputChars: 20_000,
};

export type RunStatus =
  | "completed"
  | "max_steps"
  | "budget_exceeded"
  | "provider_error";

export type RunResult = {
  status: RunStatus;
  finalText: string;
  steps: number;
  usage: Usage;
  messages: Message[];
  error?: string;
};

export type RunOptions = {
  provider: LLMProvider;
  tools: ToolRegistry;
  system: string;
  task: string;
  limits?: Partial<RunLimits>;
};

/**
 * Runs the model/tool loop until the model stops calling tools, a limit is hit,
 * or the provider fails. Tool failures are returned to the model as error
 * results rather than thrown, so one bad call cannot end the run.
 */
export async function runAgent(options: RunOptions): Promise<RunResult> {
  const limits: RunLimits = { ...DEFAULT_LIMITS, ...options.limits };
  const messages: Message[] = [
    { role: "user", content: [{ type: "text", text: options.task }] },
  ];
  const usage: Usage = { inputTokens: 0, outputTokens: 0 };

  for (let step = 1; step <= limits.maxSteps; step += 1) {
    let response;
    try {
      response = await options.provider.complete({
        system: options.system,
        messages,
        tools: options.tools.specs(),
        maxOutputTokens: limits.maxOutputTokens,
      });
    } catch (error) {
      return finish("provider_error", messages, usage, step - 1, errorMessage(error));
    }

    usage.inputTokens += response.usage.inputTokens;
    usage.outputTokens += response.usage.outputTokens;
    messages.push({ role: "assistant", content: response.content });

    const toolUses = response.content.filter(isToolUse);
    if (toolUses.length === 0) {
      return finish("completed", messages, usage, step, finalText(response.content));
    }

    const results = await Promise.all(
      toolUses.map((call) => runTool(call, options.tools, limits)),
    );
    messages.push({ role: "user", content: results });

    if (usage.inputTokens + usage.outputTokens > limits.maxTotalTokens) {
      return finish("budget_exceeded", messages, usage, step, "");
    }
  }

  return finish("max_steps", messages, usage, limits.maxSteps, "");
}

async function runTool(
  call: ToolUseBlock,
  registry: ToolRegistry,
  limits: RunLimits,
): Promise<ContentBlock> {
  const tool = registry.get(call.name);
  if (!tool) {
    return toolResult(call.id, `Unknown tool: ${call.name}`, true);
  }

  try {
    const output = await withTimeout(
      tool.execute(call.input),
      limits.toolTimeoutMs,
      call.name,
    );
    return toolResult(call.id, truncate(output, limits.maxToolOutputChars), false);
  } catch (error) {
    return toolResult(
      call.id,
      truncate(errorMessage(error), limits.maxToolOutputChars),
      true,
    );
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, name: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Tool ${name} timed out after ${ms}ms`)),
      ms,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function finish(
  status: RunStatus,
  messages: Message[],
  usage: Usage,
  steps: number,
  textOrError: string,
): RunResult {
  if (status === "provider_error") {
    return { status, finalText: "", steps, usage, messages, error: textOrError };
  }
  return { status, finalText: textOrError, steps, usage, messages };
}

function isToolUse(block: ContentBlock): block is ToolUseBlock {
  return block.type === "tool_use";
}

function finalText(content: ContentBlock[]): string {
  return content
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join("\n");
}

function toolResult(id: string, content: string, isError: boolean): ContentBlock {
  return { type: "tool_result", tool_use_id: id, content, is_error: isError };
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n[truncated ${text.length - max} chars]`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
