from fastapi import APIRouter
from app.schemas.planner import PlannerRequest, PlannerResponse, PlannerTask

router = APIRouter()


@router.get("/")
def root():
    return {"message": "Hello, Forge!"}

@router.post("/plan", response_model=PlannerResponse)
def create_plan(request: PlannerRequest):
    return PlannerResponse(
        project_name="Demo Project",
        tasks=[
            PlannerTask(id=1, title="Analyze user requirements"),
            PlannerTask(id=2, title="Design project structure"),
            PlannerTask(id=3, title="Generate implementation plan"),
        ],
    )