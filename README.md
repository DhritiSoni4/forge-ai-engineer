# Forge AI Engineer 🚀

> **An autonomous multi-agent AI software engineering platform that transforms natural language requirements into structured software implementation plans, with future support for autonomous code generation, execution, and software review.**

> **Current Status:** 🚧 Milestone 2 – Frontend MVP

---

## Vision

Software development is becoming increasingly AI-assisted, but today's tools still require engineers to manually coordinate planning, implementation, debugging, and review.

**Forge AI Engineer** explores a different approach.

Instead of relying on a single AI model, Forge is designed as a team of specialized AI agents, each responsible for one stage of the software engineering lifecycle.

```text
User Prompt
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
Completed Software Project
```

Each agent is modular, independently replaceable, and designed to scale as more advanced reasoning models become available.

---

# Current Features

## Backend

- ✅ FastAPI backend
- ✅ Modular service architecture
- ✅ Requirement Analyzer
- ✅ Planner Agent
- ✅ Dynamic implementation plan generation
- ✅ Structured API responses
- ✅ Unit testing with Pytest

## Frontend

- ✅ React + TypeScript + Vite
- ✅ Planner workspace
- ✅ Backend API integration
- ✅ Dynamic project metadata display
- ✅ Responsive landing page
- ✅ Modular component architecture
- 🚧 Premium UI redesign in progress

---

# Tech Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

## Backend

- FastAPI
- Python
- Pydantic
- Pytest

---

# Current Architecture

```text
forge-ai-engineer/

├── backend/
│   ├── app/
│   │   ├── agents/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   └── tests/
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── types/
│   │   └── App.tsx
│
├── docs/
│
└── README.md
```

---

# Current Planning Pipeline

```text
User Prompt
      │
      ▼
FastAPI API
      │
      ▼
Planner Service
      │
 ┌────┴─────────────┐
 ▼                  ▼
Requirement     Planner
Analyzer         Agent
 │                  │
 ▼                  ▼
Project Metadata    Tasks
        │
        ▼
 Planner Response
```

---

# Example

## Input

```text
Build a FastAPI weather API with PostgreSQL
```

## Output

```json
{
  "project_name": "Build a FastAPI weather API with PostgreSQL",
  "metadata": {
    "project_type": "backend_api",
    "frameworks": ["FastAPI"],
    "language": "Python",
    "database": "PostgreSQL"
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

# Project Roadmap

## ✅ Milestone 1 — Planning Backend

Completed:

- FastAPI backend
- Requirement Analyzer
- Planner Agent
- Dynamic implementation planning
- Unit tests

---

## 🚧 Milestone 2 — Frontend MVP (Current)

In Progress:

- Premium React interface
- Planner workspace
- Project metadata visualization
- Task roadmap visualization
- Responsive UI
- Modern design system

---

## 🔜 Milestone 3 — Intelligent Planning

Planned:

- LLM-powered Planner Agent
- Rich reasoning
- Dependency-aware task planning
- DAG visualization

---

## 🔜 Milestone 4 — Autonomous Code Generation

Planned:

- Code Generator Agent
- Multi-file project generation
- Repository scaffolding
- Framework-aware generation

---

## 🔜 Milestone 5 — Autonomous Software Engineering

Planned:

- Execution Agent
- Debugging Agent
- Reviewer Agent
- Multi-agent orchestration
- Streaming agent reasoning
- End-to-end software generation

---

# Running the Project

## Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Run tests:

```bash
python -m pytest
```

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# Development Philosophy

Forge is built incrementally using production software engineering practices.

Every milestone follows the same workflow:

1. Build a working vertical slice.
2. Verify functionality through testing.
3. Commit meaningful, production-ready changes.
4. Update documentation.
5. Iterate toward a scalable architecture.

This approach keeps the project stable while allowing rapid experimentation with autonomous AI agents.

---

# Future Vision

Forge aims to become an autonomous AI software engineer capable of understanding software requirements, planning implementation, generating production-ready code, executing projects, and reviewing results through a coordinated multi-agent architecture.
