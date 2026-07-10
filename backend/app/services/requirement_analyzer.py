from app.schemas.project import ProjectMetadata

BACKEND_FRAMEWORKS = {
    "FastAPI",
    "Django",
}
FRAMEWORK_KEYWORDS = {
    "fastapi": "FastAPI",
    "django": "Django",
}

FRONTEND_FRAMEWORKS = {
    "React",
    "Next.js",
}

FRONTEND_KEYWORDS = {
    "react": "React",
    "next.js": "Next.js",
    "nextjs": "Next.js",
}

DATABASE_KEYWORDS = {
    "postgresql": "PostgreSQL",
    "mysql": "MySQL",
    "mongodb": "MongoDB",
    "sqlite": "SQLite",
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
        
        for keyword, framework in FRONTEND_KEYWORDS.items():
            if keyword in prompt_lower:
                frameworks.append(framework)

        database = None

        for keyword, db in DATABASE_KEYWORDS.items():
            if keyword in prompt_lower:
                database = db
                break

        has_backend = any(
            framework in BACKEND_FRAMEWORKS
            for framework in frameworks
        )

        has_frontend = any(
            framework in FRONTEND_FRAMEWORKS
            for framework in frameworks
        )

        if has_backend and has_frontend:
            project_type = "fullstack"
        elif has_backend:
            project_type = "backend_api"
        elif has_frontend:
            project_type = "frontend"
        else:
            project_type = "unknown"

        return ProjectMetadata(
            project_type=project_type,
            frameworks=frameworks,
            language="Python",
            database=database,
            deployment=None,
            features=[]
        )