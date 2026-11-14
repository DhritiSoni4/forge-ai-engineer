import type { PlannerResponse, ProjectMetadata } from "../types/planner";

// Browser port of backend/app/services/requirement_analyzer.py and
// backend/app/agents/planner_agent.py, used by the static GitHub Pages demo.
// It is deterministic keyword matching, not an LLM.

const BACKEND = new Set(["FastAPI", "Django"]);
const FRONTEND = new Set(["React", "Next.js"]);
const BACKEND_KEYWORDS: [string, string][] = [
  ["fastapi", "FastAPI"],
  ["django", "Django"],
];
const FRONTEND_KEYWORDS: [string, string][] = [
  ["react", "React"],
  ["next.js", "Next.js"],
  ["nextjs", "Next.js"],
];
const DATABASES: [string, string][] = [
  ["postgresql", "PostgreSQL"],
  ["mysql", "MySQL"],
  ["mongodb", "MongoDB"],
  ["sqlite", "SQLite"],
];

export function analyze(prompt: string): ProjectMetadata {
  const text = prompt.toLowerCase();
  const frameworks = [...BACKEND_KEYWORDS, ...FRONTEND_KEYWORDS]
    .filter(([keyword]) => text.includes(keyword))
    .map(([, name]) => name);
  const database = DATABASES.find(([keyword]) => text.includes(keyword))?.[1] ?? null;

  const hasBackend = frameworks.some((f) => BACKEND.has(f));
  const hasFrontend = frameworks.some((f) => FRONTEND.has(f));
  const project_type =
    hasBackend && hasFrontend ? "fullstack" : hasBackend ? "backend_api" : hasFrontend ? "frontend" : "unknown";

  return { project_type, frameworks, language: "Python", database, deployment: null, features: [] };
}

export function planLocally(prompt: string): PlannerResponse {
  const metadata = analyze(prompt);
  const titles: string[] = [];
  if (metadata.project_type === "backend_api") titles.push("Initialize backend project");
  if (metadata.database) titles.push(`Configure ${metadata.database} database`);
  titles.push("Implement application logic", "Write unit tests");
  return {
    project_name: prompt,
    metadata,
    tasks: titles.map((title, i) => ({ id: i + 1, title })),
  };
}
