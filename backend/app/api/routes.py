from fastapi import APIRouter

from app.schemas.planner import PlannerRequest, PlannerResponse
from app.services.planner_service import PlannerService

router = APIRouter()

planner_service = PlannerService()


@router.get("/")
def root():
    return {"message": "Hello, Forge!"}


@router.post("/plan", response_model=PlannerResponse)
def create_plan(request: PlannerRequest):
    return planner_service.create_plan(request)