import { useState } from "react";
import type { PlannerResponse } from "../types/planner";

function Home() {
  const [_plan, _setPlan] = useState<PlannerResponse | null>(null);
  const [description, setDescription] = useState("");

  return (
    <main className="home">
      <section className="hero">
        <h1>Forge AI Engineer</h1>
        <p>AI-powered multi-agent software engineering platform.</p>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your software project..."
          rows={8}
        />

        <button>Generate Plan</button>
      </section>
    </main>
  );
}

export default Home;