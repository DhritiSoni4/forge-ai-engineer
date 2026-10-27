import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { TransportFactory } from "../../src/mcp/manager.js";

export type MockTool = {
  name: string;
  description?: string;
  handler: (args: Record<string, unknown>, call: number) => Promise<CallToolResult> | CallToolResult;
};

export function text(value: string): CallToolResult {
  return { content: [{ type: "text", text: value }] };
}

/**
 * Builds a transport factory backed by an in-process MCP server. Every connect
 * creates a fresh server, so reconnects are observable via `state.connections`.
 */
export function mockServer(tools: MockTool[]) {
  const state = { connections: 0, servers: [] as Server[], calls: 0 };

  const factory: TransportFactory = () => {
    state.connections += 1;
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();

    const server = new Server(
      { name: "mock", version: "1.0.0" },
      { capabilities: { tools: {} } },
    );
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description ?? `${tool.name} tool`,
        inputSchema: { type: "object" as const, properties: {} },
      })),
    }));
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const tool = tools.find((candidate) => candidate.name === request.params.name);
      if (!tool) throw new Error(`no such tool ${request.params.name}`);
      state.calls += 1;
      return tool.handler(request.params.arguments ?? {}, state.calls);
    });

    state.servers.push(server);
    void server.connect(serverSide);
    return clientSide;
  };

  return { factory, state };
}
