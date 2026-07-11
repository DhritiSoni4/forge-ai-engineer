from app.schemas.project import ProjectMetadata
from typing import Optional

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

        database = self._detect_database(prompt_lower)

        project_type = self._infer_project_type(frameworks)

        return ProjectMetadata(
            project_type=project_type,
            frameworks=frameworks,
            language="Python",
            database=database,
            deployment=None,
            features=[]
        )
    
    def _detect_frameworks(self, prompt_lower: str) -> list[str]:
        frameworks = self._detect_frameworks(prompt_lower)

        return frameworks
    
    def _detect_database(self, prompt_lower: str) -> Optional[str]:
        for keyword, db in DATABASE_KEYWORDS.items():
            if keyword in prompt_lower:
                return db

        return None
    
    def _infer_project_type(self, frameworks: list[str]) -> str:
        has_backend = any(
            framework in BACKEND_FRAMEWORKS
            for framework in frameworks
        )

        has_frontend = any(
            framework in FRONTEND_FRAMEWORKS
            for framework in frameworks
        )

        if has_backend and has_frontend:
            return "fullstack"
        elif has_backend:
            return "backend_api"
        elif has_frontend:
            return "frontend"

        return "unknown"