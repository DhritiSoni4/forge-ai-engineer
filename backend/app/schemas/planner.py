from pydantic import BaseModel


class PlannerRequest(BaseModel):
    prompt: str


class PlannerTask(BaseModel):
    id: int
    title: str


class PlannerResponse(BaseModel):
    project_name: str
    tasks: list[PlannerTask]