interface PlannerFormProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  onGeneratePlan: () => void;
}

function PlannerForm({
  description,
  onDescriptionChange,
  onGeneratePlan,
}: PlannerFormProps) {
  return (
    <>
      <textarea
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="Describe your software project..."
        rows={8}
      />

      <button onClick={onGeneratePlan}>
        Generate Plan
      </button>
    </>
  );
}

export default PlannerForm;