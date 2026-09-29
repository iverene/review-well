# API Latency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Halve warm list/detail API latency with a higher pool limit and three fewer cross-region queries per list fetch.

**Architecture:** Two independent changes: raise Prisma `connection_limit` 1→3 so each page's parallel queries actually run concurrently, and delete the `count` queries whose totals nothing reads. Response shapes are preserved, so controllers, frontend, and most tests are untouched.

**Tech Stack:** Node 22, Prisma 5.22 (transaction-mode pooler), vitest. Backend workdir: `C:\Users\Iverene Grace\Projects\review-well\backend`. Repo root: `C:\Users\Iverene Grace\Projects\review-well`.

## Global Constraints

- Response shape `{ reviewers, total, hasMore }` is preserved on all three list functions (`total` becomes `reviewers.length`, `hasMore` becomes `false`).
- Never print secrets: verify `.env` edits only through redacted reads (patterns below).
- `connection_limit=3`, not higher (pool math in the spec).
- The human updates Vercel env vars and redeploys; subagents never touch production.
- If a size/count assertion fails for a reason outside the brief, STOP and report NEEDS_CONTEXT — do not weaken unrelated assertions.

---

## File Structure

- Modify `backend/.env` (scripted regex only — it holds the real password; never Read or print it raw) and `backend/.env.example` (literal edit, placeholders only).
- Modify `backend/models/reviewerModel.js` (three functions: `findPublic`, `findPublicByAuthor`, `findByAuthor`).
- Modify `backend/tests/unit/models/reviewerModel.test.js` (one cache test's `count` assertion).

---

### Task 1: Raise the pool limit to 3

**Files:**
- Modify: `backend/.env` (scripted, redacted verification only)
- Modify: `backend/.env.example` (literal edit)

**Interfaces:**
- Consumes: nothing. Produces: `DATABASE_URL` with `connection_limit=3` (plus existing `pgbouncer=true`); `DIRECT_URL` unchanged on 5432.

- [ ] **Step 1: Update the local `.env` by script (never open it)**

Run, with workdir `C:\Users\Iverene Grace\Projects\review-well\backend`:

```bash
$lines = Get-Content -LiteralPath ".env"; $lines = $lines | ForEach-Object { if ($_ -match '^DATABASE_URL="[^"]*connection_limit=1"') { $_ -replace 'connection_limit=1', 'connection_limit=3' } else { $_ } }; $lines | Set-Content -LiteralPath ".env"; echo ENV_UPDATED
```

Expected: `ENV_UPDATED`. (If the line no longer ends in `connection_limit=1"`, the replace silently does nothing — the next step catches that.)

- [ ] **Step 2: Verify redacted (passwords never print)**

Run, with workdir `C:\Users\Iverene Grace\Projects\review-well\backend`:

```bash
$l = Select-String -LiteralPath ".env" -Pattern "^DATABASE_URL=" | Select-Object -First 1 -ExpandProperty Line; $l -replace ':(//[^:]+:)[^@]+@', ':$1[redacted]@'
```

Expected: a line ending in `?pgbouncer=true&connection_limit=3"` (password shown as `[redacted]`). If it still shows `connection_limit=1`, STOP and report NEEDS_CONTEXT.

- [ ] **Step 3: Update `.env.example` literally**

Read `backend/.env.example` first (required before editing), then replace the `DATABASE_URL` line's `connection_limit=1` with `connection_limit=3`, keeping everything else identical.

- [ ] **Step 4: Run the backend suite (env change must break nothing)**

Run, with workdir `C:\Users\Iverene Grace\Projects\review-well\backend`:

```bash
npx vitest run tests/unit/models/reviewerModel.test.js 2>&1 | Select-String -Pattern "Test Files|Tests "
```

Expected: PASS (env values don't affect mocked unit tests; this is a smoke check).

- [ ] **Step 5: Commit**

```bash
git add backend/.env.example
git commit -m "perf: raise database pool limit to 3 for parallel queries"
```

(`backend/.env` is gitignored and must NOT be staged — verify with `git status --short` that only `.env.example` is committed.)

- [ ] **Step 6: Record the human follow-up in the report (do not attempt it)**

Vercel backend project → Environment Variables → change `DATABASE_URL` to `connection_limit=3` (same value as local), then redeploy. Until then, production still runs at limit 1.

---

### Task 2: Drop the unread count queries

**Files:**
- Modify: `backend/models/reviewerModel.js` (three functions)
- Test: `backend/tests/unit/models/reviewerModel.test.js` (one assertion)

**Interfaces:**
- Consumes: `prisma.reviewer.findMany` (unchanged arguments).
- Produces: `findPublic`, `findPublicByAuthor`, `findByAuthor` still resolve `{ reviewers, total, hasMore }` with `total` = `reviewers.length`, `hasMore` = `false`.

- [ ] **Step 1: Update the one test that counts `count` calls**

In `backend/tests/unit/models/reviewerModel.test.js`, replace the `should serve repeat list reads from cache` test (lines 92-102) with:

```js
it('should serve repeat list reads from cache', async () => {
  clearAll()
  mockPrismaInstance.reviewer.findMany.mockClear()
  mockPrismaInstance.reviewer.count.mockClear()

  await reviewerModel.findPublic({ skip: 0, take: 5 })
  await reviewerModel.findPublic({ skip: 0, take: 5 })

  expect(mockPrismaInstance.reviewer.findMany).toHaveBeenCalledTimes(1)
  expect(mockPrismaInstance.reviewer.count).not.toHaveBeenCalled()
})
```

(All other tests in the file pass unchanged: `total` is still 2 from the two mocked rows, `hasMore` still false. Do not touch them.)

- [ ] **Step 2: Run the test to verify it fails**

Run, with workdir `C:\Users\Iverene Grace\Projects\review-well\backend`:

```bash
npx vitest run tests/unit/models/reviewerModel.test.js 2>&1 | Select-String -Pattern "Test Files|Tests |FAIL "
```

Expected: FAIL on `should serve repeat list reads from cache` (`count` still called once per miss).

- [ ] **Step 3: Remove the three `count` calls**

In `backend/models/reviewerModel.js`, the change is identical in all three
functions — only the `remember(...)` body changes; the `where` object, the
`findMany` arguments, and the cache key stay byte-identical. For
`findPublic`, replace:

```js
  return remember(`reviewers:public:${skip}:${take}:${search}:${examType}:${semester}`, TTL_60_SECONDS, async () => {
    const [reviewers, total] = await Promise.all([
      prisma.reviewer.findMany({
        where,
        include: {
          user: { select: { id: true, displayName: true, avatarUrl: true } },
          _count: { select: { saves: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
      }),
      prisma.reviewer.count({ where }),
    ])

    return {
      reviewers,
      total,
      hasMore: skip + take < total,
    }
  })
```

with:

```js
  return remember(`reviewers:public:${skip}:${take}:${search}:${examType}:${semester}`, TTL_60_SECONDS, async () => {
    const reviewers = await prisma.reviewer.findMany({
      where,
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
        _count: { select: { saves: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take,
    })

    return {
      reviewers,
      total: reviewers.length,
      hasMore: false,
    }
  })
```

Apply the same transformation to `findPublicByAuthor` (cache key
`reviewers:author:${authorId}:${skip}:${take}`) and `findByAuthor` (cache
key `reviewers:my:${authorId}:${skip}:${take}`): keep each function's own
key, `where`, and `findMany` arguments exactly as they are today, delete
the `prisma.reviewer.count({ where })` element, unwrap the array
destructure to a single `reviewers` variable, and return `{ reviewers,
total: reviewers.length, hasMore: false }`.

- [ ] **Step 4: Run the model suite plus all consumers' suites**

Run, with workdir `C:\Users\Iverene Grace\Projects\review-well\backend`:

```bash
npx vitest run tests/unit/models/reviewerModel.test.js tests/unit/controllers/reviewerController.test.js tests/unit/controllers/socialController.test.js tests/integration/reviewer.test.js 2>&1 | Select-String -Pattern "Test Files|Tests |FAIL "
```

Expected: PASS, all files (controller/integration tests mock the model, so the shape preservation keeps them green).

- [ ] **Step 5: Lint the changed files**

Run, with workdir `C:\Users\Iverene Grace\Projects\review-well\backend`:

```bash
npx eslint models/reviewerModel.js tests/unit/models/reviewerModel.test.js 2>&1 | Select-Object -First 3; echo lint-done
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add backend/models/reviewerModel.js backend/tests/unit/models/reviewerModel.test.js
git commit -m "perf: drop unread count queries from reviewer lists"
```

---

### Task 3: Verification and re-measurement

**Files:** none (verification only).

- [ ] **Step 1: Run the full backend suite**

Run, with workdir `C:\Users\Iverene Grace\Projects\review-well\backend`:

```bash
npx vitest run --pool=forks --maxWorkers=2 --minWorkers=2 2>&1 | Select-String -Pattern "Test Files|Tests |FAIL "
```

Expected: full suite green (baseline before this plan: 35 files / 260 tests). If anything is red, do NOT fix it here — report BLOCKED with the failure, its output, and which task's change caused it.

- [ ] **Step 2: Record the human timing follow-up in the report (do not attempt it)**

After the human redeploys with the new pool limit, re-run the baseline measurement from PowerShell:

```bash
1..3 | ForEach-Object { $t = Measure-Command { $r = Invoke-WebRequest -Uri "https://review-well.vercel.app/api/reviewers/public?limit=5" -UseBasicParsing -TimeoutSec 20 }; echo "warm$_ => $($r.StatusCode) in $([math]::Round($t.TotalMilliseconds))ms" }
```

Target: warm samples near 150ms (baseline was 300ms). Report the comparison as pending-human until run.

---

## Self-Review

- **Spec coverage:** connection limit (Task 1: exact value, both env files, pool math preserved in commit/report, log watch in spec Testing) and count removal (Task 2: all three functions, shape preserved) plus verification (Task 3: suite, timings, log watch noted as human follow-up).
- **Placeholder scan:** every step has exact code/commands/paths/expected outputs. No TBD/TODO. The two human follow-ups (Vercel env, prod timing) give exact values and commands.
- **Type consistency:** `{ reviewers, total, hasMore }` used identically in Task 2 steps and tests; `connection_limit=3` identical in script, verification, and example.
