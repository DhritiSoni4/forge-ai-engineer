import { motion } from "framer-motion";
import {
  Brain,
  ClipboardList,
  Code2,
  PlayCircle,
  ShieldCheck,
} from "lucide-react";

const agents = [
  {
    title: "Requirement Analyzer",
    icon: Brain,
    status: "Completed",
    color: "text-emerald-400",
  },
  {
    title: "Planner Agent",
    icon: ClipboardList,
    status: "Completed",
    color: "text-emerald-400",
  },
  {
    title: "Code Generator",
    icon: Code2,
    status: "Coming Soon",
    color: "text-amber-400",
  },
  {
    title: "Execution Agent",
    icon: PlayCircle,
    status: "Coming Soon",
    color: "text-amber-400",
  },
  {
    title: "Reviewer Agent",
    icon: ShieldCheck,
    status: "Planned",
    color: "text-zinc-400",
  },
];

function AgentTimeline() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">

      <div className="mb-14 text-center">

        <p className="text-violet-400 font-medium">
          Multi-Agent Pipeline
        </p>

        <h2 className="mt-3 text-5xl font-bold">
          Forge AI Workflow
        </h2>

        <p className="mt-4 text-zinc-400">
          Every software request flows through specialized autonomous agents.
        </p>

      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">

        {agents.map((agent, index) => {
          const Icon = agent.icon;

          return (
            <motion.div
              key={agent.title}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.12 }}
              viewport={{ once: true }}
              className="rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-violet-500"
            >
              <Icon className="mb-6 h-9 w-9 text-violet-400" />

              <h3 className="text-lg font-semibold">
                {agent.title}
              </h3>

              <p className={`mt-3 text-sm ${agent.color}`}>
                {agent.status}
              </p>
            </motion.div>
          );
        })}

      </div>

    </section>
  );
}

export default AgentTimeline;