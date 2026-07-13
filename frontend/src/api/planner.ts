import type { PlannerResponse } from "../types/planner";

const API_BASE_URL = "http://localhost:8000";

export async function getPlan(
  projectDescription: string
): Promise<PlannerResponse> {
  const response = await fetch(`${API_BASE_URL}/plan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      project_description: projectDescription,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate implementation plan.");
  }

  return response.json();
}