function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

        <div className="flex items-center gap-4">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 font-bold">
            F
          </div>

          <div>
            <h2 className="font-bold text-white">Forge</h2>
            <p className="text-xs text-zinc-500">
              AI Software Engineer
            </p>
          </div>

        </div>

        <nav className="hidden items-center gap-8 md:flex">

        <a className="text-zinc-400 transition hover:text-white" href="#">
          Planner
        </a>

        <a className="text-zinc-400 transition hover:text-white" href="#">
          Agents
        </a>

        <a className="text-zinc-400 transition hover:text-white" href="#">
          Roadmap
        </a>

        <a
          className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-300 transition hover:bg-violet-500/20"
          href="https://github.com/DhritiSoni4/forge-ai-engineer"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>

      </nav>

        <span className="rounded-full bg-violet-500/20 px-4 py-2 text-xs text-violet-300">
          Beta
        </span>

      </div>
    </header>
  );
}

export default Navbar;