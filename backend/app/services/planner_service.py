from app.schemas.planner import PlannerRequest, PlannerResponse, PlannerTask


class PlannerService:
    def create_plan(self, request: PlannerRequest):
        return PlannerResponse(
            project_name=request.prompt,
            tasks=[
                PlannerTask(id=1, title="Analyze user requirements"),
                PlannerTask(id=2, title="Design project structure"),
                PlannerTask(id=3, title="Generate implementation plan"),
            ],
        )