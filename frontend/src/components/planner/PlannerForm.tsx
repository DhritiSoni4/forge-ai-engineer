import { Wand2 } from "lucide-react";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";

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
    <div className="space-y-6">

      <textarea
        rows={8}
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="Describe the software you want Forge to build...

Example:
Build a FastAPI weather API with PostgreSQL, JWT authentication and Docker deployment."
        className="w-full rounded-2xl border border-white/10 bg-zinc-950 p-6 text-white outline-none transition focus:border-violet-500"
      />

      <div className="flex justify-end">

        <Button
          onClick={onGeneratePlan}
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner />
              Generating...
            </>
          ) : (
            <>
              <Wand2 size={18} />
              Generate Plan
            </>
          )}
        </Button>

      </div>

    </div>
  );
}

export default PlannerForm;