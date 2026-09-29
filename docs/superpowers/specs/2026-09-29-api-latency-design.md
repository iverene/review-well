# API Latency Design

Date: 2026-09-29
Status: Approved (all sections)

## Problem

Measured 2026-09-29 against production: warm `GET /api/reviewers/public`
takes ~300ms, cold ~2.9s. Compute runs in Virginia (iad1) while Postgres
sits in Mumbai (ap-south-1), so every query round trip crosses half the
planet. Controllers are already parallelized — the latency is structural.
Two concrete wastes: each list endpoint runs a `count` query whose result
nothing reads, and `connection_limit=1` serializes each page's parallel
queries one round trip at a time.

## Goal

Halve warm list/detail latency with code and config changes only (no
dashboard or plan changes; region move explicitly out of scope). Second of
three performance sub-projects (boot payload done; reviewer/PDF open next).

## Connection Limit 1 to 3

Each serverless instance holds one pooled connection today, so a detail
page's parallel queries (file, cards, quota) run sequentially across
regions. At 3 they run concurrently: roughly one round trip instead of
three. Pool math: Supabase session-mode server connections cap at 15, but
transaction-mode pooling multiplexes many lightweight clients onto few
server connections; per-instance 3 at current single-digit concurrency
stays an order of magnitude under pressure. The 500-handler and existing
tests cover exhaustion behavior, so a regression would be loud, not
silent. One-line change in `DATABASE_URL` (`connection_limit=3`): local
`.env` plus Vercel env vars, documented in `.env.example`.
Acceptance: warm list endpoint near 150ms (baseline 300ms, same 3-sample
measurement), no `EMAXCONNSESSION` in logs in the following days.

## Drop the Unread Count Queries

`findPublic`, `findPublicByAuthor`, and `findByAuthor` each run `findMany`
plus `count`, but no consumer reads `total`/`hasMore` (verified 2026-09-29:
frontend renders the arrays directly, no pagination consumes the totals).
Removing the three `count` calls deletes one full cross-region round trip
per list fetch. Response shape `{ reviewers, total, hasMore }` is
preserved (`total` becomes `reviewers.length`, `hasMore` `false`), so no
controller, frontend, or test changes beyond the three model functions.
Acceptance: backend unit/integration suites green unchanged, warm list
timing improves, response bodies identical apart from the two derived
fields.

## Testing

- Backend unit + integration suites must pass unchanged (shape preserved).
- Before/after warm timings of `/api/reviewers/public` and one detail
  endpoint, measured the same way as the baseline (3 warm samples).
- Post-deploy watch: Vercel logs free of `EMAXCONNSESSION` for several days
  after the limit raise.
