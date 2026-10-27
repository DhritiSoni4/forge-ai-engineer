import type { Tool } from "./registry.js";

export const addNumbers: Tool = {
  name: "add_numbers",
  description: "Add two numbers and return their sum.",
  inputSchema: {
    type: "object",
    properties: {
      a: { type: "number" },
      b: { type: "number" },
    },
    required: ["a", "b"],
  },
  risk: "read",
  async execute(input) {
    if (
      typeof input !== "object" ||
      input === null ||
      typeof (input as { a?: unknown }).a !== "number" ||
      typeof (input as { b?: unknown }).b !== "number"
    ) {
      throw new Error("add_numbers requires numeric fields a and b");
    }
    const { a, b } = input as { a: number; b: number };
    return String(a + b);
  },
};
