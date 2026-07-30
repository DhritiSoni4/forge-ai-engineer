# Forge AI Engineer 🚀

> **An autonomous multi-agent AI software engineering platform that transforms natural language requirements into structured software implementation plans, with a modular architecture designed for autonomous code generation, execution, and software review.**

> **Current Status:** 🚧 Milestone 2 – Premium Frontend & Planning Engine

---

# Vision

Software development is becoming increasingly AI-assisted, yet most tools still require developers to manually coordinate planning, implementation, debugging, and review.

**Forge AI Engineer** explores a different approach.

Instead of relying on a single AI model, Forge is designed as a team of specialized AI agents, where each agent owns a distinct phase of the software engineering lifecycle.

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
           Completed Software
```

Each agent is modular, independently replaceable, and designed to scale as more capable reasoning models become available.

---

# Current Features

## Backend

- ✅ FastAPI backend
- ✅ Modular service architecture
- ✅ Requirement Analyzer
- ✅ Planner Agent
- ✅ Dynamic implementation roadmap generation
- ✅ Structured REST API
- ✅ Project metadata extraction
- ✅ Framework detection
- ✅ Database detection
- ✅ Unit testing with Pytest

---

## Frontend

### Workspace

- ✅ Premium landing page
- ✅ Sticky navigation
- ✅ Responsive layout
- ✅ Workspace sidebar
- ✅ Persistent project history
- ✅ Cursor-inspired planner workspace
- ✅ Auto-resizing prompt editor
- ✅ Keyboard shortcuts (Ctrl/Cmd + Enter)

### Planner

- ✅ Backend API integration
- ✅ Animated loading experience
- ✅ Interactive implementation roadmap
- ✅ Metadata dashboard
- ✅ Animated task cards

### AI Experience

- ✅ Multi-agent execution timeline
- ✅ AI pipeline visualization
- ✅ Framer Motion animations
- ✅ Aurora background
- ✅ Premium glassmorphism UI
- ✅ Reusable component library

### Command Palette

- 🚧 Global Command Palette
- 🚧 Dynamic command registry
- 🚧 Recent project commands

---

# Tech Stack

## Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Framer Motion
- Lucide React
- cmdk

## Backend

- FastAPI
- Python
- Pydantic
- Pytest

---

# Repository Structure

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
│   └── src/
│       ├── api/
│       ├── assets/
│       ├── components/
│       │   ├── command/
│       │   ├── hero/
│       │   ├── layout/
│       │   ├── pipeline/
│       │   ├── planner/
│       │   └── ui/
│       ├── pages/
│       ├── services/
│       ├── types/
│       ├── App.tsx
│       └── main.tsx
│
├── docs/
│
└── README.md
```

---

# Current Architecture

```text
                    React Frontend
                           │
                           ▼
                  Planner Workspace
                           │
                           ▼
                    POST /plan API
                           │
                           ▼
               Requirement Analyzer
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
      Project Metadata           Planner Agent
             │                           │
             └─────────────┬─────────────┘
                           ▼
               Implementation Plan
                           │
                           ▼
                Interactive Planner UI
                           │
                           ▼
             Persistent Project History
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

Completed

- FastAPI backend
- Requirement Analyzer
- Planner Agent
- Dynamic implementation planning
- REST API
- Unit tests

---

## 🚧 Milestone 2 — Premium Frontend

Current Progress

- Premium landing page
- Planner workspace
- Metadata dashboard
- Task visualization
- Responsive UI
- Project history
- Multi-agent timeline
- Command palette
- Design system

---

## 🔜 Milestone 3 — Intelligent Planning

Planned

- LLM-powered Planner Agent
- Streaming responses
- Rich reasoning
- Dependency-aware planning
- DAG visualization

---

## 🔜 Milestone 4 — Autonomous Code Generation

Planned

- Code Generator Agent
- Multi-file generation
- Repository scaffolding
- Framework-aware generation

---

## 🔜 Milestone 5 — Autonomous Software Engineering

Planned

- Execution Agent
- Reviewer Agent
- Self-healing workflows
- Multi-agent orchestration
- Live execution logs
- End-to-end software generation

---

# Running the Project

## Backend

```bash
cd backend

pip install -r requirements.txt

uvicorn app.main:app --reload
```

Run tests

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

Forge is built as a production-oriented software engineering platform rather than a prototype.

Every feature is developed as a complete vertical slice with an emphasis on modularity, scalability, maintainability, and clean architecture. This enables future capabilities—such as streaming LLM reasoning, autonomous code generation, execution engines, GitHub integration, and collaborative multi-agent workflows—to be added without significant architectural changes.

---

# Future Vision

Forge aims to evolve into a fully autonomous AI software engineer capable of understanding requirements, planning architecture, generating production-ready code, executing software, reviewing implementations, and deploying complete projects through coordinated AI agents.