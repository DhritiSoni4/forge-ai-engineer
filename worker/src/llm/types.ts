export type TextBlock = { type: "text"; text: string };

export type ToolUseBlock = {
  type: "tool_use";
  id: string;
  name: string;
  input: unknown;
};

export type ToolResultBlock = {
  type: "tool_result";
  tool_use_id: string;
  content: string;
  is_error: boolean;
};

export type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock;

export type Message = {
  role: "user" | "assistant";
  content: ContentBlock[];
};

export type ToolSpec = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

export type Usage = {
  inputTokens: number;
  outputTokens: number;
};

export type CompletionRequest = {
  system: string;
  messages: Message[];
  tools: ToolSpec[];
  maxOutputTokens: number;
};

export type CompletionResponse = {
  content: ContentBlock[];
  stopReason: "end_turn" | "tool_use" | "max_tokens" | "other";
  usage: Usage;
};

export interface LLMProvider {
  readonly model: string;
  complete(request: CompletionRequest): Promise<CompletionResponse>;
}
