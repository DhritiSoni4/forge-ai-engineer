import { Sparkles } from "lucide-react";

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-10 py-20 text-center backdrop-blur-xl">

      <Sparkles className="mx-auto mb-6 h-12 w-12 text-violet-400" />

      <h2 className="text-2xl font-bold">
        No Project Generated
      </h2>

      <p className="mt-4 text-zinc-400">
        Describe your software idea above and Forge will generate an implementation roadmap.
      </p>

    </div>
  );
}

export default EmptyState;