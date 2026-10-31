-- Index the public and author reviewer feeds by their actual sort order.
CREATE INDEX "reviewers_visibility_is_draft_updated_at_idx" ON "reviewers"("visibility", "is_draft", "updated_at" DESC);
CREATE INDEX "reviewers_author_id_updated_at_idx" ON "reviewers"("author_id", "updated_at" DESC);

-- Reverse lookups introduced by counts and batched social state.
CREATE INDEX "likes_reviewer_id_idx" ON "likes"("reviewer_id");
CREATE INDEX "follows_following_id_idx" ON "follows"("following_id");

-- The notifications feed filters by recipient and sorts by createdAt; the
-- existing index has isRead in the middle, so it cannot serve this ordering.
CREATE INDEX "notifications_recipient_id_created_at_idx" ON "notifications"("recipient_id", "created_at" DESC);
