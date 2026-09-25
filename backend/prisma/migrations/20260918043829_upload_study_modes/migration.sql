-- AlterTable
ALTER TABLE "reviewers" ADD COLUMN "ai_prompts" JSONB,
ADD COLUMN "deck_generated_at" TIMESTAMP(3),
ADD COLUMN "deck_stale" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "daily_focus_minutes" INTEGER NOT NULL DEFAULT 25;

-- AlterTable
ALTER TABLE "ai_quotas" ADD COLUMN "grades_used" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "grades_reset_at" TIMESTAMP(3);

-- Backfill grades_reset_at for existing quota rows, then enforce NOT NULL
UPDATE "ai_quotas" SET "grades_reset_at" = CURRENT_TIMESTAMP WHERE "grades_reset_at" IS NULL;
ALTER TABLE "ai_quotas" ALTER COLUMN "grades_reset_at" SET NOT NULL;

-- CreateTable
CREATE TABLE "reviewer_files" (
    "id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "byte_size" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviewer_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flashcards" (
    "id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "sort_order" INTEGER NOT NULL,
    "known" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flashcards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blurting_attempts" (
    "id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "prompt_text" TEXT NOT NULL,
    "dump_text" TEXT NOT NULL,
    "ai_score" INTEGER,
    "ai_feedback" TEXT,
    "self_rating" TEXT,
    "graded_via" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blurting_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pomodoro_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reviewer_id" TEXT,
    "focus_seconds" INTEGER NOT NULL,
    "break_seconds" INTEGER NOT NULL DEFAULT 0,
    "mode" TEXT NOT NULL DEFAULT 'focus',
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pomodoro_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "flashcards_reviewer_id_sort_order_idx" ON "flashcards"("reviewer_id", "sort_order");

-- CreateIndex
CREATE INDEX "blurting_attempts_reviewer_id_user_id_created_at_idx" ON "blurting_attempts"("reviewer_id", "user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "pomodoro_sessions_user_id_ended_at_idx" ON "pomodoro_sessions"("user_id", "ended_at" DESC);

-- DropForeignKey
ALTER TABLE "reviewer_blocks" DROP CONSTRAINT "reviewer_blocks_reviewer_id_fkey";

-- DropTable
DROP TABLE "reviewer_blocks";

-- AddForeignKey
ALTER TABLE "reviewer_files" ADD CONSTRAINT "reviewer_files_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "reviewers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "reviewers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blurting_attempts" ADD CONSTRAINT "blurting_attempts_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "reviewers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blurting_attempts" ADD CONSTRAINT "blurting_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pomodoro_sessions" ADD CONSTRAINT "pomodoro_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pomodoro_sessions" ADD CONSTRAINT "pomodoro_sessions_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "reviewers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
