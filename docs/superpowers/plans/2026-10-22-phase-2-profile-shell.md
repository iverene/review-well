# Phase 2: Profile Pagination and Shell Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Paginate both Profile lists and fix the shell's duplicate main landmark, double gutter, mobile header overlap, hidden content scrollbar, and theme flash.

**Architecture:** Add page metadata to the saved-reviewers model/controller, keep pagination state local to `Profile`, and make targeted shell changes without introducing a shared list abstraction. The shell owns the only `<main>` and scroll container; `Layout` keeps the outer gutter and `PageContainer` drops its duplicate horizontal padding.

**Tech Stack:** React 19, React Router 6, Tailwind, Axios, Vitest, Testing Library, Express, Prisma, Zod.

**Spec:** `docs/superpowers/specs/2026-10-22-phase-2-profile-shell-design.md`

## Global Constraints

- Preserve `reviewers` arrays in API responses; add `pagination` alongside them.
- Do not change `ReviewerList` or `Notifications` pagination behavior.
- No database schema or migration changes.
- Do not run `prisma format`.
- Do not commit; leave Phase 1 and Phase 2 changes uncommitted for user review.
- Use TDD for every behavior change.
- Keep the contained approach: no shared paged-list hook.

## Review Focus

1. A second page containing an id already rendered must not duplicate the card.
2. A response without `pagination` metadata must hide Load more rather than crash.
3. A non-owner profile must not fetch or expose saved reviewers.
4. After removing `Layout`'s `role="main"`, the skip link must still target the one shell `<main>`.
5. Missing or inaccessible local storage must leave the app on the light theme and must not break the pre-paint script.

---

### Task 1: Saved-reviewers API pagination

**Files:**
- Modify: `backend/models/saveModel.js`
- Modify: `backend/controllers/socialController.js`
- Test: `backend/tests/unit/models/saveModel.test.js`
- Test: `backend/tests/unit/controllers/socialController.test.js`

**Interfaces:**
- Consumes: `parsePagination(req.query)` from `backend/utils/pagination.js`
- Produces: `saveModel.findByUser(userId, { skip = 0, take = 20 } = {}) -> Promise<{ saves, total }>`
- Produces: `getSavedReviewers` response `{ reviewers, pagination: { page, limit, total, hasMore } }`

- [x] **Step 1: Write failing model and controller tests**

In `saveModel.test.js`, import `clearAll` from `../../../utils/cache.js`, call it in `beforeEach`, and assert:

```js
mockPrismaInstance.save.findMany.mockResolvedValue([{ reviewer: { id: 'r1' } }])
mockPrismaInstance.save.count.mockResolvedValue(7)

await expect(saveModel.findByUser('user-123', { skip: 20, take: 20 })).resolves.toEqual({
  saves: [{ reviewer: { id: 'r1' } }],
  total: 7,
})
expect(mockPrismaInstance.save.findMany).toHaveBeenCalledWith(
  expect.objectContaining({ where: { userId: 'user-123' }, skip: 20, take: 20 })
)
expect(mockPrismaInstance.save.count).toHaveBeenCalledWith({ where: { userId: 'user-123' } })
```

In `socialController.test.js`, replace the saved-reviewers expectation with a paged request:

```js
const req = createMockRequest({ user: { id: 'user-123' }, query: { page: '2', limit: '10' } })
saveModel.findByUser.mockResolvedValue({ saves: [{ reviewer }, { reviewer: null }], total: 11 })

await getSavedReviewers(req, res)

expect(saveModel.findByUser).toHaveBeenCalledWith('user-123', { skip: 10, take: 10 })
expect(res.json).toHaveBeenCalledWith({
  reviewers: [reviewer],
  pagination: { page: 2, limit: 10, total: 11, hasMore: false },
})
```

- [x] **Step 2: Run tests to verify they fail**

Run in `backend`:

```powershell
npx vitest run tests/unit/models/saveModel.test.js tests/unit/controllers/socialController.test.js --reporter=dot
```

Expected: FAIL because `findByUser` ignores paging and returns an array, and the controller returns no `pagination`.

- [x] **Step 3: Implement model paging**

Change `findByUser` to:

```js
const findByUser = async (userId, { skip = 0, take = 20 } = {}) => {
  return remember(`social:saved:${userId}:${skip}:${take}`, TTL_60_SECONDS, async () => {
    const [saves, total] = await Promise.all([
      prisma.save.findMany({
        where: { userId },
        include: { /* keep the existing reviewer select */ },
        skip,
        take,
      }),
      prisma.save.count({ where: { userId } }),
    ])
    return { saves, total }
  })
}
```

- [x] **Step 4: Implement controller pagination**

`getSavedReviewers` must use `parsePagination`, call `saveModel.findByUser(req.user.id, { skip, take })`, and return:

```js
reviewers: result.saves.map((save) => save.reviewer).filter(Boolean),
pagination: {
  page,
  limit: take,
  total: result.total,
  hasMore: skip + result.saves.length < result.total,
},
```

- [x] **Step 5: Run tests to verify they pass**

Run the same command from Step 2. Expected: PASS.

---

### Task 2: Profile list pagination

**Files:**
- Modify: `frontend/src/pages/Profile.jsx`
- Test: `frontend/tests/pages/Profile.test.jsx`

**Interfaces:**
- Consumes: `GET /api/reviewers/my?page=&limit=`, `GET /api/reviewers/author/:id?page=&limit=`, `GET /api/social/saved?page=&limit=`
- Consumes: response `{ reviewers, pagination?: { hasMore, total } }`
- Produces: accessible buttons named `Load more reviewers` and `Load more saved reviewers`

- [x] **Step 1: Write failing Profile tests**

Update the mock to answer by page and include pagination. Add fixtures for a second reviewer and a second saved reviewer. Add tests that assert:

```js
// initial requests
expect(mockGet).toHaveBeenCalledWith('/api/reviewers/my', expect.objectContaining({
  params: { page: 1, limit: 20 },
}))
expect(mockGet).toHaveBeenCalledWith('/api/social/saved', expect.objectContaining({
  params: { page: 1, limit: 20 },
}))

// reviewers load more, including a duplicate id on page 2
fireEvent.click(await screen.findByRole('button', { name: 'Load more reviewers' }))
expect(await screen.findByText('My Second Guide')).toBeInTheDocument()
expect(screen.getAllByText('My Guide')).toHaveLength(1)
expect(screen.queryByRole('button', { name: 'Load more reviewers' })).toBeNull()

// saved load more
fireEvent.click(screen.getByRole('tab', { name: 'Saved Reviewers' }))
fireEvent.click(await screen.findByRole('button', { name: 'Load more saved reviewers' }))
expect(await screen.findByText('Saved Second Guide')).toBeInTheDocument()

// no pagination metadata
// mock a page with no pagination and assert no Load more button renders
```

Also extend the other-user test with:

```js
expect(mockGet).not.toHaveBeenCalledWith('/api/social/saved', expect.anything())
```

- [x] **Step 2: Run test to verify it fails**

Run in `frontend`:

```powershell
npx vitest run tests/pages/Profile.test.jsx --reporter=dot
```

Expected: FAIL because initial requests omit paging and no Load more controls exist.

- [x] **Step 3: Implement Profile paging state**

Add module-level `PAGE_SIZE = 20` and `appendUnique(previous, incoming)`. Add state for reviewer page/hasMore, saved page/hasMore, and the active loading-more tab. In the profile-change effect, clear both lists and reset both pages/hasMore values before fetching.

Update `fetchLists` so both initial requests send `{ page: 1, limit: PAGE_SIZE }`, use cache keys that include those params, and read `response.pagination?.hasMore`. Keep the existing parallel fetch for own profiles and the empty saved result for other profiles.

Add `loadMore(tab)`:

- Choose the next page from the active tab's page state.
- Use the same endpoint/cache-key/params pattern as the initial request.
- Append via `appendUnique`, update that tab's page/hasMore, and clear the loading state in `finally`.
- On failure, show a toast error and keep the existing list; do not replace the whole profile with the error page.

Render the button below the active grid only when that tab has more:

```jsx
<button type="button" onClick={() => loadMore(activeTab)} disabled={loadingMore === activeTab}>
  {loadingMore === activeTab
    ? 'Loading…'
    : activeTab === 'saved'
      ? 'Load more saved reviewers'
      : 'Load more reviewers'}
</button>
```

- [x] **Step 4: Run test to verify it passes**

Run the Step 2 command. Expected: PASS.

- [x] **Step 5: Run adjacent page tests**

Run:

```powershell
npx vitest run tests/pages/Profile.test.jsx tests/pages/ReviewerList.test.jsx tests/pages/Notifications.test.jsx --reporter=dot
```

Expected: PASS; Phase 1 lists are unchanged.

---

### Task 3: Single main landmark, gutters, mobile spacing, and scrollbar

**Files:**
- Modify: `frontend/src/components/Layout.jsx`
- Modify: `frontend/src/components/layout/NavigationShell.jsx`
- Modify: `frontend/src/components/common/PageContainer.jsx`
- Modify: `frontend/src/pages/Reviewer.jsx`
- Create: `frontend/tests/components/Layout.test.jsx`
- Test: `frontend/tests/components/common/PageContainer.test.jsx`

**Interfaces:**
- Produces: `NavigationShell` renders `<main id="main-content" class="... show-scroll pt-16">`
- Produces: `Layout` renders no `role="main"` and no `id="main-content"`

- [x] **Step 1: Write failing shell tests**

Create `Layout.test.jsx` with a mocked `useAuth` returning `{ error: null, isAuthenticated: false, loading: false, signInWithGoogle: vi.fn() }`. Render `Layout` inside `MemoryRouter` and assert:

```js
const mains = screen.getAllByRole('main')
expect(mains).toHaveLength(1)
expect(mains[0]).toHaveAttribute('id', 'main-content')
expect(mains[0]).toHaveClass('show-scroll')
expect(screen.getByRole('link', { name: 'Skip to main content' }))
  .toHaveAttribute('href', '#main-content')
expect(mains[0]).toContainElement(screen.getByText('page content'))
```

Update `PageContainer.test.jsx` to expect `mx-auto`, `w-full`, `max-w-5xl`, and `pb-10`, and to assert it no longer has `px-4` or `md:px-6`.

- [x] **Step 2: Run tests to verify they fail**

Run in `frontend`:

```powershell
npx vitest run tests/components/Layout.test.jsx tests/components/common/PageContainer.test.jsx --reporter=dot
```

Expected: FAIL because `Layout` still adds a second main landmark and `PageContainer` still has horizontal padding.

- [x] **Step 3: Implement the shell changes**

- `Layout`: remove `role="main"` and `id="main-content"` from its content div. Keep `mx-auto max-w-6xl px-4 py-8 md:px-8`.
- `NavigationShell`: remove `useLocation` and the reviewer-detail special case. Render `<main id="main-content" className="relative flex-1 overflow-y-auto show-scroll pb-24 pt-16 md:pb-0">`.
- `PageContainer`: use `mx-auto w-full max-w-5xl pb-10`.
- `Reviewer`: change the inner `<main className="min-w-0" aria-label="Study hub section">` to `<section className="min-w-0" aria-label="Study hub section">`; close with `</section>`.

- [x] **Step 4: Run tests to verify they pass**

Run the Step 2 command. Expected: PASS.

- [x] **Step 5: Run reviewer and shell-adjacent tests**

Run:

```powershell
npx vitest run tests/components/Layout.test.jsx tests/components/common/PageContainer.test.jsx tests/pages/Reviewer.test.jsx tests/pages/Home.test.jsx --reporter=dot
```

Expected: PASS.

---

### Task 4: Pre-paint theme bootstrap

**Files:**
- Modify: `frontend/index.html`
- Create: `frontend/tests/indexHtml.test.js`

**Interfaces:**
- Produces: inline `<head>` script reads `review-well-theme` and sets `document.documentElement.dataset.theme` for `dark` or `reading` before `/src/main.jsx`

- [x] **Step 1: Write a failing source-order test**

Create `tests/indexHtml.test.js`:

```js
import { readFileSync } from 'node:fs'

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')

it('boots the stored theme before the app module', () => {
  const themeIndex = html.indexOf('review-well-theme')
  const moduleIndex = html.indexOf('/src/main.jsx')

  expect(themeIndex).toBeGreaterThan(-1)
  expect(themeIndex).toBeLessThan(moduleIndex)
  expect(html).toMatch(/try\s*{[\s\S]*localStorage[\s\S]*catch/)
})
```

- [x] **Step 2: Run test to verify it fails**

Run in `frontend`:

```powershell
npx vitest run tests/indexHtml.test.js --reporter=dot
```

Expected: FAIL because `review-well-theme` is not in `index.html`.

- [x] **Step 3: Add the inline bootstrap**

Add this before the module script, inside `<head>`:

```html
<script>
  try {
    const theme = localStorage.getItem('review-well-theme')
    if (theme === 'dark' || theme === 'reading') {
      document.documentElement.dataset.theme = theme
    }
  } catch {
    // Storage can be unavailable; the light theme is the safe default.
  }
</script>
```

- [x] **Step 4: Run the test and verify the built HTML**

Run:

```powershell
npx vitest run tests/indexHtml.test.js --reporter=dot
npm run build
Select-String -Path dist/index.html -Pattern 'review-well-theme','/assets/index-'
```

Expected: test PASS; the theme script appears before the bundled module entry in `dist/index.html`.

---

### Task 5: Full verification

- [x] **Step 1: Run backend tests**

In `backend`:

```powershell
npm test -- --reporter=dot
```

Expected: all existing tests plus the new saved-pagination tests pass.

- [x] **Step 2: Run frontend tests**

In `frontend`:

```powershell
npx vitest run --reporter=dot 2>$null
```

Expected: all suites pass.

- [x] **Step 3: Run lint and production build**

In `frontend`:

```powershell
npm run lint
npm run build
```

Expected: lint clean; build succeeds with only the existing chunk-size warning.

- [x] **Step 4: Check the diff**

From the repo root:

```powershell
git diff --check
git status --short
```

Expected: no whitespace errors; only intended Phase 1/Phase 2 files are modified, plus the new tests and design/plan docs.
