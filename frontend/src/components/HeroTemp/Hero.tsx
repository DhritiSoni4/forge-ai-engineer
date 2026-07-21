import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

function Hero() {
  return (
    <section className="relative overflow-hidden py-32">
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-20 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute right-20 top-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 text-center">

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-zinc-300 backdrop-blur"
        >
          <Sparkles size={16} />
          Autonomous Multi-Agent Software Engineering
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .1 }}
          className="max-w-5xl text-6xl font-black leading-tight tracking-tight md:text-8xl"
        >
          Build Software with
          <span className="block bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
            AI Engineers
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: .2 }}
          className="mt-8 max-w-3xl text-lg leading-8 text-zinc-400 md:text-xl"
        >
          Forge transforms natural language into production-ready software
          through autonomous planning, code generation, execution, and review.
        </motion.p>

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {[
            "FastAPI",
            "TypeScript",
            "LLMs",
            "Multi-Agent",
            "Production Ready",
          ].map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-zinc-300 backdrop-blur"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Hero;