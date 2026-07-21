import type { KeyboardEvent } from "react";
import {
  CornerDownLeft,
  Wand2,
} from "lucide-react";

import Button from "../ui/Button";
import Spinner from "../ui/Spinner";
import AutoResizeTextarea from "../ui/AutoResizeTextarea";

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
  const handleKeyDown = (
    e: KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();

      if (!loading && description.trim()) {
        onGeneratePlan();
      }
    }
  };

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 shadow-2xl backdrop-blur-xl">
        <AutoResizeTextarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Describe the software you want Forge to build...

Example:
Build a FastAPI weather API with PostgreSQL, JWT authentication, Redis caching, Docker deployment and CI/CD.`}
        />

        <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <CornerDownLeft size={15} />
            <span>Ctrl + Enter to generate</span>
          </div>

          <Button
            onClick={onGeneratePlan}
            disabled={loading || !description.trim()}
          >
            {loading ? (
              <>
                <Spinner />
                Generating Plan...
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
    </div>
  );
}
export default PlannerForm;