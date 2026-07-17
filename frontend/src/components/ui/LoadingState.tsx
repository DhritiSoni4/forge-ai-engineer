import { Brain, ClipboardList, Code2, LoaderCircle } from "lucide-react";

const steps = [
  "Analyzing requirements",
  "Building project metadata",
  "Generating implementation plan",
];

function LoadingState() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur-xl">

      <div className="flex items-center gap-3">

        <LoaderCircle className="h-6 w-6 animate-spin text-violet-400" />

        <h2 className="text-2xl font-bold">
          Forge is thinking...
        </h2>

      </div>

      <p className="mt-3 text-zinc-400">
        Your AI engineering team is preparing an implementation roadmap.
      </p>

      <div className="mt-10 space-y-6">

        {[
          { icon: Brain, title: steps[0] },
          { icon: ClipboardList, title: steps[1] },
          { icon: Code2, title: steps[2] },
        ].map((step) => {
          const Icon = step.icon;

          return (
            <div
              key={step.title}
              className="flex items-center gap-4 rounded-xl border border-white/10 bg-zinc-900/60 p-5"
            >
              <Icon className="text-violet-400" />

              <div className="flex-1">

                <p>{step.title}</p>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">

                  <div className="h-full w-full animate-pulse rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" />

                </div>

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}

export default LoadingState;