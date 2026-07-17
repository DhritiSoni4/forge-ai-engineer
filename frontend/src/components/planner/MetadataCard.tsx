interface MetadataCardProps {
  title: string;
  value: string;
}

function MetadataCard({
  title,
  value,
}: MetadataCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 transition hover:-translate-y-1 hover:border-violet-500">

      <p className="text-sm uppercase tracking-widest text-zinc-500">
        {title}
      </p>

      <h3 className="mt-3 text-xl font-semibold text-white">
        {value}
      </h3>

    </div>
  );
}

export default MetadataCard;