# Forge AI Engineer 🚀

An autonomous multi-agent AI software engineering platform that can analyze software requirements, generate implementation plans, write code, execute tasks, and review results through a modular agent architecture.

> Status: In Development

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
│   │   │   └── planner.py
│   │   ├── services/
│   │   │   └── planner_service.py
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

- FastAPI application
- Modular project architecture
- API routing
- Service layer
- Request/Response schemas
- Interactive Swagger documentation

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

# Current Flow

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

Pydantic models define every request and response.

Current schemas:

- PlannerRequest
- PlannerTask
- PlannerResponse

---

## ✅ Modular Structure

The project is organized into:

- api
- services
- schemas
- core
- models

instead of placing everything inside `main.py`.

---

# Roadmap

## Phase 1 (Current)

- [x] Project setup
- [x] FastAPI backend
- [x] Planner endpoint
- [x] Planner service
- [x] Dynamic planner response
- [ ] Environment variable integration
- [ ] Requirement Analyzer
- [ ] Project Classifier

---

## Phase 2

- [ ] LLM integration
- [ ] Intelligent task generation
- [ ] Task DAG generation
- [ ] Execution engine

---

## Phase 3

- [ ] Code generation agent
- [ ] Debugger agent
- [ ] Reviewer agent
- [ ] Multi-agent orchestration

---

# Next Immediate Task

Implement a Requirement Analyzer.

The Requirement Analyzer will convert natural language software requests into structured project metadata that the Planner can consume.

Example:

Input

```
Build a FastAPI weather API with PostgreSQL and JWT authentication.
```

Target Output

```json
{
  "project_type": "backend_api",
  "framework": "FastAPI",
  "database": "PostgreSQL",
  "features": [
    "JWT Authentication",
    "Weather API"
  ]
}
```

This component will be implemented before integrating any LLM so that the architecture is driven by well-defined data contracts rather than model output.