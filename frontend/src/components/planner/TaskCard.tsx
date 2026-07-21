import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface TaskCardProps {
  id: number;
  title: string;
}

const variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
    },
  },
};

function TaskCard({
  id,
  title,
}: TaskCardProps) {
  return (
    <motion.div
      variants={variants}
      whileHover={{
        y: -4,
        scale: 1.01,
      }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 18,
      }}
      className="group flex items-center gap-5 rounded-2xl border border-white/10 bg-zinc-900/60 p-5 backdrop-blur-xl"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 font-bold shadow-lg shadow-violet-500/30">
        {id}
      </div>

      <div className="flex-1">
        <h3 className="font-semibold text-white transition group-hover:text-violet-300">
          {title}
        </h3>
      </div>

      <CheckCircle2 className="text-emerald-400" size={22} />
    </motion.div>
  );
}

export default TaskCard;