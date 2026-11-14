import { useState } from "react";
import Home from "./pages/Home";
import Runs from "./pages/Runs";
import DemoBanner from "./components/ui/DemoBanner";

type View = "runs" | "planner";

function App() {
  const [view, setView] = useState<View>("runs");
  const tab = (id: View, label: string) => (
    <button
      onClick={() => setView(id)}
      className={`rounded-lg px-4 py-1.5 text-sm transition ${
        view === id ? "bg-violet-500/20 text-white" : "text-zinc-400 hover:text-white"
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <DemoBanner />
      <nav className="flex items-center gap-2 border-b border-white/10 bg-black/60 px-6 py-2 backdrop-blur-xl">
        <span className="mr-3 font-bold text-white">Forge</span>
        {tab("runs", "Agent runs")}
        {tab("planner", "Planner (prototype)")}
        <a
          className="ml-auto text-sm text-violet-300 hover:text-white"
          href="https://github.com/DhritiSoni4/forge-ai-engineer"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </nav>
      {view === "runs" ? <Runs /> : <Home />}
    </>
  );
}

export default App;
