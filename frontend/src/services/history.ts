import type { PlannerResponse } from "../types/planner";
import type { HistoryProject } from "../types/history";

const STORAGE_KEY = "forge-project-history";
const MAX_PROJECTS = 25;

function readStorage(): HistoryProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return [];

    return JSON.parse(raw) as HistoryProject[];
  } catch {
    return [];
  }
}

function writeStorage(projects: HistoryProject[]) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(projects),
  );
}

export function getHistory(): HistoryProject[] {
  return readStorage();
}

export function saveProject(
  prompt: string,
  plan: PlannerResponse,
) {
  const history = readStorage();

  const project: HistoryProject = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    prompt,
    plan,
  };

  const updated = [project, ...history].slice(
    0,
    MAX_PROJECTS,
  );

  writeStorage(updated);

  return updated;
}

export function deleteProject(id: string) {
  const updated = readStorage().filter(
    (project) => project.id !== id,
  );

  writeStorage(updated);

  return updated;
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

export function formatRelativeTime(timestamp: number) {
  const diff = Date.now() - timestamp;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "Just now";

  if (diff < hour)
    return `${Math.floor(diff / minute)} min ago`;

  if (diff < day)
    return `${Math.floor(diff / hour)} hr ago`;

  return `${Math.floor(diff / day)} day ago`;
}