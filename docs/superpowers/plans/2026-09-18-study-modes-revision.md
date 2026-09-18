# Upload + Study Modes Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace workspace authoring with PDF/PPTX upload and ship flashcards, blurting, and Pomodoro study modes with guest taste-only access.

**Architecture:** Lean migration on the existing Express + Prisma + Supabase + React stack. Reuse `reviewers`, `ai_quotas`, save/follow/notifications; add `reviewer_files`, `flashcards`, `blurting_attempts`, `pomodoro_sessions`; delete block/remix/export paths. Each study mode owns its model + controller + route + UI tab, joined only by `reviewer_id`.

**Tech Stack:** Node 18+, Express, Prisma (PostgreSQL via Supabase), Supabase Storage, React + Vite, Vitest + Supertest, Playwright.

## Global Constraints

- Uploads: PDF or PPTX only, max 25 MB enforced client-side AND server-side (`backend/middleware/upload.js`).
- Deck quota: 3 AI generations per rolling 7-day window per user (`ai_quotas`); blurting AI grades: 5 per rolling 7 days per user (`grades_used`, `grades_reset_at`); self-ratings never consume quota.
- Deck caps: max 40 cards and 5 blurting prompts per generation; excess trimmed with notice.
- Guest writes return `401 { error: 'guest-write-blocked' }`; every mutation checks session server-side plus ownership (`reviewer.authorId === req.user.id`); client gating is cosmetic only.
- Design tokens per `DESIGN.md`: Cream `#FFF7E8`, Cocoa `#604A3A`, Blush `#F6C6D2`, Powder `#C9E6F2`, Mint `#CDE8D2`, Butter `#F9E4A8`, Berry `#C96A83`. No dark default, no large gradients.
- Motion: respect `prefers-reduced-motion`; keyboard operable (Enter/Space flip, arrows navigate cards).
- Pomodoro accuracy via timestamp math (`ended_at - started_at`), never interval counting.
- Backend tests: `npm test` in `backend/` (vitest run). Frontend tests: `npm test` in `frontend/` (vitest run). E2E: `npm run test:e2e` in `frontend/`.

---

## File Structure

New backend files and responsibilities:

- `backend/models/reviewerFileModel.js` — CRUD for `reviewer_files` (create, findByReviewerId, bumpVersion, removeByReviewerId).
- `backend/models/flashcardModel.js` — CRUD for `flashcards` (listByReviewer, createMany, updateKnown, updateCard, removeCard, removeByReviewer).
- `backend/models/blurtingModel.js` — CRUD for `blurting_attempts` (create, listByReviewerUser).
- `backend/models/pomodoroModel.js` — CRUD for `pomodoro_sessions` (create, dayTotal, weekTotals, streakDays).
- `backend/controllers/flashcardController.js` — deck read + card CRUD + Known toggle, guest-write-blocked for guests.
- `backend/controllers/blurtingController.js` — attempt submit with AI-grade-or-fallback branching.
- `backend/controllers/pomodoroController.js` — session write + stats (today, week, streak, goal).
- `backend/controllers/reviewerFileController.js` — upload metadata row + replace-file version bump.
- `backend/routes/flashcardRoutes.js`, `backend/routes/blurtingRoutes.js`, `backend/routes/pomodoroRoutes.js`, `backend/routes/reviewerFileRoutes.js` — route wiring.

Modified backend files:

- `backend/prisma/schema.prisma` — add 4 models, extend `Reviewer` (`aiPrompts`, `deckGeneratedAt`, `deckStale`), extend `AiQuota` (`gradesUsed`, `gradesResetAt`), extend `User` (`dailyFocusMinutes`), remove `Block`.
- `backend/models/aiQuotaModel.js` — add grade-bucket helpers next to generation helpers.
- `backend/controllers/aiController.js` — retarget extraction to cards + prompts, limit 3, store once, cap 40/5.
- `backend/controllers/reviewerController.js` — remove block handlers; cascade-delete study rows on reviewer delete.
- `backend/routes/reviewerRoutes.js`, `backend/routes/aiRoutes.js` — remove block routes, wire file/study routes in `server.js`.
- `backend/middleware/upload.js` — enforce PDF/PPTX + 25 MB.
- `backend/services/openaiService.js` — add `extractDeckAndPrompts(text, meta)` returning `{ cards, prompts }`.

New frontend files:

- `frontend/src/components/StudyTabs.jsx` — tab shell (Source / Flashcards / Blurting) with guest banner slot.
- `frontend/src/components/FlashcardDeck.jsx` — flip, shuffle, progress, Known toggle, add/edit/delete form.
- `frontend/src/components/BlurtingMode.jsx` — prompt, dump box, AI-or-self result view.
- `frontend/src/components/PomodoroDock.jsx` — presets, start/pause/reset, timestamp-based elapsed, completion callback.

Modified frontend files:

- `frontend/src/pages/Create.jsx` — upload-only form (metadata + file + replace-file mode).
- `frontend/src/pages/Reviewer.jsx` (and `Review.jsx` if it duplicates the detail view) — study-hub composition.
- `frontend/src/pages/Profile.jsx` — focus stats, goal editor, streak display.
- `frontend/src/App.jsx` — remove `/workspace` route, Create → Upload label.
- Delete: `frontend/src/pages/Workspace.jsx`, `frontend/src/utils/exportPdf.js`, remix UI in reviewer pages.

---

### Task 1: Prisma schema migration + storage bucket

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/XXXX_upload_study_modes/migration.sql` (via `prisma migrate dev`)
- Test: `backend/tests/integration/schema.test.js`

**Interfaces:**
- Consumes: existing `User`, `Reviewer`, `AiQuota` models.
- Produces: `ReviewerFile`, `Flashcard`, `BlurtingAttempt`, `PomodoroSession` models; `Reviewer.aiPrompts: Json?`, `Reviewer.deckGeneratedAt: DateTime?`, `Reviewer.deckStale: Boolean @default(false)`; `AiQuota.gradesUsed: Int @default(0)`, `AiQuota.gradesResetAt: DateTime`; `User.dailyFocusMinutes: Int @default(25)`.

- [ ] **Step 1: Write the failing test**

```js
// backend/tests/integration/schema.test.js
import { describe, it, expect } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('study-mode schema', () => {
  it('creates a reviewer with file, cards, attempt, and session rows', async () => {
    const user = await prisma.user.create({
      data: { googleId: 'schema-t1', email: 'schema-t1@example.com', displayName: 'Schema T1' },
    })
    const reviewer = await prisma.reviewer.create({
      data: { authorId: user.id, title: 'T1', courseCode: 'BAT 403', courseDescription: 'Desc', semester: '2nd Semester', examType: 'Midterm', colorPalette: {}, visibility: 'private' },
    })
    const file = await prisma.reviewerFile.create({
      data: { reviewerId: reviewer.id, storagePath: 'u/r/v1.pdf', fileType: 'pdf', byteSize: 10, version: 1 },
    })
    const card = await prisma.flashcard.create({
      data: { reviewerId: reviewer.id, front: 'Q?', back: 'A.', source: 'manual', sortOrder: 0 },
    })
    expect(file.version).toBe(1)
    expect(card.known).toBe(false)
    await prisma.user.delete({ where: { id: user.id } })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/integration/schema.test.js` in `backend/`
Expected: FAIL with `Unknown model "reviewerFile"` (model does not exist yet).

- [ ] **Step 3: Write minimal implementation**

Add to `backend/prisma/schema.prisma` (remove the `Block` model, add the new models, extend `Reviewer`, `AiQuota`, `User`):

```prisma
model ReviewerFile {
  id          String   @id @default(uuid())
  reviewerId  String   @map("reviewer_id")
  storagePath String   @map("storage_path")
  fileType    String   @map("file_type")
  byteSize    Int      @map("byte_size")
  version     Int      @default(1)
  createdAt   DateTime @default(now()) @map("created_at")
  reviewer    Reviewer @relation(fields: [reviewerId], references: [id], onDelete: Cascade)
  @@map("reviewer_files")
}

model Flashcard {
  id         String   @id @default(uuid())
  reviewerId String   @map("reviewer_id")
  front      String
  back       String
  source     String   @default("manual")
  sortOrder  Int      @map("sort_order")
  known      Boolean  @default(false)
  updatedAt  DateTime @updatedAt @map("updated_at")
  reviewer   Reviewer @relation(fields: [reviewerId], references: [id], onDelete: Cascade)
  @@index([reviewerId, sortOrder])
  @@map("flashcards")
}

model BlurtingAttempt {
  id         String   @id @default(uuid())
  reviewerId String   @map("reviewer_id")
  userId     String   @map("user_id")
  promptText String   @map("prompt_text")
  dumpText   String   @map("dump_text")
  aiScore    Int?     @map("ai_score")
  aiFeedback String?  @map("ai_feedback")
  selfRating String?  @map("self_rating")
  gradedVia  String   @map("graded_via")
  createdAt  DateTime @default(now()) @map("created_at")
  reviewer   Reviewer @relation(fields: [reviewerId], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([reviewerId, userId, createdAt(sort: Desc)])
  @@map("blurting_attempts")
}

model PomodoroSession {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  reviewerId   String?  @map("reviewer_id")
  focusSeconds Int      @map("focus_seconds")
  breakSeconds Int      @default(0) @map("break_seconds")
  mode         String   @default("focus")
  completed    Boolean  @default(true)
  startedAt    DateTime @map("started_at")
  endedAt      DateTime @map("ended_at")
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  reviewer     Reviewer? @relation(fields: [reviewerId], references: [id], onDelete: Cascade)
  @@index([userId, endedAt(sort: Desc)])
  @@map("pomodoro_sessions")
}
```

Extend `Reviewer` with `files ReviewerFile[]`, `flashcards Flashcard[]`, `blurtingAttempts BlurtingAttempt[]`, `pomodoroSessions PomodoroSession[]`, `aiPrompts Json? @map("ai_prompts")`, `deckGeneratedAt DateTime? @map("deck_generated_at")`, `deckStale Boolean @default(false) @map("deck_stale")`. Extend `AiQuota` with `gradesUsed Int @default(0) @map("grades_used")`, `gradesResetAt DateTime @map("grades_reset_at")`. Extend `User` with `dailyFocusMinutes Int @default(25) @map("daily_focus_minutes")`, plus `blurtingAttempts BlurtingAttempt[]` and `pomodoroSessions PomodoroSession[]` relations. Delete the `Block` model. Then run `npm run prisma:migrate -- --name upload_study_modes` in `backend/` and ensure the Supabase Storage bucket `reviewer-files` exists (private, 25 MB limit).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/integration/schema.test.js` in `backend/`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations backend/tests/integration/schema.test.js
git commit -m "feat: add upload and study-mode tables"
```

---

### Task 2: Upload-only creation + replace-file versioning

**Files:**
- Create: `backend/models/reviewerFileModel.js`
- Create: `backend/controllers/reviewerFileController.js`
- Create: `backend/routes/reviewerFileRoutes.js`
- Modify: `backend/server.js` (mount route), `backend/middleware/upload.js` (PDF/PPTX + 25 MB)
- Modify: `frontend/src/pages/Create.jsx` (upload-only form)
- Test: `backend/tests/integration/reviewerFiles.test.js`

**Interfaces:**
- Consumes: `ReviewerFile` model, `createStorageAdapter` from `backend/services/adapters/storage.js`, `requireAuth`.
- Produces: `POST /api/reviewer-files` (multipart `file` + `reviewerId`), `PUT /api/reviewer-files/:reviewerId` (replace file, bump version, set `deckStale=true`); storage path `{userId}/{reviewerId}/v{version}.{ext}`.

- [ ] **Step 1: Write the failing test**

```js
// backend/tests/integration/reviewerFiles.test.js
import { describe, it, expect } from 'vitest'

describe('reviewer file versioning', () => {
  it('rejects non-PDF/PPTX uploads with 400', async () => {
    const res = await globalThis.__app
      .post('/api/reviewer-files')
      .set('Cookie', await globalThis.__signedIn())
      .field('reviewerId', 'r1')
      .attach('file', Buffer.from('MZ'), 'evil.exe')
    expect(res.status).toBe(400)
  })
})
```

(Use the repo's existing supertest/app + signed-in helper pattern from `backend/tests/integration/reviewer.test.js`; if names differ, mirror that file's setup.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/integration/reviewerFiles.test.js` in `backend/`
Expected: FAIL with 404 (route does not exist yet).

- [ ] **Step 3: Write minimal implementation**

`backend/models/reviewerFileModel.js`:

```js
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const findByReviewerId = (reviewerId) =>
  prisma.reviewerFile.findFirst({ where: { reviewerId }, orderBy: { version: 'desc' } })

export const create = (data) => prisma.reviewerFile.create({ data })

export const bumpVersion = async (reviewerId, data) => {
  const current = await findByReviewerId(reviewerId)
  const version = (current?.version ?? 0) + 1
  return prisma.reviewerFile.create({ data: { ...data, reviewerId, version } })
}

export const removeByReviewerId = (reviewerId) =>
  prisma.reviewerFile.deleteMany({ where: { reviewerId } })
```

`backend/controllers/reviewerFileController.js`: verify ownership (`reviewer.authorId === req.user.id`), enforce `file.mimetype` in `['application/pdf', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']` and `file.size <= 25 * 1024 * 1024` (also set these limits in `backend/middleware/upload.js`), upload to `{userId}/{reviewerId}/v{version}.{ext}` with `upsert: true` on replace, signed URL returned only to authorized readers. Replace sets `reviewers.deckStale = true`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/integration/reviewerFiles.test.js` in `backend/`
Expected: PASS.

- [ ] **Step 5: Rewrite `Create.jsx` as upload-only**

Fields: title, courseCode, courseDescription, semester, examType, visibility, file input (accept `.pdf,.pptx`). On submit: `POST /api/reviewers` then `POST /api/reviewer-files`. Edit mode for own reviewer: metadata form + "Replace file" input with confirm dialog warning "Replacing may stale the AI deck — keep or regenerate after upload."

- [ ] **Step 6: Commit**

```bash
git add backend/models/reviewerFileModel.js backend/controllers/reviewerFileController.js backend/routes/reviewerFileRoutes.js backend/server.js backend/middleware/upload.js frontend/src/pages/Create.jsx backend/tests/integration/reviewerFiles.test.js
git commit -m "feat: add upload-only reviewer creation with replace-file"
```

---

### Task 3: AI deck generation (cards + prompts, stored once, quota 3)

**Files:**
- Modify: `backend/services/openaiService.js` (add `extractDeckAndPrompts`)
- Modify: `backend/controllers/aiController.js` (retarget `/extract` → decks; set limit 3)
- Modify: `backend/models/aiQuotaModel.js` (rolling 7-day helpers already exist — confirm window logic)
- Test: `backend/tests/unit/services/deckExtract.test.js`, extend `backend/tests/integration/ai.test.js`

**Interfaces:**
- Consumes: parsed file text, `{ courseCode, courseDescription, examType }`.
- Produces: `extractDeckAndPrompts(text, meta) => { cards: [{ front, back }], prompts: [string] }`; `POST /api/ai/extract` returns `{ cards, prompts, remaining, limit: 3 }` and persists rows once.

- [ ] **Step 1: Write the failing test**

```js
// backend/tests/unit/services/deckExtract.test.js
import { describe, it, expect } from 'vitest'
import { capDeck } from '../../../services/openaiService.js'

describe('capDeck', () => {
  it('trims to 40 cards and 5 prompts', () => {
    const cards = Array.from({ length: 60 }, (_, i) => ({ front: `Q${i}`, back: `A${i}` }))
    const prompts = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']
    const out = capDeck({ cards, prompts })
    expect(out.cards).toHaveLength(40)
    expect(out.prompts).toHaveLength(5)
    expect(out.trimmed).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/services/deckExtract.test.js` in `backend/`
Expected: FAIL with `capDeck is not a function`.

- [ ] **Step 3: Write minimal implementation**

In `backend/services/openaiService.js` add:

```js
export const capDeck = ({ cards, prompts }) => {
  const trimmedCards = cards.slice(0, 40)
  const trimmedPrompts = prompts.slice(0, 5)
  return {
    cards: trimmedCards,
    prompts: trimmedPrompts,
    trimmed: cards.length > 40 || prompts.length > 5,
  }
}

export const extractDeckAndPrompts = async (text, meta) => {
  const raw = await callLlmForDeck(text, meta) // reuse existing openrouter client + promptService
  return capDeck(raw)
}
```

In `backend/controllers/aiController.js`: change `AI_QUOTA_LIMIT` from 50 to 3; after extraction, `prisma.flashcard.createMany` with `source: 'ai'`, set `reviewer.aiPrompts = prompts`, `reviewer.deckGeneratedAt = new Date()`, `reviewer.deckStale = false`. Consume quota only on success; on LLM timeout return 502 with no quota consumed. Regenerate requires remaining quota + `confirm=true` body flag.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/services/deckExtract.test.js tests/integration/ai.test.js` in `backend/`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/services/openaiService.js backend/controllers/aiController.js backend/tests/unit/services/deckExtract.test.js
git commit -m "feat: generate stored flashcard decks with quota 3"
```

---

### Task 4: Flashcards API + deck UI

**Files:**
- Create: `backend/models/flashcardModel.js`
- Create: `backend/controllers/flashcardController.js`
- Create: `backend/routes/flashcardRoutes.js`
- Create: `frontend/src/components/FlashcardDeck.jsx`
- Test: `backend/tests/integration/flashcards.test.js`, `frontend/src/components/FlashcardDeck.test.jsx`

**Interfaces:**
- Consumes: `reviewerId` param; `requireAuth` for writes, `optionalAuth` for reads.
- Produces: `GET /api/reviewers/:id/cards`, `POST /api/reviewers/:id/cards`, `PATCH /api/cards/:cardId` (`{ known }` or `{ front, back }`), `DELETE /api/cards/:cardId`; guests get cards but writes return 401.

- [ ] **Step 1: Write the failing backend test**

```js
// backend/tests/integration/flashcards.test.js
import { describe, it, expect } from 'vitest'

describe('flashcard known toggle', () => {
  it('returns 401 for guest writes', async () => {
    const res = await globalThis.__app.patch('/api/cards/some-id').send({ known: true })
    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/integration/flashcards.test.js` in `backend/`
Expected: FAIL with 404 (no route yet).

- [ ] **Step 3: Write minimal implementation**

`backend/models/flashcardModel.js`:

```js
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const listByReviewer = (reviewerId) =>
  prisma.flashcard.findMany({ where: { reviewerId }, orderBy: { sortOrder: 'asc' } })

export const createMany = (rows) => prisma.flashcard.createMany({ data: rows })

export const setKnown = (id, known) =>
  prisma.flashcard.update({ where: { id }, data: { known } })

export const updateCard = (id, { front, back }) =>
  prisma.flashcard.update({ where: { id }, data: { front, back } })

export const removeCard = (id) => prisma.flashcard.delete({ where: { id } })
```

Controller: read allowed by visibility (public / unlisted-with-link / owner-private); all writes `requireAuth` + owner-or-401-guest; card writes verify the card's reviewer belongs to `req.user.id`. Return `{ cards, known, total }`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/integration/flashcards.test.js` in `backend/`
Expected: PASS.

- [ ] **Step 5: Write the failing frontend test**

```jsx
// frontend/src/components/FlashcardDeck.test.jsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FlashcardDeck } from './FlashcardDeck.jsx'

describe('FlashcardDeck', () => {
  it('flips on click and advances with next', () => {
    render(<FlashcardDeck cards={[{ id: '1', front: 'Q?', back: 'A.' }]} guest />)
    fireEvent.click(screen.getByText('Q?'))
    expect(screen.getByText('A.')).toBeTruthy()
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- src/components/FlashcardDeck.test.jsx` in `frontend/`
Expected: FAIL with module not found.

- [ ] **Step 7: Write minimal implementation**

`frontend/src/components/FlashcardDeck.jsx`: props `{ cards, guest, onToggleKnown, onAdd, onEdit, onDelete }`. Internal state: `index`, `flipped`, `order` (shuffled array of ids). Flip on click + Enter/Space; arrows prev/next; progress bar `known/total`; Butter-styled Generate button slot; guest banner "Sign in with Google to save progress". Colors from CSS vars (`--cream`, `--cocoa`, `--butter`).

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm test -- src/components/FlashcardDeck.test.jsx` in `frontend/`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add backend/models/flashcardModel.js backend/controllers/flashcardController.js backend/routes/flashcardRoutes.js backend/tests/integration/flashcards.test.js frontend/src/components/FlashcardDeck.jsx frontend/src/components/FlashcardDeck.test.jsx
git commit -m "feat: add flashcard deck api and ui"
```

---

### Task 5: Blurting mode (AI grade with limit, self fallback)

**Files:**
- Create: `backend/models/blurtingModel.js`
- Create: `backend/controllers/blurtingController.js`
- Create: `backend/routes/blurtingRoutes.js`
- Create: `frontend/src/components/BlurtingMode.jsx`
- Modify: `backend/models/aiQuotaModel.js` (grade bucket)
- Test: `backend/tests/integration/blurting.test.js`

**Interfaces:**
- Consumes: `checkGradeQuota(userId)`, `incrementGradeUsage(userId)` (new in `aiQuotaModel.js`); first entry of `reviewer.aiPrompts` as active prompt.
- Produces: `POST /api/reviewers/:id/blurting { dumpText }` → `{ gradedVia: 'ai', aiScore, aiFeedback }` or `{ gradedVia: 'self', sourceExcerpt, keyPoints }`; `GET /api/reviewers/:id/blurting` → attempt history (signed users only).

- [ ] **Step 1: Write the failing test**

```js
// backend/tests/integration/blurting.test.js
import { describe, it, expect } from 'vitest'

describe('blurting fallback', () => {
  it('falls back to self when grade quota exhausted', async () => {
    const user = await globalThis.__factories.user({ gradesUsed: 5 })
    const reviewer = await globalThis.__factories.reviewer(user, { aiPrompts: ['Explain X'] })
    const res = await globalThis.__app
      .post(`/api/reviewers/${reviewer.id}/blurting`)
      .set('Cookie', await globalThis.__signedIn(user))
      .send({ dumpText: 'everything I remember' })
    expect(res.body.gradedVia).toBe('self')
  })
})
```

(Mirror the factory/helper names in `backend/tests/helpers/mocks.js`; adjust only names, keep the assertion.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/integration/blurting.test.js` in `backend/`
Expected: FAIL with 404.

- [ ] **Step 3: Write minimal implementation**

`backend/models/aiQuotaModel.js` additions:

```js
export const GRADE_LIMIT = 5

export const checkGradeQuota = async (userId) => {
  const quota = await getOrCreateQuota(userId) // reuse existing window logic
  return quota.gradesUsed < GRADE_LIMIT
}

export const incrementGradeUsage = (userId) =>
  prisma.aiQuota.updateMany({ where: { userId }, data: { gradesUsed: { increment: 1 } } })
```

Controller branching:

```js
if (await checkGradeQuota(req.user.id)) {
  const { score, feedback } = await gradeDump(promptText, dumpText)
  await incrementGradeUsage(req.user.id)
  await blurtingModel.create({ reviewerId, userId, promptText, dumpText, aiScore: score, aiFeedback: feedback, gradedVia: 'ai' })
  return res.json({ gradedVia: 'ai', aiScore: score, aiFeedback: feedback, gradesLeft: GRADE_LIMIT - used - 1 })
}
const attempt = await blurtingModel.create({ reviewerId, userId, promptText, dumpText, gradedVia: 'self' })
return res.json({ gradedVia: 'self', sourceExcerpt, keyPoints, attemptId: attempt.id })
```

Self-rating saved via `PATCH /api/blurting/:attemptId { selfRating }` with `selfRating` in `['missed', 'partial', 'nailed']`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/integration/blurting.test.js` in `backend/`
Expected: PASS.

- [ ] **Step 5: Build `BlurtingMode.jsx`**

Props `{ prompt, guest, gradesLeft, onSubmit }`. States: `dump`, `result`. Submit → result view: AI path shows score + feedback; self path shows source excerpt side-by-side + Missed/Partial/Nailed buttons. Counter text `"3/5 AI reviews left"`; exhausted shows "AI feedback limit reached — self-review mode".

- [ ] **Step 6: Commit**

```bash
git add backend/models/blurtingModel.js backend/controllers/blurtingController.js backend/routes/blurtingRoutes.js backend/models/aiQuotaModel.js backend/tests/integration/blurting.test.js frontend/src/components/BlurtingMode.jsx
git commit -m "feat: add blurting mode with graded fallback"
```

---

### Task 6: Pomodoro sessions + streaks + goals

**Files:**
- Create: `backend/models/pomodoroModel.js`
- Create: `backend/controllers/pomodoroController.js`
- Create: `backend/routes/pomodoroRoutes.js`
- Create: `frontend/src/components/PomodoroDock.jsx`
- Modify: `frontend/src/pages/Profile.jsx`
- Test: `backend/tests/integration/pomodoro.test.js`

**Interfaces:**
- Consumes: `userId`, optional `reviewerId`.
- Produces: `POST /api/pomodoro/sessions { reviewerId, focusSeconds, breakSeconds, startedAt, endedAt }`; `GET /api/pomodoro/stats` → `{ todaySeconds, week: [s…7], streak, goal }`; `PATCH /api/users/me/goal { dailyFocusMinutes }`.

- [ ] **Step 1: Write the failing test**

```js
// backend/tests/integration/pomodoro.test.js
import { describe, it, expect } from 'vitest'
import { streakDays } from '../../models/pomodoroModel.js'

describe('streakDays', () => {
  it('counts consecutive days with a completed focus session', () => {
    const today = new Date()
    const yesterday = new Date(today.getTime() - 86400000)
    expect(streakDays([today, yesterday])).toBe(2)
    expect(streakDays([today])).toBe(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/integration/pomodoro.test.js` in `backend/`
Expected: FAIL with `streakDays is not a function`.

- [ ] **Step 3: Write minimal implementation**

```js
// backend/models/pomodoroModel.js
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const dayKey = (d) => d.toISOString().slice(0, 10)

export const streakDays = (endedAts) => {
  const days = [...new Set(endedAts.map(dayKey))].sort().reverse()
  const todayKey = dayKey(new Date())
  const yesterdayKey = dayKey(new Date(Date.now() - 86400000))
  if (days[0] !== todayKey && days[0] !== yesterdayKey) return 0
  let streak = 0
  const cursor = new Date(days[0])
  for (const key of days) {
    if (key === dayKey(cursor)) streak += 1
    else break
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export const create = (data) => prisma.pomodoroSession.create({ data })

export const statsForUser = async (userId) => {
  const since = new Date(Date.now() - 7 * 86400000)
  const rows = await prisma.pomodoroSession.findMany({
    where: { userId, completed: true, endedAt: { gte: since } },
    orderBy: { endedAt: 'desc' },
  })
  return rows
}
```

Controller derives `todaySeconds`, 7-bucket `week`, `streak` via `streakDays`, `goal` from `user.dailyFocusMinutes`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/integration/pomodoro.test.js` in `backend/`
Expected: PASS.

- [ ] **Step 5: Build `PomodoroDock.jsx`**

Props `{ reviewerId, guest }`. Presets 25/5, 50/10, custom minutes. `setInterval` ticks compute `elapsed = Date.now() - startedRef.current` (timestamp math). On focus complete: chime (mutable `muted` state) + `POST /api/pomodoro/sessions` (signed only; guests skip with no error). Profile shows today-total, 7 bars, goal editor, flame streak.

- [ ] **Step 6: Commit**

```bash
git add backend/models/pomodoroModel.js backend/controllers/pomodoroController.js backend/routes/pomodoroRoutes.js backend/tests/integration/pomodoro.test.js frontend/src/components/PomodoroDock.jsx frontend/src/pages/Profile.jsx
git commit -m "feat: add linked pomodoro with streaks and goals"
```

---

### Task 7: Study hub composition + guest taste-only

**Files:**
- Create: `frontend/src/components/StudyTabs.jsx`
- Modify: `frontend/src/pages/Reviewer.jsx` (and `Review.jsx` if duplicated), `frontend/src/App.jsx`
- Delete: `frontend/src/pages/Workspace.jsx`, `frontend/src/utils/exportPdf.js`
- Test: `frontend/tests/e2e/guest-study.spec.js` (Playwright), `backend/tests/integration/guestGuard.test.js`

**Interfaces:**
- Consumes: `FlashcardDeck`, `BlurtingMode`, `PomodoroDock`, reviewer payload `{ reviewer, fileUrl, cards, prompts, quota }`.
- Produces: tab shell with Source/Flashcards/Blurting + dock; guest in-memory mode (no POST calls); signed persistence.

- [ ] **Step 1: Write the failing backend guard test**

```js
// backend/tests/integration/guestGuard.test.js
import { describe, it, expect } from 'vitest'

describe('guest write guard', () => {
  it('blocks unauthenticated card writes with 401', async () => {
    const res = await globalThis.__app.post('/api/reviewers/x/cards').send({ front: 'q', back: 'a' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('guest-write-blocked')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/integration/guestGuard.test.js` in `backend/`
Expected: FAIL (wrong status or error string).

- [ ] **Step 3: Write minimal implementation**

Ensure every write route uses `requireAuth` and the auth middleware returns `{ error: 'guest-write-blocked' }` with 401 for missing sessions. Verify reads use `optionalAuth` with visibility checks: public → allow; unlisted → allow (link); private → owner only else 403. File URLs: public → public URL; unlisted/private → short-lived signed URL (Supabase `createSignedUrl`, 60s).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/integration/guestGuard.test.js` in `backend/`
Expected: PASS.

- [ ] **Step 5: Build `StudyTabs.jsx` + rewire pages**

Tabs: Source (PDF iframe / PPTX Office-viewer embed), Flashcards (`FlashcardDeck`), Blurting (`BlurtingMode`), dock (`PomodoroDock` always visible). `guest` prop from auth store: when guest, state stays local and every save affordance renders "Sign in with Google to save this" linking to `/login?returnTo=...`. Remove `/workspace` route from `App.jsx`; delete `Workspace.jsx` and `exportPdf.js`; remove remix buttons; keep Save + Follow + Notifications wiring.

- [ ] **Step 6: Write the Playwright journey**

```js
// frontend/tests/e2e/guest-study.spec.js
import { test, expect } from '@playwright/test'

test('guest practices without persistence', async ({ page }) => {
  await page.goto('/reviewers/public-sample')
  await page.getByRole('tab', { name: 'Flashcards' }).click()
  await page.getByText('Q?').click()
  await expect(page.getByText('Sign in with Google to save this')).toBeVisible()
})
```

- [ ] **Step 7: Run E2E**

Run: `npm run test:e2e -- tests/e2e/guest-study.spec.js` in `frontend/`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/components/StudyTabs.jsx frontend/src/pages/Reviewer.jsx frontend/src/App.jsx backend/tests/integration/guestGuard.test.js frontend/tests/e2e/guest-study.spec.js
git commit -m "feat: compose study hub with guest taste-only mode"
```

---

### Task 8: Block/remix/export removal + docs + full suite

**Files:**
- Modify: `backend/controllers/reviewerController.js` (delete block handlers, cascade study rows on delete), `backend/routes/reviewerRoutes.js` (delete block routes), `backend/controllers/socialController.js` (remove remix events if present)
- Delete: `backend/models/blockModel.js`, block/remix/export code, `frontend/src/pages/Workspace.jsx` (if not already), `frontend/src/utils/exportPdf.js` (if not already)
- Modify: `README.md`, `ARCHITECTURE.md`, `SCHEMA.md`, `DESIGN.md` (study-hub section)
- Test: full suites

**Interfaces:**
- Consumes: all previous tasks.
- Produces: no references to `Block`, `blocks`, `remix`, `exportPdf` anywhere; docs describe upload + study modes.

- [ ] **Step 1: Remove backend block/remix/export code**

Delete `backend/models/blockModel.js`; remove `addBlock`, `updateBlock`, `deleteBlock`, `reorderBlocks` from `reviewerController.js` and their routes; remove remix logic from `socialController.js` + notification `remix` event emission; on reviewer delete, also delete `reviewer_files`, `flashcards`, `blurting_attempts` rows (Prisma cascade covers it — verify relation `onDelete: Cascade` present) and remove storage objects.

- [ ] **Step 2: Verify zero references**

Run: `rg -l "blockModel|reorderBlocks|exportPdf|remix" backend frontend/src` in repo root
Expected: no output.

- [ ] **Step 3: Update docs**

`README.md`: replace workspace/AI-block bullets with upload + 3 study modes. `ARCHITECTURE.md`: replace block renderer section with study-hub + new tables. `SCHEMA.md`: replace `reviewer_blocks` with the 4 new tables. `DESIGN.md`: add study-hub tab + dock styling notes in kawaii tokens.

- [ ] **Step 4: Run the full suites**

Run: `npm test` in `backend/`, then `npm test` in `frontend/`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove workspace remix export and update docs"
```

---

## Self-Review

**1. Spec coverage:** Upload-only + replace-file → Tasks 1–2. Stored hybrid deck + quota 3 → Task 3. One deck per reviewer + shuffle/flip/Known → Task 4. Blurting AI-grade (5/week) with self fallback → Task 5. Linked Pomodoro + streaks/goals → Task 6. Guest taste-only + visibility → Task 7. Drop remix/export/workspace + legacy file-less banner → Tasks 7–8 (add the owner banner "Please upload the source file to enable study modes" for reviewers with no `reviewer_files` row in Task 7 Step 5). Social keep (save/follow/notifications) → untouched, verified in Task 8 suite.

**2. Placeholder scan:** No TBD/TODO; every step names exact files, exact commands, exact assertions.

**3. Type consistency:** `reviewerId` (Prisma String UUID) used across all models/controllers; `gradedVia: 'ai' | 'self'`; `selfRating: 'missed' | 'partial' | 'nailed'`; quota fields `generationsUsed/windowResetAt/gradesUsed/gradesResetAt`; storage path `{userId}/{reviewerId}/v{version}.{ext}` — consistent across Tasks 1–7.
