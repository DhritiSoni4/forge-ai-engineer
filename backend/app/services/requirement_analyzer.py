from app.schemas.project import ProjectMetadata


class RequirementAnalyzer:
    def analyze(self, prompt: str) -> ProjectMetadata:
    # Convert a natural language software request into structured metadata.

        prompt_lower = prompt.lower()

        frameworks = []

        if "fastapi" in prompt_lower:
            frameworks.append("FastAPI")

        return ProjectMetadata(
            project_type="backend_api",
            frameworks=frameworks,
            language="Python",
            database=None,
            deployment=None,
            features=[]
        )