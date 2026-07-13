import { useState } from "react";
import type { PlannerResponse } from "../types/planner";

function Home() {
  const [plan, setPlan] = useState<PlannerResponse | null>(null);

  return <h1>Forge AI Engineer</h1>;
}

export default Home;