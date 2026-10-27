import type {
  CompletionRequest,
  CompletionResponse,
  LLMProvider,
} from "./types.js";

/**
 * Deterministic provider for tests and offline runs. Each call consumes the
 * next scripted response; running past the end is a test bug and throws.
 */
export class MockProvider implements LLMProvider {
  readonly model = "mock";
  readonly requests: CompletionRequest[] = [];
  private index = 0;

  constructor(private readonly script: CompletionResponse[]) {}

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    // Snapshot: the agent loop keeps mutating its message array after the call.
    this.requests.push(structuredClone(request));

    const response = this.script[this.index];
    if (!response) {
      throw new Error("MockProvider: script exhausted");
    }

    this.index += 1;
    return response;
  }
}
