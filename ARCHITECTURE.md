# Review Well — System Architecture Specification

## 1. System Overview

**Review Well** is structured as a decoupled client-server architecture with a clear separation of concerns between the frontend presentation layer and the backend service layer. 

* **Monorepo Organization:** Divided into two primary root directories (`/frontend` and `/backend`).
* **Architectural Pattern:** Backend follows a strict **Model-View-Controller (MVC)** separation pattern tailored for API-driven state management, while the frontend employs a modular, component-driven architecture around the reviewer study hub (Source, Flashcards, Blurting, Pomodoro dock).

---

## 2. Repository & Folder Structure

```
review-well/
├── backend/
│   ├── config/         # Environment, database, and OAuth configuration
│   ├── constants/      # Shared limits (e.g. deck quota)
│   ├── controllers/    # MVC Controllers (Auth, Reviewers, ReviewerFiles, AI, Flashcards, Blurting, Pomodoro, Social)
│   ├── models/         # Data access layers (reviewers, files, flashcards, attempts, sessions, quotas, social)
│   ├── prisma/         # Prisma ORM schema and migration files
│   │   └── schema.prisma # Database models and datasource configuration
│   ├── routes/         # API routing endpoints mapping to controllers
│   ├── services/       # Business logic (deck/grade prompts, storage adapter)
│   ├── tests/          # Backend testing suites (Unit, Integration)
│   │   ├── unit/       # Controller, model, and service unit tests
│   │   └── integration/# API route and schema-contract integration tests
│   └── server.js       # Express application entry point
│
└── frontend/
    ├── public/         # Static assets and brand artwork
    ├── src/
    │   ├── components/ # Study hub (StudyTabs, FlashcardDeck, BlurtingMode, PomodoroDock), layout shells, social, common
    │   ├── contexts/   # Global application state (Auth)
    │   ├── stores/     # Client stores (auth)
    │   ├── pages/      # Views (Home, Reviewer hub, Create upload, Profile, guide, legal)
    │   └── utils/      # API error helpers and small utilities
    ├── tests/          # Frontend testing suites (Unit, E2E)
    │   ├── components/ # Component unit tests
    │   ├── pages/      # Page unit tests
    │   └── e2e/        # Playwright browser end-to-end tests
    └── package.json
```

---

## 3. Backend Architecture (MVC Pattern)

The backend is built with Node.js and Express, utilizing **Prisma ORM** connected to a **Supabase PostgreSQL** database for type-safe database queries and seamless migration management (`prisma migrate`).

### 3.1 Models & Database Management (`/backend/prisma/schema.prisma`)
* Prisma schema definitions handling relational mappings for Users, Reviewers, ReviewerFiles (versioned uploads), Flashcards, BlurtingAttempts, PomodoroSessions, Follows, Saves (bookmarks), AI quota usage, and Notifications.
* Enforces data integrity for public/private visibility flags and user ownership.
* Hot reads (reviewer lists/detail, profiles, user search, follower lists, save counts) go through a short-TTL in-memory cache (`backend/utils/cache.js`, 30–60s); mutations bust their namespace (`reviewers:`, `profile:`, `social:`) so writes are never stale.

### 3.2 Views (`/backend/views/` or API Serializers)
* Since the application is a decoupled SPA, "Views" translate directly to structured JSON response payloads serialization objects for the frontend client (e.g., reviewer hub payload with fileUrl/cards/prompts/quota, user profile data).

### 3.3 Controllers (`/backend/controllers/`)
* **Auth Controller:** Manages Google OAuth token verification, session lifecycle management, and first-time profile onboarding completion.
* **Reviewer Controller:** Handles CRUD operations for study guides, upload-only creation with orphan rollback, replace-file versioning, publication visibility (Public, Unlisted, Private), study-hub enrichment (file URL, cards, prompts, quota), and best-effort storage cleanup on delete (file DB rows cascade via Prisma).
* **AI Controller:** Generates flashcard decks + blurting prompts from uploaded files and grades blurting dumps, enforcing the rolling quotas (3 deck generations and 5 AI grades per 7-day window per user; quota consumed on success only).

---

## 4. Frontend Architecture

Built with React and structured for high-performance offline caching and responsive layout handling.

* **Navigation Shell Routing:** Manages responsive viewports, rendering the fixed desktop sidebar or the mobile bottom dock with its elevated center `+ Add` action button.
* **Study Hub Tabs:** The reviewer detail view composes Source (file), Flashcards, and Blurting tabs plus a Pomodoro dock, with guest taste-only restrictions (React-state-only progress, sign-in nudges carrying `returnTo`).

---

## 5. Testing Strategy, Tooling Pipeline & CI/CD Automation

The testing architecture ensures absolute reliability across unit logic, database integration boundaries, and end-to-end user workflows for both backend and frontend environments, fully automated via GitHub Actions.

### 5.1 Backend Testing Suite
* **Unit Testing (`Vitest`):** Isolates individual controllers and business logic services (e.g., AI quota validation and deck/grade parsers) with mocked database dependencies.
* **Integration Testing (`Vitest` + Supertest):** Validates API route handlers, middleware authentication verification, and MVC controller-to-model interactions against mocked models plus a Prisma DMMF schema contract.
* **End-to-End Testing (`Supertest` / API E2E):** Simulates complete server HTTP lifecycles from authentication handshake to guest-gated writes and AI quota exhaustion.

### 5.2 Frontend Testing Suite
* **Unit Testing (`Vitest` + `@testing-library/react`):** Verifies individual study-hub components, tabs, and layout rendering rules in isolation.
* **Integration Testing (`Vitest`):** Tests context state providers (Auth) and multi-step onboarding wizard progression.
* **End-to-End Testing (`Playwright`):** Automates real browser execution to test critical user journeys: Google authentication entry, guest study-hub taste-only flow, uploading a source file for AI deck generation.

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
2. **AI Deck Flow:** User uploads PDF/PPTX on Create or the reviewer hub -> File stored in Supabase Storage (`{userId}/{reviewerId}/vN.ext`) with a `reviewer_files` row -> LLM generates a flashcard deck + blurting prompts -> Backend checks the rolling quota, stores cards/prompts on success only, and returns the deck with remaining quota. Blurting dumps are graded the same way against the 5-grade rolling quota.
