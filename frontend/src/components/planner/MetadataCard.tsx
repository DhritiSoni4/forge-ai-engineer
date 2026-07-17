import Card from "../ui/Card";

interface MetadataCardProps {
  title: string;
  value: string;
}

function MetadataCard({
  title,
  value,
}: MetadataCardProps) {
  return (
    <Card className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
      <p className="text-sm text-zinc-400">
        {title}
      </p>

      <h3 className="mt-2 text-lg font-semibold text-white">
        {value || "—"}
      </h3>
    </Card>
  );
}

export default MetadataCard;