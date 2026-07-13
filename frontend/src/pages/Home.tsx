import { useState } from "react";
import type { PlannerResponse } from "../types/planner";

function Home() {
  const [plan, setPlan] = useState<PlannerResponse | null>(null);
  const [description, setDescription] = useState("");
  return (
  <div>
    <h1>Forge AI Engineer</h1>

    <textarea
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      placeholder="Describe your software project..."
      rows={6}
    />

    <br />
    <br />

    <button>Generate Plan</button>
  </div>
);
}

export default Home;