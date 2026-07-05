# Forge AI Engineer 🚀

An autonomous multi-agent AI software engineering platform that can analyze software requirements, generate implementation plans, generate code, execute tasks, and review results through a modular agent architecture.

> **Status:** Phase 1 – Foundation & Requirement Analysis

---

# Current Architecture

```
forge-ai-engineer/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py
│   │   ├── core/
│   │   │   └── config.py
│   │   ├── models/
│   │   ├── schemas/
│   │   │   ├── planner.py
│   │   │   └── project.py
│   │   ├── services/
│   │   │   ├── planner_service.py
│   │   │   └── requirement_analyzer.py
│   │   └── main.py
│   │
│   ├── .env
│   └── venv/
│
├── frontend/
├── docs/
├── README.md
└── .gitignore
```

---

# Implemented Features

## Backend

- ✅ FastAPI application
- ✅ Modular project architecture
- ✅ API routing
- ✅ Service layer
- ✅ Request/Response schemas
- ✅ Interactive Swagger documentation

---

## Planner API

### Endpoint

```
POST /plan
```

### Request

```json
{
  "prompt": "Build a Weather API"
}
```

### Current Response

```json
{
  "project_name": "Build a Weather API",
  "tasks": [
    {
      "id": 1,
      "title": "Analyze user requirements"
    },
    {
      "id": 2,
      "title": "Design project structure"
    },
    {
      "id": 3,
      "title": "Generate implementation plan"
    }
  ]
}
```

The planner currently returns mock tasks while the architecture is being developed.

---

# Requirement Analyzer (Initial Version)

Implemented:

- ✅ ProjectMetadata schema
- ✅ RequirementAnalyzer service
- ✅ Integrated analyzer into PlannerService
- ✅ Initial FastAPI framework detection

Current behavior:

Input:

```
Build a FastAPI weather API
```

Generated metadata:

```json
{
  "project_type": "backend_api",
  "frameworks": [
    "FastAPI"
  ],
  "language": "Python",
  "database": null,
  "deployment": null,
  "features": []
}
```

The metadata is currently generated internally and is not yet exposed through the API.

---

# Current Request Flow

```
Client
   │
   ▼
FastAPI Route
   │
   ▼
Planner Service
   │
   ▼
Requirement Analyzer
   │
   ▼
ProjectMetadata
   │
   ▼
Planner Response
```

---

# Architecture Decisions

## ✅ Service Layer

Business logic lives inside `services/`.

Routes only:

- receive requests
- validate input
- call services
- return responses

---

## ✅ Schemas

Pydantic models define all request and response contracts.

Current schemas:

- PlannerRequest
- PlannerTask
- PlannerResponse
- ProjectMetadata

---

## ✅ Modular Structure

The project is organized into:

- api
- services
- schemas
- core
- models

instead of placing all logic inside `main.py`.

---

# Development Philosophy

This project is being built incrementally using production software engineering practices.

For every feature:

- Build the smallest working version.
- Test it.
- Commit it.
- Update documentation.
- Refactor only when necessary.

The architecture is designed so that deterministic components can later be replaced with LLM-powered implementations without changing downstream services.

---

# Roadmap

## Phase 1 (Current)

- ✅ Project setup
- ✅ FastAPI backend
- ✅ Planner endpoint
- ✅ Planner service
- ✅ Environment variable integration
- ✅ ProjectMetadata schema
- ✅ Requirement Analyzer architecture
- ✅ Initial framework detection

Remaining:

- ⬜ Framework detection expansion
- ⬜ Database detection
- ⬜ Feature extraction
- ⬜ Deployment detection
- ⬜ Project classification
- ⬜ Dynamic planner response

---

## Phase 2

- ⬜ LLM integration
- ⬜ Intelligent task generation
- ⬜ Task DAG generation
- ⬜ Execution engine

---

## Phase 3

- ⬜ Code generation agent
- ⬜ Debugger agent
- ⬜ Reviewer agent
- ⬜ Multi-agent orchestration

---

# Immediate Next Task

Expand the Requirement Analyzer.

Next milestone:

Input:

```
Build a FastAPI weather API with PostgreSQL and JWT authentication.
```

Target metadata:

```json
{
  "project_type": "backend_api",
  "frameworks": [
    "FastAPI"
  ],
  "language": "Python",
  "database": "PostgreSQL",
  "deployment": null,
  "features": [
    "Weather API",
    "JWT Authentication"
  ]
}
```

The planner will eventually consume only `ProjectMetadata`, making it independent of how the metadata is produced (rule-based parser, OpenAI, Claude, Gemini, etc.).