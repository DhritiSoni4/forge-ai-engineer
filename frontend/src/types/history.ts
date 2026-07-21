import type { PlannerResponse } from "./planner";

export interface HistoryProject {
  id: string;
  createdAt: number;
  prompt: string;
  plan: PlannerResponse;
}