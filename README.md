# Forge AI Engineer 🚀

An autonomous multi-agent AI software engineering platform that can analyze software requirements, generate implementation plans, generate code, execute tasks, and review results through a modular agent architecture.

> **Status:** Phase 1 – Foundation & Requirement Analysis

---

# Current Architecture

```text
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
│   ├── tests/
│   │   └── test_requirement_analyzer.py
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

* ✅ FastAPI application
* ✅ Modular project architecture
* ✅ API routing
* ✅ Service layer
* ✅ Request/Response schemas
* ✅ Interactive Swagger documentation

---

## Planner API

### Endpoint

```text
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

The Planner currently returns mock tasks while the underlying planning architecture is being developed.

---

# Requirement Analyzer

The Requirement Analyzer converts natural language software requests into a structured `ProjectMetadata` object that downstream services can consume.

## Current Capabilities

### Framework Detection

Supported frameworks:

* ✅ FastAPI
* ✅ Django

### Database Detection

Supported databases:

* ✅ PostgreSQL
* ✅ MySQL
* ✅ MongoDB
* ✅ SQLite

### Project Type Inference

Current project types:

* ✅ backend_api
* ✅ unknown (fallback)

### Internal Metadata Example

Input:

```text
Build a FastAPI weather API with PostgreSQL
```

Generated metadata:

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

The metadata is currently consumed internally by the Planner and is **not exposed through the API**.

---

# Current Request Flow

```text
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

# Testing

Testing framework:

* ✅ Pytest

Current unit tests:

* ✅ FastAPI framework detection
* ✅ PostgreSQL database detection

Run all tests:

```bash
python3 -m pytest
```

Current status:

```text
=============================
2 passed
=============================
```

---

# Architecture Decisions

## ✅ Service Layer

Business logic lives inside `services/`.

Routes are responsible only for:

* receiving requests
* validation
* calling services
* returning responses

---

## ✅ Schemas

Pydantic models define every request and response contract.

Current schemas:

* PlannerRequest
* PlannerTask
* PlannerResponse
* ProjectMetadata

---

## ✅ Requirement Analyzer

The analyzer is intentionally rule-based during Phase 1.

Its responsibility is to produce a standardized `ProjectMetadata` object.

Future versions may use LLMs internally without requiring changes to downstream components.

---

## ✅ Modular Design

The project separates responsibilities into:

* api
* services
* schemas
* models
* core

instead of placing all application logic inside `main.py`.

---

# Development Philosophy

This project is being developed incrementally using production software engineering practices.

For every feature:

1. Implement the smallest working version.
2. Write or update tests.
3. Verify functionality.
4. Commit with a meaningful message.
5. Update documentation.

This keeps the project stable while continuously improving functionality.

---

# Current Sprint Progress

## Completed

* ✅ Project setup
* ✅ FastAPI backend
* ✅ Planner endpoint
* ✅ Planner service
* ✅ Environment variable integration
* ✅ ProjectMetadata schema
* ✅ Requirement Analyzer architecture
* ✅ Planner integration
* ✅ FastAPI framework detection
* ✅ Django framework detection
* ✅ Framework keyword mapping
* ✅ PostgreSQL detection
* ✅ MySQL detection
* ✅ MongoDB detection
* ✅ SQLite detection
* ✅ Backend project type inference
* ✅ Initial unit testing infrastructure

---

## Remaining

* ⬜ Frontend framework detection
* ⬜ Full-stack project inference
* ⬜ Authentication detection
* ⬜ Deployment detection
* ⬜ Feature extraction
* ⬜ Language inference improvements
* ⬜ Dynamic planner response

---

# Roadmap

## Phase 1 — Requirement Analysis

Completed:

* ✅ Project foundation
* ✅ Planner API
* ✅ Requirement Analyzer
* ✅ Framework detection
* ✅ Database detection
* ✅ Unit testing

Remaining:

* ⬜ Frontend detection
* ⬜ Authentication detection
* ⬜ Deployment detection
* ⬜ Feature extraction
* ⬜ Dynamic Planner

---

## Phase 2 — Intelligent Planning

* ⬜ LLM integration
* ⬜ Intelligent task generation
* ⬜ Task DAG generation
* ⬜ Execution planning
* ⬜ Agent orchestration

---

## Phase 3 — Autonomous Engineering

* ⬜ Code Generation Agent
* ⬜ Debugger Agent
* ⬜ Reviewer Agent
* ⬜ Multi-Agent Execution
* ⬜ End-to-end autonomous software engineering workflow

---

# Current Commit History

Recent milestones:

* `feat: add initial requirement analyzer architecture`
* `refactor: use keyword mapping for framework detection`
* `test: add initial requirement analyzer unit tests`
* `feat: add database detection to requirement analyzer`

---

# Immediate Next Task

Extend the Requirement Analyzer to recognize frontend technologies.

Target example:

Input:

```text
Build a React dashboard with FastAPI and PostgreSQL.
```

Desired metadata:

```json
{
  "project_type": "fullstack",
  "frameworks": [
    "FastAPI",
    "React"
  ],
  "language": "Python",
  "database": "PostgreSQL",
  "deployment": null,
  "features": []
}
```

This will introduce frontend detection and enable accurate inference of **frontend**, **backend**, and fullstack projects.
