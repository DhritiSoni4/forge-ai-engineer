import { useState } from "react";
import { getPlan } from "../api/planner";
import type { PlannerResponse } from "../types/planner";

function Home() {
  const [plan, setPlan] = useState<PlannerResponse | null>(null);
  const [description, setDescription] = useState("");

  const handleGeneratePlan = async () => {
    try {
      const response = await getPlan(description);
      setPlan(response);
      console.log(response);
    } catch (error) {
      console.error(error);
    }
  };

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

        <button onClick={handleGeneratePlan}>
          Generate Plan
        </button>
      </section>
    </main>
  );
}

export default Home;