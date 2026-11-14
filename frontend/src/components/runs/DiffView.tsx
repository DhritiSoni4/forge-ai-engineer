export default function DiffView({ diff }: { diff: string }) {
  if (!diff.trim()) {
    return <p className="text-sm text-zinc-500">No changes were made.</p>;
  }
  return (
    <pre className="max-h-96 overflow-auto rounded-xl border border-white/10 bg-black/50 p-4 text-xs leading-relaxed">
      {diff.split("\n").map((line, i) => {
        const tone = line.startsWith("+") && !line.startsWith("+++")
          ? "bg-emerald-500/10 text-emerald-300"
          : line.startsWith("-") && !line.startsWith("---")
            ? "bg-rose-500/10 text-rose-300"
            : line.startsWith("@@")
              ? "text-violet-300"
              : line.startsWith("diff ") || line.startsWith("index ")
                ? "text-zinc-500"
                : "text-zinc-400";
        return (
          <div key={i} className={tone}>
            {line || " "}
          </div>
        );
      })}
    </pre>
  );
}
