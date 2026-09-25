# Review Well — Upload + Study Modes Revision — Design

Date: 2026-09-18
Status: Approved (all 6 sections confirmed by owner)
Approach: Lean migration (Approach 1)

## 1. Goal

Pivot Review Well from a workspace-authoring tool into an upload-and-study platform:

- Signed users upload PDF/PPTX reviewers directly (no block editor).
- Guests view/practice only (taste-only, nothing persists).
- Main value = study techniques: flashcards + blurting/brain-dump (the active-recall mode) + linked Pomodoro with goals/streaks.
- Keep save/bookmark, follow, notifications. Drop remix/fork and A4 PDF export.

## 2. Architecture & Scope

Removed:

- Workspace block editor (`Workspace.jsx`, block renderer, toolbar), `reviewer_blocks` table + controller logic, remix/fork endpoints + UI, A4 PDF export/watermark pipeline.

Kept as-is:

- Google OAuth + guest browsing shell, `users`, `reviewers` metadata (title, course code/description, semester, exam type, visibility), `ai_quotas`, save/bookmark (`likes`), follows, notifications, public Browse + Home, kawaii design tokens.

New/changed:

- `Create.jsx` becomes upload-only (PDF/PPTX ≤ 25 MB → Supabase Storage, full metadata form, replace-file versioning).
- `Reviewer.jsx` / `Review.jsx` becomes a study hub with three tabs — Source (inline file viewer) / Flashcards / Blurting — plus a persistent Pomodoro dock.
- New tables: `reviewer_files`, `flashcards`, `blurting_attempts`, `pomodoro_sessions`.
- AI extraction retargeted from blocks to deck + blurting key points, result stored once.

Unit boundaries:

- `files` (upload/store/serve) knows nothing about study logic.
- `decks`, `blurting`, `pomodoro` each own their tables + API + UI tab, communicating only via `reviewer_id`.
- `quota` guards all AI calls.

## 3. Data Model & File Storage

- `reviewer_files`: `id, reviewer_id FK CASCADE, storage_path, file_type (pdf/pptx), byte_size, version INT DEFAULT 1, created_at`. One live row per reviewer; replace-file bumps version, overwrites storage object, sets `deck_stale=TRUE` on reviewer until owner confirms keep-or-regenerate.
- `flashcards`: `id, reviewer_id FK CASCADE, front TEXT, back TEXT, source ENUM ('ai','manual'), sort_order, known BOOLEAN DEFAULT FALSE, updated_at`. One deck per reviewer. Index `(reviewer_id, sort_order)`.
- `blurting_attempts`: `id, reviewer_id, user_id FK CASCADE, prompt_text, dump_text, ai_score INT NULL, ai_feedback TEXT NULL, self_rating ENUM('missed','partial','nailed') NULL, graded_via ENUM('ai','self'), created_at`.
- `pomodoro_sessions`: `id, user_id, reviewer_id NULL, focus_seconds, break_seconds, mode ENUM('focus','break'), completed BOOLEAN, started_at, ended_at`. Streak = consecutive days with ≥ 1 completed focus session; goal = `users.daily_focus_minutes`.
- Storage bucket `reviewer-files`, path `{user_id}/{reviewer_id}/v{version}.{ext}`; signed URLs for private/unlisted, public URLs for public. 25 MB enforced client + server. PDF inline via iframe/pdf.js; PPTX via embedded Microsoft Office viewer URL (no server-side conversion in v1).
- Migration: back up `reviewer_blocks`, drop blocks/remix/export, backfill existing public reviewers as file-less entries prompting owner to upload.

## 4. Study Modes

Flashcards tab:

- Ordered deck, flip (reduced-motion fallback = instant swap), Shuffle, progress `known/total`, Known / Still learning toggle persisted for signed users (guests in-memory + "Sign in to save progress" banner).
- Add/edit/delete card form. Empty state: "Generate starter deck" if quota remains, else manual-only notice.

Blurting tab (active recall):

- Prompt header (AI key-point, e.g. "Dump everything you remember about X"), textarea, Submit.
- AI grade path → score + feedback + missed points, saved as `graded_via='ai'`.
- Fallback path → reveal source excerpt/key points side-by-side, self-rate Missed/Partial/Nailed, saved as `graded_via='self'`.
- Guests: full flow in-memory, no rows. Up to 5 prompts stored per reviewer; MVP displays the first prompt as the active one (prompt rotation deferred).

Pomodoro dock:

- Presets 25/5 + 50/10 + custom; Start/Pause/Reset; auto-attached `reviewer_id`; completion chime (mutable); signed users write `pomodoro_sessions` rows.
- Profile: today-total, 7-day chart, editable daily goal, streak flame. Guests: timer runs, no rows/streak.

Folded-in techniques (no extra tabs): spaced recall via shuffle + deck reset; Feynman via "Explain X simply" blurting prompts.

## 5. Access Control

- Guests: browse public reviewers, open study hub, view Source, flip/shuffle, blurting box + self-compare, Pomodoro — React state only, zero writes (`401 guest-write-blocked` on forced writes). Persistent affordances show "Sign in with Google to save this" with return URL. No My Reviewers / Notifications / Profile / Create.
- Signed users: full upload CRUD, deck generation (quota-gated), card CRUD, attempt history, Pomodoro history + goal/streak, Save + Follow + Notifications.
- Visibility: `public` (listed, practicable by all), `unlisted` (link-only, guests via link OK), `private` (owner only). Signed file URLs match visibility. Server-side session check + RLS on every mutation; client gating cosmetic only.

## 6. AI Generation, Quotas, Persistence

- Deck generation: upload (or Generate on file-less legacy reviewer) → server parse → one LLM call → `{cards: [{front, back}] ≤ 40, blurting_prompts: [] ≤ 5}` → insert rows + store prompts (`reviewers.ai_prompts JSONB`, `deck_generated_at`, `deck_stale`). Costs 1 of 3 weekly units (`ai_quotas`, rolling 7-day, unchanged). Refresh reads DB — never regenerates. Regen needs quota + overwrite confirm.
- Blurting grading bucket: 5 AI grades / 7 days per user across all reviewers (columns `grades_used, grades_reset_at` on `ai_quotas`). Empty → automatic fallback to self-compare with notice. Self-ratings never consume quota.
- Surfacing: counters on buttons ("2/3 decks left · resets Fri", "3/5 AI reviews left"); `429` carries `reset_at`.
- Failures: parse failure keeps file + manual-add notice; LLM timeout consumes no quota, retry allowed; partial JSON inserts valid subset + flags remainder. Deck cap 40 cards with "trimmed" notice.

## 7. Error Handling, Testing, Migration

- Errors: > 25 MB / wrong type / corrupt rejected pre-upload with friendly copy; storage failure rolls back reviewer creation (transaction); Pomodoro uses timestamp math (background-tab accurate); keyboard (Enter/Space flip, arrows navigate) + `prefers-reduced-motion` throughout.
- Tests: backend (quota gating, guest-write blocks, deck CRUD, grading bucket + fallback, streak math); frontend (deck progress, fallback UI, timer states); Playwright (guest taste-only journey, signed upload → generate → study → streak, replace-file flow).
- Rollout: single breaking release. Prisma migration (drop blocks/remix/export; add 4 tables + reviewer AI columns), delete workspace/export code, update nav (Create → Upload; Reviewer → Study hub). Legacy block-only reviewers show owner banner "Please upload the source file to enable study modes". Update `README`, `ARCHITECTURE`, `SCHEMA`, `DESIGN`.

## 8. Out of Scope (v1)

Multiple decks per reviewer, generation version history, SM-2 spaced-repetition scheduling, mock-exam mode, social remix, PDF export, PPTX-to-PDF server conversion (fallback viewer only).
