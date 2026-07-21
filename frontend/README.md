# Forge AI Engineer 🚀

> An autonomous multi-agent AI software engineering platform that transforms natural language requirements into structured implementation plans through a modular AI agent pipeline.

> **Status:** 🚧 Active Development | Planning Engine ✅ | Premium Frontend MVP ✅

---

## Overview

Forge AI Engineer is an AI-native software engineering platform designed around specialized autonomous agents. Instead of relying on a single monolithic model, Forge decomposes software development into independent reasoning stages, allowing each agent to focus on a specific task.

Current implementation focuses on intelligent project planning, while the architecture is designed to evolve toward autonomous code generation, execution, review, and deployment.

---

## AI Pipeline

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
Code Generator Agent (Planned)
      │
      ▼
Execution Agent (Planned)
      │
      ▼
Reviewer Agent (Planned)
      │
      ▼
Production Software
```

---

# Features

## Backend

- ✅ Requirement Analyzer
- ✅ Planner Agent
- ✅ Dynamic implementation roadmap generation
- ✅ FastAPI REST API
- ✅ Framework detection
- ✅ Database detection
- ✅ Project metadata extraction
- ✅ Modular backend architecture
- ✅ Unit tested planner workflow

---

## Frontend

- ✅ Premium landing page
- ✅ Sticky navigation
- ✅ Responsive design
- ✅ Cursor-inspired planner workspace
- ✅ Auto-resizing prompt editor
- ✅ Keyboard shortcut (Ctrl/Cmd + Enter)
- ✅ Animated loading experience
- ✅ Animated planner results
- ✅ Metadata dashboard
- ✅ Interactive task cards
- ✅ Multi-agent pipeline visualization
- ✅ Workspace sidebar
- ✅ Persistent project history
- ✅ Reusable UI component library
- ✅ Framer Motion animations

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

# Repository Structure

```text
forge-ai-engineer/

├── backend/
│   ├── app/
│   ├── agents/
│   ├── api/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   └── tests/
│
├── frontend/
│   └── src/
│       ├── api/
│       ├── assets/
│       ├── components/
│       │   ├── hero/
│       │   ├── layout/
│       │   ├── pipeline/
│       │   ├── planner/
│       │   └── ui/
│       ├── pages/
│       ├── services/
│       ├── types/
│       └── App.tsx
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
 Project Metadata              Planner Agent
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

# Current Progress

## ✅ Planning Engine

- Requirement Analyzer
- Planner Agent
- Dynamic task generation
- REST API
- Unit tests

---

## ✅ Premium Frontend

- Landing page
- Planner workspace
- Planner results
- Metadata dashboard
- Cursor-style prompt editor
- Animated UI
- Project history
- Responsive layout
- Design system

---

## 🚧 In Progress

- Command Palette
- Toast Notifications
- Settings Modal
- Theme Polish
- Accessibility Improvements

---

## 📍 Planned

### Intelligent Planning

- LLM-powered planning
- Streaming responses
- Task dependency graph
- Project reasoning

### Autonomous Coding

- Code Generator Agent
- Multi-file generation
- Repository creation
- Template selection

### Autonomous Execution

- Execution Agent
- Reviewer Agent
- Self-healing workflows
- Multi-agent orchestration

### Production Platform

- Authentication
- Cloud project storage
- GitHub integration
- Docker execution
- Team workspaces
- Real-time collaboration

---

# Running the Project

## Backend

```bash
cd backend

python3 -m venv venv

source venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# Development Philosophy

Forge is built as a production-oriented software engineering platform rather than a prototype. The project emphasizes modularity, scalability, and maintainability so that future AI capabilities—such as streaming LLM reasoning, autonomous code generation, execution engines, and multi-agent orchestration—can be integrated without major architectural changes.

---

# Roadmap

- [x] Requirement Analyzer
- [x] Planner Agent
- [x] Planner API
- [x] Premium Frontend
- [x] Design System
- [x] Cursor-style Planner
- [x] Animated Results
- [x] Project History
- [ ] Command Palette
- [ ] Toast Notifications
- [ ] Settings
- [ ] Code Generator Agent
- [ ] Execution Agent
- [ ] Reviewer Agent
- [ ] LLM Integration
- [ ] GitHub Integration
- [ ] Production Deployment

---

# Current Status

| Component | Status |
|------------|--------|
| FastAPI Backend | ✅ |
| Requirement Analyzer | ✅ |
| Planner Agent | ✅ |
| Planner API | ✅ |
| Premium Frontend | ✅ |
| Design System | ✅ |
| Planner Workspace | ✅ |
| Animated Results | ✅ |
| Project History | ✅ |
| Multi-Agent Pipeline | ✅ |
| Code Generator | 🚧 |
| Execution Agent | 🚧 |
| Reviewer Agent | 🚧 |
| LLM Integration | 🚧 |

---

## Future Vision

Forge is being developed into a fully autonomous AI software engineering platform capable of planning, generating, executing, debugging, reviewing, and deploying complete software projects through collaborative AI agents.