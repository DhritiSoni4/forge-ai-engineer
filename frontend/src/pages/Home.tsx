import { useState } from "react";

import Hero from "../components/hero/Hero";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

import PlannerForm from "../components/planner/PlannerForm";

import AgentTimeline from "../components/pipeline/AgentTimeline";

import Card from "../components/common/Card";

import { getPlan } from "../api/planner";

import type { PlannerResponse } from "../types/planner";

function Home() {
  const [description, setDescription] = useState("");

  const [plan, setPlan] = useState<PlannerResponse | null>(null);

  const handleGeneratePlan = async () => {
    try {
      const response = await getPlan(description);

      setPlan(response);
    } catch (error) {
      console.error(error);
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
              onDescriptionChange={setDescription}
              onGeneratePlan={handleGeneratePlan}
            />

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