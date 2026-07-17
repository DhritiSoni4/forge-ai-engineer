import { CheckCircle2 } from "lucide-react";

interface TaskCardProps {
  id: number;
  title: string;
}

function TaskCard({
  id,
  title,
}: TaskCardProps) {
  return (
    <div className="flex items-center gap-5 rounded-2xl border border-white/10 bg-zinc-900/60 p-5 transition hover:border-violet-500 hover:bg-zinc-900">

      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 font-bold">
        {id}
      </div>

      <div className="flex-1">
        <h3 className="font-semibold">{title}</h3>
      </div>

      <CheckCircle2 className="text-emerald-400" />

    </div>
  );
}

export default TaskCard;