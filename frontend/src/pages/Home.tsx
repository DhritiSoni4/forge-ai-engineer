import { useState } from "react";
import { getPlan } from "../api/planner";
import type { PlannerResponse } from "../types/planner";
import PlannerForm from "../components/planner/PlannerForm";

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

        <PlannerForm
        description={description}
        onDescriptionChange={setDescription}
        onGeneratePlan={handleGeneratePlan}
      />

        {plan && (
          <section>
            <h2>{plan.project_name}</h2>

            <h3>Project Metadata</h3>

            <p>
              <strong>Project Type:</strong> {plan.metadata.project_type}
            </p>

            <p>
              <strong>Language:</strong> {plan.metadata.language}
            </p>

            <p>
              <strong>Frameworks:</strong> {plan.metadata.frameworks.join(", ")}
            </p>

            <p>
              <strong>Database:</strong> {plan.metadata.database ?? "None"}
            </p>
          </section>
        )}
      </section>
    </main>
  );
}

export default Home;