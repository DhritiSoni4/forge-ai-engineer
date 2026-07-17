function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_55%)]" />

      <div className="mx-auto flex max-w-7xl flex-col items-center px-6 pb-24 pt-24 text-center md:pt-32">
        <div className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-300">
          Autonomous Multi-Agent Software Engineering
        </div>

        <h1 className="mt-8 max-w-4xl text-5xl font-black tracking-tight text-white md:text-7xl">
          Build software with
          <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-cyan-300 bg-clip-text text-transparent">
            {" "}
            AI Engineers
          </span>
        </h1>

        <p className="mt-8 max-w-3xl text-lg leading-8 text-zinc-400 md:text-xl">
          Forge transforms natural language requirements into structured
          implementation plans using specialized AI agents. The long-term vision
          is a fully autonomous engineering platform that can plan, generate,
          execute, and review production-ready software.
        </p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">
            FastAPI
          </span>

          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">
            Multi-Agent
          </span>

          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">
            TypeScript
          </span>

          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">
            AI Native
          </span>
        </div>
      </div>
    </section>
  );
}

export default Hero;