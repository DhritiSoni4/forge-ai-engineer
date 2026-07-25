# Forge AI Engineer Frontend

A premium React frontend for **Forge AI Engineer**, an autonomous multi-agent AI software engineering platform. The frontend provides a modern AI workspace inspired by Cursor, Claude, OpenAI Playground, Vercel, and Linear while communicating with the FastAPI backend.

---

# Features

## Workspace

- Premium landing page
- Cursor-inspired planner workspace
- Auto-resizing prompt editor
- Keyboard shortcut (`Ctrl/Cmd + Enter`)
- Responsive layout
- Sticky navigation
- Workspace sidebar
- Persistent project history (Local Storage)

## Planner

- Requirement submission
- Planner API integration
- Animated loading state
- Interactive implementation roadmap
- Metadata dashboard
- Expandable task cards

## AI Experience

- Multi-agent execution timeline
- AI pipeline visualization
- Animated transitions with Framer Motion
- Premium glassmorphism UI
- Aurora background
- Grid background
- Reusable design system

## Command Palette

- Global `⌘K / Ctrl + K` shortcut
- Extensible command registry
- Searchable command interface
- Dynamic recent project registration
- Keyboard navigation

---

# Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Framer Motion
- Lucide React
- cmdk

---

# Folder Structure

```text
src/
│
├── api/
├── assets/
├── components/
│   ├── command/
│   ├── hero/
│   ├── layout/
│   ├── pipeline/
│   ├── planner/
│   └── ui/
│
├── pages/
├── services/
├── types/
│
├── App.tsx
├── main.tsx
└── index.css
```

---

# Current Architecture

```text
Home
 │
 ├── Navbar
 ├── Hero
 ├── Sidebar
 │
 ├── Planner Workspace
 │     ├── Planner Form
 │     ├── Loading State
 │     ├── Empty State
 │     └── Planner Results
 │            ├── Metadata Cards
 │            └── Task Cards
 │
 ├── Agent Timeline
 │
 ├── Command Palette
 │     ├── Command Provider
 │     └── Command Registry
 │
 └── Footer
```

---

# Development

## Install dependencies

```bash
npm install
```

## Run the development server

```bash
npm run dev
```

## Build for production

```bash
npm run build
```

## Preview the production build

```bash
npm run preview
```

---

# Roadmap

## ✅ Completed

- Premium landing page
- Sticky navigation
- Hero section
- Aurora & grid background effects
- Cursor-inspired planner workspace
- Auto-resizing prompt editor
- Keyboard shortcut (`Ctrl/Cmd + Enter`)
- Planner API integration
- Animated loading state
- Interactive planner results
- Metadata dashboard
- Animated task cards
- Multi-agent pipeline visualization
- Workspace sidebar
- Persistent project history
- Reusable UI component library
- Responsive layout
- Frontend deployment (Vercel)
- Global command palette foundation

## 🚧 In Progress

- Command palette polish
- Toast notification system
- Settings modal
- Mobile navigation drawer
- Global loading overlay
- Error boundary
- Custom 404 page
- Theme polish
- Accessibility improvements
- Animation refinements

## 📍 Planned

- Streaming LLM responses
- Code generation workspace
- Execution dashboard
- Reviewer interface
- Authentication
- GitHub integration
- Team workspaces
- Real-time collaboration

---

# Design Philosophy

The frontend is built as a scalable AI workspace rather than a traditional CRUD application. Components are modular, reusable, and designed to support future capabilities such as streaming AI responses, multi-agent orchestration, DAG visualization, authentication, GitHub integration, and collaborative software engineering workflows without major architectural changes.