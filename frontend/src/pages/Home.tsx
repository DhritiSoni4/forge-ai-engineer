import { useCallback, useEffect, useState } from "react";
import Hero from "../components/hero/Hero";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import Sidebar from "../components/layout/Sidebar";

import PlannerForm from "../components/planner/PlannerForm";
import PlannerResults from "../components/planner/PlannerResults";

import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import Card from "../components/ui/Card";
import { useToast } from "../components/ui/toast/ToastProvider";

import { registerRecentProjects } from "../components/command/commands";
import AgentTimeline from "../components/pipeline/AgentTimeline";

import { getPlan } from "../api/planner";

import {
  deleteProject,
  getHistory,
  saveProject,
} from "../services/history";

import type { PlannerResponse } from "../types/planner";
import type { HistoryProject } from "../types/history";

function Home() {
  const [description, setDescription] = useState("");
  const [plan, setPlan] = useState<PlannerResponse | null>(null);
  const [history, setHistory] = useState<HistoryProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { showToast } = useToast();

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleGeneratePlan = async () => {
    if (!description.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await getPlan(description);

      setPlan(response);

      showToast({
        variant: "success",
        title: "Plan generated",
        description:
          "Implementation roadmap created successfully.",
      });

      const updatedHistory = saveProject(
        description,
        response,
      );

      setHistory(updatedHistory);
    } catch {
      setError("Failed to generate implementation plan.");

      showToast({
        variant: "error",
        title: "Generation failed",
        description:
          "Unable to generate the implementation plan.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreProject = useCallback(
  (project: HistoryProject) => {
    setDescription(project.prompt);

    setPlan(project.plan);

    showToast({
      variant: "info",
      title: "Project restored",
      description: project.plan.project_name,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  },
  [showToast]
);

  useEffect(() => {
    registerRecentProjects(
      history,
      handleRestoreProject
    );
  }, [history, handleRestoreProject]);

  const handleDeleteProject = (id: string) => {
    setHistory(deleteProject(id));

    if (plan) {
      const exists = history.some(
        (p) =>
          p.id !== id &&
          p.plan.project_name === plan.project_name,
      );

      if (!exists) {
        setPlan(null);
      }
    }

    showToast({
      variant: "warning",
      title: "Project deleted",
      description: "Removed from local history.",
    });
  };

  return (
    <>
      <Navbar />

      <Hero />

      <main className="mx-auto flex max-w-7xl gap-8 px-6 pb-32">
        <Sidebar
          history={history}
          onSelectProject={handleRestoreProject}
          onDeleteProject={handleDeleteProject}
        />

        <section className="mx-auto flex-1 max-w-5xl">
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

          {loading ? (
            <LoadingState />
          ) : plan ? (
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