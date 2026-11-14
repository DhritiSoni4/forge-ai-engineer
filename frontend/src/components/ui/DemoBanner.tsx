import { IS_DEMO } from "../../api/planner";

const REPO = "https://github.com/DhritiSoni4/forge-ai-engineer";

export default function DemoBanner() {
  if (!IS_DEMO) return null;
  return (
    <div className="w-full border-b border-white/10 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-200">
      Static demo: this planner is rule-based and runs in your browser. The agent engine
      (Planner → Coder → Reviewer in a Docker sandbox, plus the eval harness) lives in{" "}
      <a className="underline" href={`${REPO}/tree/main/worker`} target="_blank" rel="noreferrer">
        worker/
      </a>
      .
    </div>
  );
}
