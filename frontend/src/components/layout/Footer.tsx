function Footer() {
  return (
    <footer className="border-t border-white/10 py-12">

      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 text-center md:flex-row">

        <div>

          <h2 className="text-xl font-bold">
            Forge AI Engineer
          </h2>

          <p className="mt-2 text-zinc-500">
            Autonomous Multi-Agent Software Engineering Platform
          </p>

        </div>

        <div className="text-sm text-zinc-600">
          Built with React • FastAPI • TypeScript • AI
        </div>

      </div>

    </footer>
  );
}

export default Footer;