from app.schemas.project import ProjectMetadata

BACKEND_FRAMEWORKS = {
    "FastAPI",
    "Django",
}
FRAMEWORK_KEYWORDS = {
    "fastapi": "FastAPI",
    "django": "Django",
}


class RequirementAnalyzer:
    def analyze(self, prompt: str) -> ProjectMetadata:
        """
        Convert a natural language software request into structured metadata.
        """

        prompt_lower = prompt.lower()

        frameworks = []

        for keyword, framework in FRAMEWORK_KEYWORDS.items():
            if keyword in prompt_lower:
                frameworks.append(framework)

        project_type = "unknown"

        if any(framework in BACKEND_FRAMEWORKS for framework in frameworks):
            project_type = "backend_api"

        return ProjectMetadata(
            project_type=project_type,
            frameworks=frameworks,
            language="Python",
            database=None,
            deployment=None,
            features=[]
        )