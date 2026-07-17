import Card from "../ui/Card";

interface TaskCardProps {
  id: number;
  title: string;
}

function TaskCard({
  id,
  title,
}: TaskCardProps) {
  return (
    <Card className="flex items-center gap-5 rounded-2xl border border-white/10 bg-zinc-900/60 p-5 transition hover:border-indigo-500/40">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 font-bold">
        {id}
      </div>

      <div>
        <h3 className="font-medium">
          {title}
        </h3>
      </div>
    </Card>
  );
}

export default TaskCard;