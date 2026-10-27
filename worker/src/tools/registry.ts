import type { ToolSpec } from "../llm/types.js";

/**
 * Risk classes drive the approval policy in Phase 3. Phase 0 only records them.
 */
export type Risk = "read" | "write" | "destructive" | "external" | "network";

export interface Tool extends ToolSpec {
  readonly risk: Risk;
  execute(input: unknown): Promise<string>;
}

export class ToolRegistry {
  private readonly tools = new Map<string, Tool>();

  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  specs(): ToolSpec[] {
    return [...this.tools.values()].map(({ name, description, inputSchema }) => ({
      name,
      description,
      inputSchema,
    }));
  }
}
