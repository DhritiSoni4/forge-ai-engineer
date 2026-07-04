from typing import List, Optional
from pydantic import BaseModel


class ProjectMetadata(BaseModel):
    project_type: str
    frameworks: List[str] = []
    language: Optional[str] = None
    database: Optional[str] = None
    deployment: Optional[str] = None
    features: List[str] = []