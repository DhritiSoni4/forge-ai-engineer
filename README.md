# Forge AI Engineer 🚀

An autonomous multi-agent AI software engineering platform that can analyze software requirements, generate implementation plans, generate code, execute tasks, and review software through a modular AI agent architecture.

> **Current Status:** 🚧 Milestone 2 – Frontend Development

---

# Project Goal

Forge aims to automate the software engineering lifecycle using specialized AI agents.

The long-term vision is:

```
User Request
      │
      ▼
Requirement Analyzer
      │
      ▼
Planner Agent
      │
      ▼
Code Generator Agent
      │
      ▼
Execution Agent
      │
      ▼
Reviewer Agent
      │
      ▼
Final Software Project
```

Each agent has a single responsibility and can later be replaced or upgraded independently.

---

# Current Architecture

```
forge-ai-engineer/
│
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   └── planner_agent.py
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   │   ├── planner.py
│   │   │   └── project.py
│   │   ├── services/
│   │   │   ├── planner_service.py
│   │   │   └── requirement_analyzer.py
│   │   └── main.py
│   │
│   └── tests/
│
├── frontend/
│
├── docs/
│
└── README.md
```

---

# Current Backend Flow

```
Client
   │
   ▼
FastAPI Route
   │
   ▼
PlannerService
   │
   ├──────────────┐
   ▼              ▼
Requirement    PlannerAgent
Analyzer
   │              │
   ▼              ▼
ProjectMetadata  Planner Tasks
        │
        ▼
PlannerResponse
```

---

# Implemented Features

## Backend

- ✅ FastAPI backend
- ✅ Modular architecture
- ✅ Planner endpoint
- ✅ Requirement Analyzer
- ✅ Planner Agent
- ✅ Dynamic implementation plan generation
- ✅ Structured API responses
- ✅ Unit tests using Pytest

---

# Requirement Analyzer

Current capabilities:

### Framework Detection

- FastAPI
- Django

### Database Detection

- PostgreSQL
- MySQL
- MongoDB
- SQLite

### Project Type Detection

- backend_api
- unknown

The analyzer converts natural language into structured `ProjectMetadata`.

Example:

Input:

```
Build a FastAPI weather API with PostgreSQL
```

Output:

```json
{
  "project_type": "backend_api",
  "frameworks": [
    "FastAPI"
  ],
  "language": "Python",
  "database": "PostgreSQL",
  "deployment": null,
  "features": []
}
```

---

# Planner Agent

The Planner Agent consumes `ProjectMetadata` and generates a dynamic implementation plan.

Example response:

```json
{
  "project_name": "Build a FastAPI weather API with PostgreSQL",
  "metadata": {
    "project_type": "backend_api",
    "frameworks": [
      "FastAPI"
    ],
    "language": "Python",
    "database": "PostgreSQL",
    "deployment": null,
    "features": []
  },
  "tasks": [
    {
      "id": 1,
      "title": "Initialize backend project"
    },
    {
      "id": 2,
      "title": "Configure PostgreSQL database"
    },
    {
      "id": 3,
      "title": "Implement application logic"
    },
    {
      "id": 4,
      "title": "Write unit tests"
    }
  ]
}
```

---

# Testing

Run backend tests:

```bash
cd backend
python3 -m pytest
```

Current status:

```
4 passed
```

---

# Current Milestone

## ✅ Milestone 1 — Backend Planning Pipeline

Completed:

- FastAPI backend
- Planner API
- Requirement Analyzer
- Planner Agent
- Dynamic planning
- Metadata extraction
- Unit testing

---

## 🚧 Milestone 2 — Frontend Development (Current)

Next tasks:

- Build React + TypeScript UI
- Connect frontend to backend
- Display project metadata
- Display implementation plan
- Improve user experience

---

# Future Roadmap

### Milestone 3

- LLM-powered Planner Agent
- Intelligent task generation
- Task dependency graph (DAG)

### Milestone 4

- Code Generator Agent
- Repository generation
- File generation

### Milestone 5

- Execution Agent
- Debugger Agent
- Reviewer Agent
- Multi-agent orchestration

---

# Development Philosophy

Forge is being developed incrementally using production software engineering practices.

For every feature:

1. Build the smallest working version.
2. Test it.
3. Commit with a meaningful message.
4. Update documentation.
5. Iterate.

This keeps the architecture clean while allowing rapid feature development.
