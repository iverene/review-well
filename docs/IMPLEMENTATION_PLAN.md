# Review Well — Implementation Plan

**Created:** 2026-09-01
**Status:** Ready for execution
**Approach:** Phased delivery with testable interfaces at every stage

---

## Guiding Principles

1. **Schema-first:** Fix Prisma schema to match SCHEMA.md before building features
2. **Testable interfaces:** Every external service (Supabase, Google Auth, OpenRouter) gets a mock-able adapter so tests run without live credentials
3. **TDD at each phase:** Write tests before or alongside implementation
4. **Incremental delivery:** Each phase produces a working, testable slice

---

## Phase 0: Foundation Fix (Days 1-2)

**Goal:** Align the codebase with documentation, establish testing infrastructure

### 0.1 Fix Prisma Schema
- Update `schema.prisma` to match SCHEMA.md exactly
- Add missing models: `ai_quotas`, `likes`, `follows`, `notifications`
- Add missing fields: `school`, `program`, `major`, `year_level` on User
- Add missing fields: `course_code`, `course_description`, `semester`, `exam_type`, `color_palette`, `visibility`, `allow_remix`, `is_draft` on Reviewer
- Restructure Block model to match `reviewer_blocks` (content_data JSONB, column_index, sort_order)
- Rename `ReviewerRemix` → `reviewer_lineage`
- Remove `ReviewerAnalytics` and `ReviewSession` (not in SCHEMA.md)
- Generate migration

**Files:**
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/`

### 0.2 Testing Infrastructure
- Configure Vitest for backend (`backend/vitest.config.js`)
- Configure Vitest for frontend (`frontend/vitest.config.js`)
- Install Playwright (`frontend/playwright.config.js`)
- Create test utilities: `backend/tests/helpers/`, `frontend/src/test-utils/`
- Create mock factories for all external services

**Dependencies to install:**
- `@playwright/test` (frontend)
- `@testing-library/react`, `@testing-library/jest-dom` (frontend)
- `msw` (Mock Service Worker for API mocking)

**Files:**
- `backend/vitest.config.js`
- `backend/tests/helpers/`
- `frontend/vitest.config.js`
- `frontend/playwright.config.js`
- `frontend/src/test-utils/`

### 0.3 Service Adapters (Testable Interfaces)
Create adapter pattern for all external services:

```js
// backend/services/adapters/
//   supabase.js    — DB operations via Prisma (mockable)
//   googleAuth.js  — Google OAuth verification (mockable)
//   openrouter.js  — AI completion (mockable)
//   storage.js     — File upload to Supabase Storage (mockable)
```

Each adapter exports:
- A real implementation using the actual SDK
- A mock factory for testing

**Files:**
- `backend/services/adapters/supabase.js`
- `backend/services/adapters/googleAuth.js`
- `backend/services/adapters/openrouter.js`
- `backend/services/adapters/storage.js`

### 0.4 Environment Configuration
- Create `.env` from `.env.example` with all required variables
- Add validation (zod schema for env vars)
- Document all required/optional variables

**Tests for Phase 0:**
- `backend/tests/schema.test.js` — Schema validates, all models exist
- `backend/tests/adapters/mock.test.js` — All adapters can be mocked
- `frontend/tests/setup.test.js` — Test infrastructure works

---

## Phase 1: Authentication (Days 3-5)

**Goal:** Full Google OAuth flow with session management

### 1.1 Backend Auth
- Wire Passport.js into `server.js`
- Implement `googleService.js` — verify Google ID token
- Implement `authController.js` — googleAuth, logout, getMe
- Implement `auth.js` middleware — requireAuth (session check), optionalAuth (attach user)
- Add session serialization/deserialization

**Files:**
- `backend/server.js` (modify)
- `backend/services/googleService.js`
- `backend/controllers/authController.js`
- `backend/middleware/auth.js`

### 1.2 Frontend Auth
- Create `AuthContext` provider
- Implement Google OAuth popup flow
- Create login/logout UI components
- Implement protected route wrapper
- Create user avatar dropdown

**Files:**
- `frontend/src/contexts/AuthContext.jsx`
- `frontend/src/hooks/useAuth.js`
- `frontend/src/components/auth/LoginButton.jsx`
- `frontend/src/components/auth/AvatarDropdown.jsx`
- `frontend/src/components/auth/ProtectedRoute.jsx`

### 1.3 Auth Tests
- Unit: `authController.test.js` — mock Google service, test session creation
- Unit: `auth middleware.test.js` — test requireAuth/optionalAuth
- Integration: `authRoutes.test.js` — full flow with Supertest
- E2E: `auth.spec.js` — Playwright test for login/logout flow

**Test files:**
- `backend/tests/unit/controllers/authController.test.js`
- `backend/tests/unit/middleware/auth.test.js`
- `backend/tests/integration/auth.test.js`
- `frontend/tests/e2e/auth.spec.js`

---

## Phase 2: Reviewer CRUD (Days 6-9)

**Goal:** Create, read, update, delete reviewers with block management

### 2.1 Backend Reviewer CRUD
- Implement `reviewerController.js` — all 6 endpoints
- Implement `reviewerModel.js` — Prisma queries
- Implement `blockModel.js` — block CRUD with ordering
- Implement validation middleware (zod schemas)
- Add pagination for public reviewers

**Files:**
- `backend/controllers/reviewerController.js`
- `backend/models/reviewerModel.js`
- `backend/models/blockModel.js`
- `backend/middleware/validate.js`
- `backend/validators/reviewer.js` (new)

### 2.2 Backend Remix/Clone
- Implement `remixController.js` — clone reviewer with blocks
- Implement lineage tracking (reviewer_lineage table)
- Implement attribution display

**Files:**
- `backend/controllers/remixController.js`
- `backend/models/remixModel.js` (new)

### 2.3 Reviewer Tests
- Unit: `reviewerModel.test.js` — test all Prisma queries with mocks
- Unit: `reviewerController.test.js` — test business logic
- Integration: `reviewerRoutes.test.js` — full CRUD flow
- Integration: `remixRoutes.test.js` — clone flow
- E2E: `reviewer.spec.js` — create, edit, clone in browser

**Test files:**
- `backend/tests/unit/models/reviewerModel.test.js`
- `backend/tests/unit/controllers/reviewerController.test.js`
- `backend/tests/integration/reviewer.test.js`
- `backend/tests/integration/remix.test.js`
- `frontend/tests/e2e/reviewer.spec.js`

---

## Phase 3: Block Editor (Days 10-14)

**Goal:** Google Docs-inspired workspace editor with block types

### 3.1 Frontend Layout & Navigation
- Create `NavigationShell` — desktop sidebar (240px) + mobile bottom dock
- Create `HeaderBar` — breadcrumbs, notification badge, avatar
- Create `Sidebar` — reviewer list, search, filters
- Create `BottomDock` — mobile navigation with elevated + Add button

**Files:**
- `frontend/src/components/layout/NavigationShell.jsx`
- `frontend/src/components/layout/HeaderBar.jsx`
- `frontend/src/components/layout/Sidebar.jsx`
- `frontend/src/components/layout/BottomDock.jsx`

### 3.2 Workspace Editor
- Create `Workspace` page — A4 canvas with 2-column grid
- Create `Toolbar` — File/Edit/View/Insert/Format menus
- Create `FormattingToolbar` — bold, italic, underline, etc.
- Create `BlockRenderer` — dispatches to correct block component

**Files:**
- `frontend/src/pages/Workspace.jsx`
- `frontend/src/components/workspace/Toolbar.jsx`
- `frontend/src/components/workspace/FormattingToolbar.jsx`
- `frontend/src/components/workspace/BlockRenderer.jsx`
- `frontend/src/components/workspace/A4Canvas.jsx`

### 3.3 Block Components
- `MainTitleBlock` — reviewer title
- `TopicHeaderBanner` — section headers
- `SubTopicBanner` — sub-section headers
- `ContentBlock` — rich text content
- `TableBlock` — data tables

**Files:**
- `frontend/src/components/blocks/MainTitleBlock.jsx`
- `frontend/src/components/blocks/TopicHeaderBanner.jsx`
- `frontend/src/components/blocks/SubTopicBanner.jsx`
- `frontend/src/components/blocks/ContentBlock.jsx`
- `frontend/src/components/blocks/TableBlock.jsx`

### 3.4 Editor Tests
- Unit: Each block component renders correctly
- Unit: Toolbar actions trigger correct state changes
- Unit: Block reordering works
- Integration: Full editor flow with state management
- E2E: Create reviewer, add blocks, reorder, save

**Test files:**
- `frontend/tests/components/blocks/*.test.jsx`
- `frontend/tests/components/workspace/*.test.jsx`
- `frontend/tests/e2e/workspace.spec.js`

---

## Phase 4: AI Extraction (Days 15-18)

**Goal:** Upload documents, extract study blocks with AI

### 4.1 File Upload
- Install `multer` for file upload handling
- Implement file upload middleware
- Implement Supabase Storage adapter
- Add file validation (PDF, PPTX, max size)

**Files:**
- `backend/middleware/upload.js`
- `backend/services/adapters/storage.js`

### 4.2 AI Extraction Pipeline
- Implement `openaiService.js` — OpenRouter API calls
- Implement `promptService.js` — extraction prompts
- Implement `aiController.js` — extractFromUpload
- Implement `AiExtractionJob` tracking
- Add AI quota management (ai_quotas table)

**Files:**
- `backend/services/openaiService.js`
- `backend/services/promptService.js`
- `backend/controllers/aiController.js`
- `backend/models/aiQuotaModel.js` (new)

### 4.3 AI Tests
- Unit: `openaiService.test.js` — mock OpenRouter, test prompt construction
- Unit: `promptService.test.js` — test prompt templates
- Unit: `aiController.test.js` — test extraction flow
- Integration: `aiRoutes.test.js` — upload + extraction flow
- E2E: `ai-extraction.spec.js` — upload PDF, see blocks created

**Test files:**
- `backend/tests/unit/services/openaiService.test.js`
- `backend/tests/unit/services/promptService.test.js`
- `backend/tests/unit/controllers/aiController.test.js`
- `backend/tests/integration/ai.test.js`
- `frontend/tests/e2e/ai-extraction.spec.js`

---

## Phase 5: Social Features (Days 19-22)

**Goal:** Likes, follows, notifications

### 5.1 Backend Social
- Implement likes endpoints (add/remove)
- Implement follows endpoints (follow/unfollow)
- Implement notifications endpoints (list, mark read)
- Add notification creation on like/follow/clone events

**Files:**
- `backend/controllers/socialController.js` (new)
- `backend/models/likeModel.js` (new)
- `backend/models/followModel.js` (new)
- `backend/models/notificationModel.js` (new)
- `backend/routes/socialRoutes.js` (new)

### 5.2 Frontend Social
- Create `LikeButton` component
- Create `FollowButton` component
- Create `NotificationList` page
- Create `NotificationBadge` component
- Add notification polling/websocket

**Files:**
- `frontend/src/components/social/LikeButton.jsx`
- `frontend/src/components/social/FollowButton.jsx`
- `frontend/src/pages/Notifications.jsx`
- `frontend/src/components/notifications/NotificationBadge.jsx`
- `frontend/src/components/notifications/NotificationItem.jsx`

### 5.3 Social Tests
- Unit: `socialController.test.js` — test like/follow logic
- Unit: `notificationModel.test.js` — test creation/read
- Integration: `socialRoutes.test.js` — full social flow
- E2E: `social.spec.js` — like, follow, see notification

**Test files:**
- `backend/tests/unit/controllers/socialController.test.js`
- `backend/tests/integration/social.test.js`
- `frontend/tests/e2e/social.spec.js`

---

## Phase 6: Email & Notifications (Days 23-25)

**Goal:** Deferred email integrations

Email delivery is intentionally out of scope. Authentication is handled exclusively by Google OAuth.

---

## Phase 7: Profile & User Features (Days 26-28)

**Goal:** User profiles, settings, preferences

### 7.1 Backend Profile
- Implement profile update endpoint
- Implement avatar upload
- Add academic fields (school, program, major, year_level)

**Files:**
- `backend/controllers/profileController.js` (new)
- `backend/models/userModel.js` (modify)
- `backend/routes/profileRoutes.js` (new)

### 7.2 Frontend Profile
- Create `Profile` page — user info, statistics
- Create `Settings` page — account settings
- Create `EditProfile` form
- Create `UserProfile` component (public view)

**Files:**
- `frontend/src/pages/Profile.jsx`
- `frontend/src/pages/Settings.jsx`
- `frontend/src/components/profile/EditProfile.jsx`
- `frontend/src/components/profile/UserProfile.jsx`

### 7.3 Profile Tests
- Unit: `profileController.test.js`
- Integration: `profileRoutes.test.js`
- E2E: `profile.spec.js`

---

## Phase 8: Polish & Production (Days 29-31)

**Goal:** Performance, accessibility, deployment

### 8.1 Performance
- Add React.lazy for route-based code splitting
- Implement image optimization
- Add service worker for offline support
- Optimize bundle size

### 8.2 Accessibility
- Audit all components for WCAG 2.1 AA
- Add keyboard navigation
- Add screen reader support
- Add focus management

### 8.3 Production Setup
- Configure production environment
- Set up Supabase production project
- Set up OpenRouter API keys
- Configure Google OAuth production

### 8.4 Final Tests
- Full E2E test suite
- Performance benchmarks
- Accessibility audit

---

## Test Strategy Summary

### Unit Tests (Backend)
```
backend/tests/
  unit/
    controllers/
      authController.test.js
      reviewerController.test.js
      remixController.test.js
      aiController.test.js
      socialController.test.js
      profileController.test.js
    models/
      userModel.test.js
      reviewerModel.test.js
      blockModel.test.js
      likeModel.test.js
      followModel.test.js
      notificationModel.test.js
    middleware/
      auth.test.js
      rateLimiter.test.js
      validate.test.js
    services/
      googleService.test.js
      openaiService.test.js
      promptService.test.js
```

### Unit Tests (Frontend)
```
frontend/tests/
  components/
    auth/
      LoginButton.test.jsx
      AvatarDropdown.test.jsx
    blocks/
      MainTitleBlock.test.jsx
      TopicHeaderBanner.test.jsx
      ContentBlock.test.jsx
    workspace/
      Toolbar.test.jsx
      BlockRenderer.test.jsx
    social/
      LikeButton.test.jsx
      FollowButton.test.jsx
  hooks/
    useAuth.test.js
  stores/
    authStore.test.js
```

### Integration Tests (Backend)
```
backend/tests/
  integration/
    auth.test.js
    reviewer.test.js
    remix.test.js
    ai.test.js
    social.test.js
    email.test.js
    profile.test.js
```

### E2E Tests (Playwright)
```
frontend/tests/
  e2e/
    auth.spec.js
    reviewer.spec.js
    workspace.spec.js
    ai-extraction.spec.js
    social.spec.js
    profile.spec.js
```

---

## External Service Mocking Strategy

### Mock Factories
Each external service gets a mock factory:

```js
// backend/tests/helpers/mocks.js
export const mockSupabase = () => ({
  user: { findUnique: jest.fn(), create: jest.fn() },
  reviewer: { findMany: jest.fn(), create: jest.fn() },
  // ...
})

export const mockGoogleAuth = () => ({
  verifyIdToken: jest.fn().mockResolvedValue({ sub: '123', email: 'test@test.com' }),
})

export const mockOpenRouter = () => ({
  chat: { completions: { create: jest.fn() } },
})
```

### Test Environment Variables
```env
# backend/.env.test
DATABASE_URL=postgresql://test:test@localhost:5432/reviewwell_test
GOOGLE_CLIENT_ID=test-google-client-id
GOOGLE_CLIENT_SECRET=test-google-client-secret
OPENROUTER_API_KEY=sk-or-test-openrouter-key
SESSION_SECRET=test-session-secret
FRONTEND_URL=http://localhost:5173
```

---

## Execution Order

1. **Phase 0** → Schema fix + testing infrastructure (no features, just foundation)
2. **Phase 1** → Auth (required for everything else)
3. **Phase 2** → Reviewer CRUD (core functionality)
4. **Phase 3** → Block Editor (main UI)
5. **Phase 4** → AI Extraction (differentiator)
6. **Phase 5** → Social Features (engagement)
7. **Phase 6** → Email (communication)
8. **Phase 7** → Profile (user management)
9. **Phase 8** → Polish (production ready)

Each phase produces:
- Working code
- Unit tests
- Integration tests
- E2E tests (where applicable)
- Updated documentation
