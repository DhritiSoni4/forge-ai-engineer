# Forge AI Engineer 🚀

> **An autonomous multi-agent AI software engineering platform that transforms natural language requirements into structured software implementation plans through a modular multi-agent architecture.**

> **Current Status:** 🚧 Milestone 2 – Production Frontend Infrastructure • Planning Engine Complete

---

# Vision

Forge AI Engineer explores a future where software development is coordinated by a team of specialized AI agents rather than a single general-purpose model.

Each agent owns a dedicated phase of the software engineering lifecycle, enabling modular reasoning, extensibility, and future orchestration.

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

---

# Current Features

## Backend

- ✅ FastAPI backend
- ✅ Modular service architecture
- ✅ Requirement Analyzer
- ✅ Planner Agent
- ✅ Dynamic implementation roadmap generation
- ✅ Project metadata extraction
- ✅ Framework & database detection
- ✅ Structured REST API
- ✅ Unit testing with Pytest

## Frontend

### Workspace

- ✅ Premium landing page
- ✅ Sticky navigation
- ✅ Responsive layout
- ✅ Workspace sidebar
- ✅ Persistent project history
- ✅ Cursor-inspired planner workspace
- ✅ Auto-resizing prompt editor
- ✅ Keyboard shortcuts (`Ctrl/Cmd + Enter`)

### Planner Experience

- ✅ Planner API integration
- ✅ Animated loading state
- ✅ Interactive implementation roadmap
- ✅ Metadata dashboard
- ✅ Animated task cards

### AI Experience

- ✅ Multi-agent execution timeline
- ✅ AI pipeline visualization
- ✅ Aurora background
- ✅ Glassmorphism UI
- ✅ Framer Motion animations
- ✅ Reusable component library

### Application Infrastructure

- ✅ Global Command Palette (`⌘K / Ctrl + K`)
- ✅ Dynamic command registry
- ✅ Recent project commands
- ✅ Global toast notification system
- ✅ Error boundary
- 🚧 Settings system

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
│       │   ├── error/
│       │   ├── hero/
│       │   ├── layout/
│       │   ├── pipeline/
│       │   ├── planner/
│       │   ├── settings/
│       │   └── ui/
│       │       └── toast/
│       ├── pages/
│       ├── services/
│       ├── types/
│       ├── App.tsx
│       └── main.tsx
│
├── docs/
└── README.md
```

---

# Current Architecture

```text
                    React Frontend
                           │
            ┌──────────────┴──────────────┐
            ▼                             ▼
   Global Providers                Planner Workspace
(Command • Toast • Error)                 │
            │                             ▼
            │                     POST /plan API
            │                             │
            └──────────────┬──────────────┘
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

## Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# Roadmap

## ✅ Completed

- Requirement Analyzer
- Planner Agent
- Premium frontend
- Planner workspace
- Project history
- Multi-agent timeline
- Command palette
- Toast notifications
- Error boundary

## 🚧 In Progress

- Settings system
- Mobile navigation
- Global loading overlay
- Theme polish
- Accessibility improvements

## 🔜 Planned

### Intelligent Planning

- LLM-powered planner
- Streaming responses
- Dependency-aware planning
- DAG visualization

### Autonomous Coding

- Code Generator Agent
- Repository scaffolding
- Multi-file generation

### Autonomous Execution

- Execution Agent
- Reviewer Agent
- Self-healing workflows
- Multi-agent orchestration

### Platform

- Authentication
- GitHub integration
- Docker execution
- Team workspaces
- Real-time collaboration

---

# Development Philosophy

Forge is developed using production software engineering practices. Each feature is built as a complete vertical slice with a strong emphasis on modularity, scalability, maintainability, and reusable architecture. This allows future AI capabilities to be integrated without major architectural changes.

---

# Future Vision

Forge aims to become a production-grade autonomous software engineering platform capable of understanding requirements, planning architecture, generating production-ready code, executing workflows, reviewing implementations, and orchestrating multiple specialized AI agents through a modern developer workspace.
