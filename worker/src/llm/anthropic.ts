import Anthropic from "@anthropic-ai/sdk";
import type {
  CompletionRequest,
  CompletionResponse,
  ContentBlock,
  LLMProvider,
} from "./types.js";

export const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-5-5";

/**
 * Anthropic Messages API provider. The API key is read from the environment
 * by the SDK (ANTHROPIC_API_KEY) and is never logged or stored here.
 */
export class AnthropicProvider implements LLMProvider {
  readonly model: string;
  private readonly client: Anthropic;

  constructor(options: { model?: string; client?: Anthropic } = {}) {
    this.model = options.model ?? DEFAULT_ANTHROPIC_MODEL;
    this.client = options.client ?? new Anthropic();
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: request.maxOutputTokens,
      system: request.system,
      messages: request.messages,
      tools: request.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema as Anthropic.Tool.InputSchema,
      })),
    });

    return {
      content: response.content as ContentBlock[],
      stopReason: mapStopReason(response.stop_reason),
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }
}

function mapStopReason(
  reason: string | null,
): CompletionResponse["stopReason"] {
  switch (reason) {
    case "end_turn":
    case "tool_use":
    case "max_tokens":
      return reason;
    default:
      return "other";
  }
}
