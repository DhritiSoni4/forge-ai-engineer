function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-600/30">
            F
          </div>

          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              Forge
            </h1>

            <p className="text-xs text-zinc-400">
              AI Software Engineer
            </p>
          </div>
        </div>

        <nav className="hidden gap-8 text-sm text-zinc-400 md:flex">
          <a href="#planner" className="transition hover:text-white">
            Planner
          </a>

          <a href="#pipeline" className="transition hover:text-white">
            Pipeline
          </a>

          <a href="https://github.com/DhritiSoni4/forge-ai-engineer" target="_blank" rel="noreferrer" className="transition hover:text-white">
            GitHub
          </a>
        </nav>

        <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
          Beta
        </span>
      </div>
    </header>
  );
}

export default Navbar;