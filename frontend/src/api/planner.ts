import type { PlannerResponse } from "../types/planner";
import { planLocally } from "./localPlanner";

/** Static deployments (GitHub Pages) have no backend, so the planner runs in the browser. */
export const IS_DEMO = import.meta.env.VITE_DEMO === "1";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function getPlan(
  projectDescription: string
): Promise<PlannerResponse> {
  if (IS_DEMO) return planLocally(projectDescription);

  const response = await fetch(`${API_BASE_URL}/plan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: projectDescription,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate implementation plan.");
  }

  return response.json();
}
