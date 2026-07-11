from app.schemas.planner import PlannerRequest, PlannerResponse, PlannerTask
from app.services.requirement_analyzer import RequirementAnalyzer
from app.agents.planner_agent import PlannerAgent

class PlannerService:
    def create_plan(self, request: PlannerRequest):
        analyzer = RequirementAnalyzer()
        planner_agent = PlannerAgent()

        metadata = analyzer.analyze(request.prompt)

        tasks = planner_agent.generate_plan(metadata)
        
        return PlannerResponse(
            project_name=request.prompt,
            metadata=metadata,
            tasks=tasks
        )