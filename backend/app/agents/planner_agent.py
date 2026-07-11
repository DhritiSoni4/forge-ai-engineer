from app.schemas.project import ProjectMetadata
from app.schemas.planner import PlannerTask


class PlannerAgent:
    def generate_plan(self, metadata: ProjectMetadata) -> list[PlannerTask]:
        """
        Generate an implementation plan from structured project metadata.
        """

        tasks = []
        task_id = 1

        if metadata.project_type == "backend_api":
            tasks.append(
                PlannerTask(
                    id=task_id,
                    title="Initialize backend project"
                )
            )
            task_id += 1

        if metadata.database:
            tasks.append(
                PlannerTask(
                    id=task_id,
                    title=f"Configure {metadata.database} database"
                )
            )
            task_id += 1

        tasks.append(
            PlannerTask(
                id=task_id,
                title="Implement application logic"
            )
        )
        task_id += 1

        tasks.append(
            PlannerTask(
                id=task_id,
                title="Write unit tests"
            )
        )

        return tasks