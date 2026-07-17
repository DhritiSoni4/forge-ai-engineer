import { useState } from "react";

import Hero from "../components/hero/Hero";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

import PlannerForm from "../components/planner/PlannerForm";

import AgentTimeline from "../components/pipeline/AgentTimeline";

import Card from "../components/ui/Card";

import { getPlan } from "../api/planner";

import type { PlannerResponse } from "../types/planner";

function Home() {
  const [description, setDescription] = useState("");

  const [plan, setPlan] = useState<PlannerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGeneratePlan = async () => {
  if (!description.trim()) return;

  setLoading(true);
  setError("");

  try {
    const response = await getPlan(description);
    setPlan(response);
  } catch {
    setError("Failed to generate implementation plan.");
  } finally {
    setLoading(false);
  }
  };

  return (
    <>
      <Navbar />

      <Hero />

      <main className="planner-layout">

        <section className="planner-section">

          <Card>

            <h2 className="planner-title">
              Describe your project
            </h2>

            <p className="planner-subtitle">
              Forge will analyze your requirements and generate an implementation roadmap.
            </p>

            <PlannerForm
            description={description}
            loading={loading}
            onDescriptionChange={setDescription}
            onGeneratePlan={handleGeneratePlan}
            />
            {error && (
              <p className="mt-4 text-center text-sm text-red-400">
                {error}
              </p>
            )}

          </Card>

          {plan && (
            <Card className="results-card">

              <h2>{plan.project_name}</h2>

              <div className="metadata-grid">

                <div>
                  <strong>Project Type</strong>
                  <p>{plan.metadata.project_type}</p>
                </div>

                <div>
                  <strong>Language</strong>
                  <p>{plan.metadata.language}</p>
                </div>

                <div>
                  <strong>Frameworks</strong>
                  <p>{plan.metadata.frameworks.join(", ")}</p>
                </div>

                <div>
                  <strong>Database</strong>
                  <p>{plan.metadata.database || "None"}</p>
                </div>

              </div>

            </Card>
          )}

        </section>

      </main>

      <AgentTimeline />

      <Footer />
    </>
  );
}

export default Home;