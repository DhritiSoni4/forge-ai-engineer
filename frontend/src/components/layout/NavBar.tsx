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

        <nav className="hidden gap-8 text-sm text-zinc-400 md:flex">
          <a href="#">Planner</a>
          <a href="#">Pipeline</a>
          <a href="#">GitHub</a>
        </nav>

        <span className="rounded-full bg-violet-500/20 px-4 py-2 text-xs text-violet-300">
          Beta
        </span>

      </div>
    </header>
  );
}

export default Navbar;