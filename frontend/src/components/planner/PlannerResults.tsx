import type { PlannerResponse } from "../../types/planner";

import MetadataCard from "./MetadataCard";
import TaskCard from "./TaskCard";

interface PlannerResultsProps {
  plan: PlannerResponse;
}

function PlannerResults({
  plan,
}: PlannerResultsProps) {
  return (
    <section className="mt-12 space-y-10">

      <div>

        <h2 className="text-3xl font-bold">
          {plan.project_name}
        </h2>

        <p className="mt-2 text-zinc-400">
          Generated implementation roadmap.
        </p>

      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

        <MetadataCard
          title="Project Type"
          value={plan.metadata.project_type}
        />

        <MetadataCard
          title="Language"
          value={plan.metadata.language}
        />

        <MetadataCard
          title="Framework"
          value={plan.metadata.frameworks.join(", ")}
        />

        <MetadataCard
          title="Database"
          value={plan.metadata.database || "None"}
        />

      </div>

      <div>

        <h2 className="mb-6 text-2xl font-bold">
          Implementation Plan
        </h2>

        <div className="space-y-4">

          {plan.tasks.map((task) => (
            <TaskCard
              key={task.id}
              id={task.id}
              title={task.title}
            />
          ))}

        </div>

      </div>

    </section>
  );
}

export default PlannerResults;