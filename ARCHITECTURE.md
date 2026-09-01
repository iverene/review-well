# Review Well — System Architecture Specification

## 1. System Overview

**Review Well** is structured as a decoupled client-server architecture with a clear separation of concerns between the frontend presentation layer and the backend service layer. 

* **Monorepo Organization:** Divided into two primary root directories (`/frontend` and `/backend`).
* **Architectural Pattern:** Backend follows a strict **Model-View-Controller (MVC)** separation pattern tailored for API-driven state management, while the frontend employs a modular, component-driven architecture mimicking professional layout editors.

---

## 2. Repository & Folder Structure

```
review-well/
├── backend/
│   ├── config/         # Environment, database, and OAuth configuration
│   ├── controllers/    # MVC Controllers (Auth, Reviewers, AI, Users)
│   ├── models/         # Data access layers and database schemas
│   ├── prisma/         # Prisma ORM schema and migration files
│   │   └── schema.prisma # Database models and datasource configuration
│   ├── routes/         # API routing endpoints mapping to controllers
│   ├── services/       # Business logic (AI extraction, PDF generation pipeline)
│   ├── tests/          # Backend testing suites (Unit, Integration, E2E)
│   │   ├── unit/       # Controller and service unit tests
│   │   ├── integration/# API route and database integration tests
│   │   └── e2e/        # Supertest end-to-end server workflow tests
│   └── server.js       # Express application entry point
│
└── frontend/
    ├── public/         # Static assets and watermarking templates
    ├── src/
    │   ├── components/ # Modular workspace blocks, toolbars, and navigation shells
    │   ├── context/    # Global application state (Auth, Workspace, Theme)
    │   ├── layouts/    # Responsive shell layouts (Desktop Sidebar vs Mobile Dock)
    │   ├── pages/      # View views (Home, My Reviewers, Profile, Workspace)
    │   └── services/   # API client integration (Axios/Fetch wrappers)
    ├── tests/          # Frontend testing suites (Unit, Integration, E2E)
    │   ├── unit/       # Component and utility unit tests
    │   ├── integration/# Context and state workflow tests
    │   └── e2e/        # Playwright browser end-to-end tests
    └── package.json
```

---

## 3. Backend Architecture (MVC Pattern)

The backend is built with Node.js and Express, utilizing **Prisma ORM** connected to a **Supabase PostgreSQL** database for type-safe database queries and seamless migration management (`prisma migrate`).

### 3.1 Models & Database Management (`/backend/prisma/schema.prisma`)
* Prisma schema definitions handling relational mappings for Users, Reviewers, Modular Blocks, Follows, Likes, AI Token Usage quotas, and Notifications.
* Enforces data integrity for public/private visibility flags and email verification states.

### 3.2 Views (`/backend/views/` or API Serializers)
* Since the application is a decoupled SPA, "Views" translate directly to structured JSON response payloads serialization objects for the frontend client (e.g., reviewer payload, block arrays, user profile data).

### 3.3 Controllers (`/backend/controllers/`)
* **Auth Controller:** Manages Google OAuth token verification, session lifecycle management, and first-time profile onboarding completion.
* **Reviewer Controller:** Handles CRUD operations for study guides, auto-saving draft states, handling version history, and managing publication visibility (Public, Unlisted, Private).
* **AI Extraction Controller:** Interacts with external LLM endpoints to parse uploaded PDF/PPTX lecture files, extracting terms and definitions into structured JSON blocks while verifying the user's weekly rolling quota (max 3/week).

---

## 4. Frontend Architecture

Built with React and structured for high-performance offline caching and responsive layout handling.

* **Navigation Shell Routing:** Manages responsive viewports, rendering the fixed desktop sidebar or the mobile bottom dock with its elevated center `+ Add` action button.
* **Document Engine State:** Manages the Google Docs-inspired ergonomic toolbar controls (*File, Edit, View, Insert, Format*) and state synchronization with the auto-save backend.
* **Modular Block Renderer:** Dynamically renders the strict two-column A4 grid layout using pre-styled academic components (*Main Title Block*, *Topic Header Banners*, *Sub-Topic Banners*, and *Content Blocks*).

---

## 5. Testing Strategy, Tooling Pipeline & CI/CD Automation

The testing architecture ensures absolute reliability across unit logic, database integration boundaries, and end-to-end user workflows for both backend and frontend environments, fully automated via GitHub Actions.

### 5.1 Backend Testing Suite
* **Unit Testing (`Vitest`):** Isolates individual controllers and business logic services (e.g., AI quota validation and PDF formatting parsers) with mocked database dependencies.
* **Integration Testing (`Vitest` + Supertest):** Validates API route handlers, middleware authentication verification, and MVC controller-to-model interactions against a test PostgreSQL instance.
* **End-to-End Testing (`Supertest` / API E2E):** Simulates complete server HTTP lifecycles from authentication handshake to document cloning and AI quota exhaustion.

### 5.2 Frontend Testing Suite
* **Unit Testing (`Vitest` + `@testing-library/react`):** Verifies individual workspace components, toolbars, and layout rendering rules in isolation.
* **Integration Testing (`Vitest`):** Tests context state providers (Auth, Workspace sync state) and multi-step onboarding wizard progression.
* **End-to-End Testing (`Playwright`):** Automates real browser execution to test critical user journeys: Google authentication entry, drafting a two-column reviewer, uploading PDF slides for AI extraction.

### 5.3 CI/CD Automation (`GitHub Actions`)
* **Automated Workflow Triggers:** GitHub Actions workflows (`.github/workflows/test.yml`) are configured to execute automatically on every pull request and push to the main branch.
* **Pipeline Execution Steps:** 
  1. Spins up a temporary containerized PostgreSQL test database service.
  2. Installs dependencies and runs backend and frontend unit/integration test suites via `Vitest`.
  3. Executes headless browser end-to-end test suites via `Playwright`.
  4. Blocks deployment merges if any test suite fails or test coverage thresholds fall below required standards.

---

## 6. Data Flow & Security Integrations

1. **Authentication Flow:** Client initiates Google Sign-In -> Google OAuth returns token -> Backend verifies token, checks if user profile exists -> If new, prompts 3-step onboarding wizard; if returning, issues secure HttpOnly session cookie.
2. **AI Extraction Flow:** User uploads PDF/PPTX in workspace -> File sent to backend service -> Sanitized and parsed -> LLM extracts structured term-definition pairs -> Backend checks token quota -> Returns JSON block array to frontend workspace editor.
