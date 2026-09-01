# Review Well — Database Schema Specification

## 1. Overview

The persistent data layer for **Review Well** is built on **PostgreSQL (via Supabase)**. It utilizes relational tables enforcing strict foreign key constraints, cascading deletes where appropriate, and indexed metadata fields for rapid search, filtering, and social graph traversal.

---

## 2. Entity-Relationship Diagram (ERD Summary)

* **`users` 1 : N `reviewers`** (A user can author multiple reviewers)
* **`users` 1 : N `ai_quotas`** (Tracks weekly generation limits per user)
* **`reviewers` 1 : N `reviewer_blocks`** (A reviewer is composed of modular structured blocks)
* **`users` M : N `reviewers` (via `likes`)** (Users can like multiple reviewers)
* **`users` M : N `users` (via `follows`)** (Users can follow other users)
* **`users`1 : N `notifications`** (Tracks user notifications for likes and follows)

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
| `is_draft` | BOOLEAN | DEFAULT `TRUE` | Auto-save draft status indicator |
| `created_at` | TIMESTAMPTZ | DEFAULT `NOW()` | Initial creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT `NOW()` | Last auto-save or edit timestamp |

### 3.3 `reviewer_blocks`
Stores modular structural components enforcing the strict two-column A4 layout.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique block identifier |
| `reviewer_id` | UUID | REFERENCES `reviewers(id) ON DELETE CASCADE` | Parent reviewer ID |
| `block_type` | VARCHAR(50) | NOT NULL | Component type (`'topic_banner'`, `'sub_topic_banner'`, `'content_block'`, `'table'`) |
| `column_index` | INT | DEFAULT `1` | Column placement (`1` or `2`) |
| `sort_order` | INT | NOT NULL | Vertical display sequence index |
| `content_data` | JSONB | NOT NULL | Structured text, headings, or table items |
| `created_at` | TIMESTAMPTZ | DEFAULT `NOW()` | Block creation timestamp |

### 3.4 `ai_quotas`
Manages rolling rate limits for AI file extractions (max 3 per week).

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Quota record ID |
| `user_id` | UUID | REFERENCES `users(id) ON DELETE CASCADE` | Target user ID |
| `generations_used` | INT | DEFAULT `0` | Count used in current rolling window |
| `window_reset_at` | TIMESTAMPTZ | NOT NULL | Timestamp when current quota period expires |
| `updated_at` | TIMESTAMPTZ | DEFAULT `NOW()` | Last generation consumption timestamp |

### 3.6 `likes` & `follows` (Social Graph)

* **`likes` Table:**
  * `user_id` (UUID, FK `users`)
  * `reviewer_id` (UUID, FK `reviewers`)
  * `PRIMARY KEY (user_id, reviewer_id)`

* **`follows` Table:**
  * `follower_id` (UUID, FK `users`)
  * `following_id` (UUID, FK `users`)
  * `PRIMARY KEY (follower_id, following_id)`

### 3.6 `notifications`
Stores social event triggers (likes and follows) for user notification bells.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique notification identifier |
| `recipient_id` | UUID | REFERENCES `users(id) ON DELETE CASCADE` | User receiving the notification |
| `actor_id` | UUID | REFERENCES `users(id) ON DELETE CASCADE` | User who triggered the action |
| `action_type` | VARCHAR(50) | NOT NULL | Type of event (`'like'`, `'follow'`) |
| `reviewer_id` | UUID | REFERENCES `reviewers(id) ON DELETE CASCADE` (NULLABLE) | Target reviewer ID if applicable |
| `is_read` | BOOLEAN | DEFAULT `FALSE` | Read status indicator |
| `created_at` | TIMESTAMPTZ | DEFAULT `NOW()` | Notification generation timestamp |

---

## 4. Indexing & Performance Optimization

* `CREATE INDEX idx_reviewers_search ON reviewers(title, course_code, visibility) WHERE visibility = 'public';`
* `CREATE INDEX idx_reviewer_blocks_order ON reviewer_blocks(reviewer_id, column_index, sort_order);`
* `CREATE INDEX idx_ai_quotas_user ON ai_quotas(user_id, window_reset_at);`
* `CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read, created_at DESC);`
