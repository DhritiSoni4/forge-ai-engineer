from app.schemas.project import ProjectMetadata

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

        return ProjectMetadata(
            project_type="backend_api",
            frameworks=frameworks,
            language="Python",
            database=None,
            deployment=None,
            features=[]
        )