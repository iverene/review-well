# Review Well — Database Schema Specification

## 1. Overview

The persistent data layer for **Review Well** is built on **PostgreSQL (via Supabase)**. It utilizes relational tables enforcing strict foreign key constraints, cascading deletes where appropriate, and indexed metadata fields for rapid search, filtering, and social graph traversal.

---

## 2. Entity-Relationship Diagram (ERD Summary)

* **`users` 1 : N `reviewers`** (A user can author multiple reviewers)
* **`users` 1 : N `ai_quotas`** (Tracks rolling deck-generation and AI-grade limits per user)
* **`reviewers` 1 : N `reviewer_files`** (A reviewer holds versioned source-file rows; objects live in Storage at `{userId}/{reviewerId}/vN.ext`)
* **`reviewers` 1 : N `flashcards`** (A reviewer owns its flashcard deck, ordered by `sort_order`)
* **`reviewers` 1 : N `blurting_attempts`** (Free-recall attempts, graded by AI or self-rated)
* **`users` 1 : N `pomodoro_sessions`** (Focus sessions, optionally linked to a reviewer)
* **`users` M : N `reviewers` (via `likes` table, `Save` model)** (Users can save/bookmark multiple reviewers)
* **`users` M : N `users` (via `follows`)** (Users can follow other users)
* **`users`1 : N `notifications`** (Tracks user notifications for saves, follows, and new reviewers)

---

## 3. Table Schemas

### 3.1 `users`
Stores user profile telemetry, Google OAuth binding, and onboarding standing.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique internal user identifier |
| `google_id` | VARCHAR(255) | UNIQUE, NOT NULL | Google OAuth subject ID |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Verified user email address |
| `display_name` | VARCHAR(100) | NOT NULL | Public username handle |
| `avatar_url` | TEXT | NULL | Profile picture image URI |
| `school` | VARCHAR(150) | NOT NULL | Institution name (e.g., BatStateU) |
| `program` | VARCHAR(150) | NOT NULL | Degree program (e.g., BSIT Business Analytics) |
| `major` | VARCHAR(100) | NULL | Specialization or major field |
| `year_level` | VARCHAR(20) | NOT NULL | Academic standing (e.g., "3rd Year") |
| `daily_focus_minutes` | INT | DEFAULT `25` | Daily Pomodoro focus goal |
| `created_at` | TIMESTAMPTZ | DEFAULT `NOW()` | Account creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT `NOW()` | Last profile update timestamp |

### 3.2 `reviewers`
Stores metadata and configuration for study guides and review sheets.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique reviewer identifier |
| `author_id` | UUID | REFERENCES `users(id) ON DELETE CASCADE` | Creator user ID |
| `title` | VARCHAR(255) | NOT NULL | Document title |
| `course_code` | VARCHAR(50) | NOT NULL | Course code badge (e.g., "BAT 403") |
| `course_description` | TEXT | NOT NULL | Full course title description |
| `semester` | VARCHAR(50) | NOT NULL | Academic term (e.g., "2nd Semester") |
| `exam_type` | VARCHAR(50) | NOT NULL | Assessment category ("Prelim", "Midterm", "Final") |
| `thumbnail_icon` | TEXT | NULL | Optional icon URL or emoji string |
| `color_palette` | JSONB | NOT NULL | Semantic 3-4 color scheme codes |
| `visibility` | VARCHAR(20) | DEFAULT `'private'` | Access state (`'public'`, `'unlisted'`, `'private'`) |
| `is_draft` | BOOLEAN | DEFAULT `TRUE` | Draft status indicator (cleared when shared) |
| `ai_prompts` | JSONB | NULL | Blurting prompts generated with the deck |
| `deck_generated_at` | TIMESTAMPTZ | NULL | When the current AI deck was stored |
| `deck_stale` | BOOLEAN | DEFAULT `FALSE` | Set when the source file is replaced |
| `created_at` | TIMESTAMPTZ | DEFAULT `NOW()` | Initial creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT `NOW()` | Last edit timestamp |

All child rows (`reviewer_files`, `flashcards`, `blurting_attempts`, `pomodoro_sessions`, `likes`, `notifications`) use `ON DELETE CASCADE`; deleting a reviewer also best-effort removes its Storage prefix.

### 3.3 `reviewer_files`
Stores one row per reviewer pointing at the current versioned source object.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique file-row identifier |
| `reviewer_id` | UUID | REFERENCES `reviewers(id) ON DELETE CASCADE` | Parent reviewer ID |
| `storage_path` | TEXT | NOT NULL | Storage object path (`{userId}/{reviewerId}/vN.ext`) |
| `file_type` | VARCHAR(20) | NOT NULL | `'pdf'` or `'pptx'` |
| `byte_size` | INT | NOT NULL | Upload size in bytes (max 25 MB) |
| `version` | INT | DEFAULT `1` | Increments on replace |
| `created_at` | TIMESTAMPTZ | DEFAULT `NOW()` | Row creation timestamp |

### 3.4 `flashcards`
Stores the per-reviewer flashcard deck (AI-generated or manual).

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique card identifier |
| `reviewer_id` | UUID | REFERENCES `reviewers(id) ON DELETE CASCADE` | Parent reviewer ID |
| `front` | TEXT | NOT NULL | Term or question |
| `back` | TEXT | NOT NULL | Definition or explanation |
| `source` | VARCHAR(20) | DEFAULT `'manual'` | `'ai'` or `'manual'` |
| `sort_order` | INT | NOT NULL | Deck display sequence |
| `known` | BOOLEAN | DEFAULT `FALSE` | Marked known by the owner |
| `updated_at` | TIMESTAMPTZ | DEFAULT `NOW()` | Last update timestamp |

### 3.5 `blurting_attempts`
Stores free-recall attempts with AI grades or self-ratings.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique attempt identifier |
| `reviewer_id` | UUID | REFERENCES `reviewers(id) ON DELETE CASCADE` | Parent reviewer ID |
| `user_id` | UUID | REFERENCES `users(id) ON DELETE CASCADE` | Attempting user ID |
| `prompt_text` | TEXT | NOT NULL | The recall prompt answered |
| `dump_text` | TEXT | NOT NULL | Free recall written from memory |
| `ai_score` | INT | NULL | AI grade 0–10 (NULL when self-rated) |
| `ai_feedback` | TEXT | NULL | AI feedback on the recall |
| `self_rating` | VARCHAR(20) | NULL | Owner self-rating when AI quota is out |
| `graded_via` | VARCHAR(20) | NOT NULL | `'ai'` or `'self'` |
| `created_at` | TIMESTAMPTZ | DEFAULT `NOW()` | Attempt timestamp |

### 3.6 `pomodoro_sessions`
Stores focus sessions, optionally linked to a reviewer.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique session identifier |
| `user_id` | UUID | REFERENCES `users(id) ON DELETE CASCADE` | Owning user ID |
| `reviewer_id` | UUID | NULL, REFERENCES `reviewers(id) ON DELETE CASCADE` | Linked reviewer, if any |
| `focus_seconds` | INT | NOT NULL | Focused time |
| `break_seconds` | INT | DEFAULT `0` | Break time taken |
| `mode` | VARCHAR(20) | DEFAULT `'focus'` | Session mode |
| `completed` | BOOLEAN | DEFAULT `TRUE` | Whether the session completed |
| `started_at` | TIMESTAMPTZ | NOT NULL | Session start |
| `ended_at` | TIMESTAMPTZ | NOT NULL | Session end |

### 3.7 `ai_quotas`
Manages rolling rate limits: 3 deck generations and 5 AI grades per 7-day window per user.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Quota record ID |
| `user_id` | UUID | REFERENCES `users(id) ON DELETE CASCADE` | Target user ID |
| `generations_used` | INT | DEFAULT `0` | Deck generations used in current rolling window |
| `window_reset_at` | TIMESTAMPTZ | NOT NULL | Timestamp when the generation window expires |
| `grades_used` | INT | DEFAULT `0` | AI blurting grades used in current rolling window |
| `grades_reset_at` | TIMESTAMPTZ | NOT NULL | Timestamp when the grade window expires |
| `updated_at` | TIMESTAMPTZ | DEFAULT `NOW()` | Last quota consumption timestamp |

### 3.8 `likes` (`Save` model) & `follows` (Social Graph)

* **`likes` Table (bookmarks via the `Save` Prisma model):**
  * `user_id` (UUID, FK `users`)
  * `reviewer_id` (UUID, FK `reviewers`)
  * `PRIMARY KEY (user_id, reviewer_id)`

* **`follows` Table:**
  * `follower_id` (UUID, FK `users`)
  * `following_id` (UUID, FK `users`)
  * `PRIMARY KEY (follower_id, following_id)`

### 3.9 `notifications`
Stores social event triggers (saves, follows, new reviewers) for user notification bells.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique notification identifier |
| `recipient_id` | UUID | REFERENCES `users(id) ON DELETE CASCADE` | User receiving the notification |
| `actor_id` | UUID | REFERENCES `users(id) ON DELETE CASCADE` | User who triggered the action |
| `action_type` | VARCHAR(50) | NOT NULL | Type of event (`'save'`, `'follow'`, `'new_reviewer'`) |
| `reviewer_id` | UUID | REFERENCES `reviewers(id) ON DELETE CASCADE` (NULLABLE) | Target reviewer ID if applicable |
| `is_read` | BOOLEAN | DEFAULT `FALSE` | Read status indicator |
| `created_at` | TIMESTAMPTZ | DEFAULT `NOW()` | Notification generation timestamp |

---

## 4. Indexing & Performance Optimization

* `CREATE INDEX idx_reviewers_search ON reviewers(title, course_code, visibility) WHERE visibility = 'public';`
* `CREATE INDEX idx_flashcards_order ON flashcards(reviewer_id, sort_order);`
* `CREATE INDEX idx_blurting_attempts_lookup ON blurting_attempts(reviewer_id, user_id, created_at DESC);`
* `CREATE INDEX idx_pomodoro_user ON pomodoro_sessions(user_id, ended_at DESC);`
* `CREATE INDEX idx_ai_quotas_user ON ai_quotas(user_id, window_reset_at);`
* `CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read, created_at DESC);`
