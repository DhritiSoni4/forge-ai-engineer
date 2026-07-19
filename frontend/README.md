# Forge AI Engineer 🚀

Forge AI Engineer is an autonomous multi-agent software engineering platform that transforms natural language software requirements into production-ready applications through a collaborative AI agent pipeline.

> **Current Status:** 🚧 Milestone 2 — Premium Frontend MVP

---

# Vision

Forge aims to automate the complete software development lifecycle using specialized AI agents that each solve one well-defined problem.

```
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
             Production Software
```

Each agent is independent, modular, and replaceable with more advanced implementations over time.

---

# Tech Stack

## Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Framer Motion
- Lucide React

## Backend

- FastAPI
- Python
- Pydantic
- Pytest

---

# Current Architecture

```
forge-ai-engineer/

├── backend/
│
│   ├── app/
│   │
│   ├── agents/
│   │      planner_agent.py
│   │
│   ├── api/
│   ├── services/
│   ├── schemas/
│   ├── models/
│   └── main.py
│
│
├── frontend/
│
│   └── src/
│
│       ├── api/
│       ├── assets/
│       ├── components/
│       │
│       ├── hero/
│       ├── layout/
│       ├── pipeline/
│       ├── planner/
│       └── ui/
│
│       ├── pages/
│       └── types/
│
└── README.md
```

---

# Current Backend Flow

```
Client
   │
   ▼
POST /plan
   │
   ▼
Planner Service
   │
   ├─────────────┐
   ▼             ▼
Requirement   Planner Agent
Analyzer
   │             │
   ▼             ▼
Metadata      Implementation Tasks
        │
        ▼
 Planner Response
```

---

# Frontend Features

### Premium Landing Page

- Modern dark theme
- Responsive layout
- Glassmorphism cards
- Animated hero
- Premium typography
- Sticky navigation

---

### Planner Workspace

- AI prompt workspace
- Project description input
- Loading experience
- Error handling
- Empty state
- Responsive layout

---

### Planner Results

- Project overview
- Metadata dashboard
- Implementation roadmap
- Modular task cards
- Reusable metadata cards

---

### AI Pipeline

Visual representation of Forge's multi-agent architecture.

Current agents:

- ✅ Requirement Analyzer
- ✅ Planner Agent
- 🚧 Code Generator
- 🚧 Execution Agent
- 🚧 Reviewer Agent

---

# Backend Features

## Requirement Analyzer

Current capabilities

### Framework Detection

- FastAPI
- Django

### Database Detection

- PostgreSQL
- MySQL
- MongoDB
- SQLite

### Project Type Detection

- Backend API
- Unknown

Example

Input

```
Build a FastAPI weather API with PostgreSQL
```

Output

```json
{
  "project_type": "backend_api",
  "frameworks": ["FastAPI"],
  "language": "Python",
  "database": "PostgreSQL",
  "deployment": null,
  "features": []
}
```

---

## Planner Agent

Consumes project metadata and dynamically generates implementation plans.

Example

```json
{
  "project_name": "Weather API",
  "metadata": {
    "language": "Python",
    "frameworks": ["FastAPI"],
    "database": "PostgreSQL"
  },
  "tasks": [
    {
      "id": 1,
      "title": "Initialize backend project"
    },
    {
      "id": 2,
      "title": "Configure PostgreSQL"
    },
    {
      "id": 3,
      "title": "Implement API"
    }
  ]
}
```

---

# Running Forge

## Backend

```bash
cd backend

python3 -m venv venv

source venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# Current Milestone

## ✅ Milestone 1 — Planning Backend

Completed

- FastAPI backend
- Planner API
- Requirement Analyzer
- Planner Agent
- Dynamic planning
- Unit tests

---

## 🚧 Milestone 2 — Premium Frontend MVP

Completed

- Premium landing page
- Dark theme UI
- Responsive layout
- Planner workspace
- Planner results dashboard
- Animated loading state
- Empty state
- Multi-agent pipeline
- Reusable UI component library
- Tailwind CSS migration
- Framer Motion animations
- Workspace sidebar

---

# Roadmap

## Milestone 3

### Intelligent Planner

- LLM-powered planning
- Streaming responses
- Task dependency graph
- Project reasoning

---

## Milestone 4

### Code Generation

- Multi-file generation
- Repository creation
- Project templates
- Agent memory

---

## Milestone 5

### Autonomous Execution

- Execution Agent
- Debugging Agent
- Self-healing workflow
- Reviewer Agent
- Multi-agent orchestration

---

## Milestone 6

### Production Platform

- Authentication
- Project history
- Team workspaces
- GitHub integration
- Docker execution
- Cloud deployment
- Real-time collaboration

---

# Development Philosophy

Forge is built using production software engineering principles.

Every feature follows the same workflow:

1. Design
2. Implement
3. Test
4. Commit
5. Document
6. Iterate

The project prioritizes modularity, scalability, and maintainability to support future AI capabilities such as LLM reasoning, streaming execution, autonomous coding, and distributed multi-agent orchestration.

---

# Project Status

| Component | Status |
|-----------|--------|
| Backend API | ✅ |
| Requirement Analyzer | ✅ |
| Planner Agent | ✅ |
| Frontend MVP | ✅ |
| Design System | ✅ |
| Planner Workspace | ✅ |
| Results Dashboard | ✅ |
| Agent Timeline | ✅ |
| Code Generator | 🚧 |
| Execution Engine | 🚧 |
| Reviewer Agent | 🚧 |
| Multi-Agent Orchestration | 🚧 |
| LLM Integration | 🚧 |
| Production Deployment | 🚧 |

---

Built with ❤️ to explore the future of autonomous software engineering.