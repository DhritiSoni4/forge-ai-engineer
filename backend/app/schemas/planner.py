from pydantic import BaseModel
from app.schemas.project import ProjectMetadata


class PlannerRequest(BaseModel):
    prompt: str


class PlannerTask(BaseModel):
    id: int
    title: str


class PlannerResponse(BaseModel):
    project_name: str
    metadata: ProjectMetadata
    tasks: list[PlannerTask]