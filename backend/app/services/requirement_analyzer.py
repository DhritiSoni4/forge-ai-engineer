from app.schemas.project import ProjectMetadata


class RequirementAnalyzer:
    def analyze(self, prompt: str) -> ProjectMetadata:
        # Convert a natural language software request into structured metadata.

        return ProjectMetadata(
            project_type="backend_api",
            frameworks=["FastAPI"],
            language="Python",
            database=None,
            deployment=None,
            features=[]
        )