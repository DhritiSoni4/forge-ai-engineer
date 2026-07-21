import { motion } from "framer-motion";

import type { PlannerResponse } from "../../types/planner";

import MetadataCard from "./MetadataCard";
import TaskCard from "./TaskCard";

interface PlannerResultsProps {
  plan: PlannerResponse;
}

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 18,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
    },
  },
};

function PlannerResults({ plan }: PlannerResultsProps) {
  return (
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
      className="mt-12 space-y-10"
    >
      <motion.div variants={fadeUp}>
        <h2 className="text-3xl font-bold">{plan.project_name}</h2>

        <p className="mt-2 text-zinc-400">
          Generated implementation roadmap.
        </p>
      </motion.div>

      <motion.div
        variants={container}
        className="grid gap-5 md:grid-cols-2 lg:grid-cols-4"
      >
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
      </motion.div>

      <motion.div variants={fadeUp}>
        <h2 className="mb-6 text-2xl font-bold">
          Implementation Plan
        </h2>

        <motion.div
          variants={container}
          className="space-y-4"
        >
          {plan.tasks.map((task) => (
            <TaskCard
              key={task.id}
              id={task.id}
              title={task.title}
            />
          ))}
        </motion.div>
      </motion.div>
    </motion.section>
  );
}

export default PlannerResults;