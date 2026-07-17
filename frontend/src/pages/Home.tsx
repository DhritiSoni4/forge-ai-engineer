import { useState } from "react";

import Hero from "../components/hero/Hero";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import PlannerResults from "../components/planner/PlannerResults";
import PlannerForm from "../components/planner/PlannerForm";
import EmptyState from "../components/ui/EmptyState";
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

      <main className="mx-auto max-w-7xl px-6 pb-32">

        <section className="mx-auto max-w-5xl">

          <Card className="border border-white/10 bg-white/5 p-10 backdrop-blur-xl">

            <h2 className="text-3xl font-bold text-white">
              Describe your project
            </h2>

            <p className="mt-3 mb-8 text-zinc-400">
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

          {plan ? (
            <PlannerResults plan={plan} />
          ) : (
            <EmptyState />
          )}

        </section>

      </main>

      <AgentTimeline />

      <Footer />
    </>
  );
}

export default Home;