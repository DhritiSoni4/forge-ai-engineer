import { Sparkles } from "lucide-react";
import Button from "../ui/Button";

interface PlannerFormProps {
  description: string;
  loading: boolean;
  onDescriptionChange: (value: string) => void;
  onGeneratePlan: () => void;
}

function PlannerForm({
  description,
  loading,
  onDescriptionChange,
  onGeneratePlan,
}: PlannerFormProps) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl">
        <textarea
          rows={8}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describe the software you want Forge to build...

Example:
Build a FastAPI weather API with PostgreSQL and JWT authentication."
          className="w-full resize-none rounded-2xl border border-white/10 bg-zinc-900/70 p-5 text-base text-white placeholder:text-zinc-500 outline-none transition focus:border-indigo-500"
        />

        <div className="mt-6 flex justify-end">
          <Button
            loading={loading}
            onClick={onGeneratePlan}
            disabled={!description.trim()}
          >
            <Sparkles size={18} />
            Generate Plan
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PlannerForm;