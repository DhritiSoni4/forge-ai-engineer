export interface ProjectMetadata {
  project_type: string;
  frameworks: string[];
  language: string;
  database: string | null;
  deployment: string | null;
  features: string[];
}

export interface PlannerTask {
  id: number;
  title: string;
}

export interface PlannerResponse {
  project_name: string;
  metadata: ProjectMetadata;
  tasks: PlannerTask[];
}