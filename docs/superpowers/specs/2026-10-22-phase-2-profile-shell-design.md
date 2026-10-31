# Phase 2: Profile pagination and shell fixes

## Intent

Finish the deferred performance and shell work from Phase 1:

- Profile reviewer lists should not load up to 50 items at once.
- The app shell should have one main landmark, usable mobile spacing, a visible
  content scrollbar, and no theme flash on reload.

This phase stays contained. It does not introduce a shared pagination
abstraction or redesign page-level visual treatments.

## Goals

- Paginate both Profile tabs: Reviewers and Saved Reviewers.
- Add a Load more control that appends and deduplicates pages.
- Return real `total` / `hasMore` metadata from the saved-reviewers endpoint.
- Keep exactly one `<main>` landmark in the application shell.
- Remove duplicate horizontal padding between `Layout` and `PageContainer`.
- Prevent the mobile header from covering page content.
- Show a thin scrollbar for the shell's scroll container.
- Apply the stored theme before the first paint.
- Update affected backend and frontend tests.

## Non-goals

- No 404 page or global error boundary.
- No Guide/About copy rewrite.
- No broad visual redesign or page-width system rewrite.
- No shared paged-list hook or migration of Phase 1 lists.
- No database schema changes.

## Constraints

- Preserve existing API response shapes; add pagination metadata alongside
  existing arrays.
- Keep `ReviewerList` and `Notifications` pagination behavior unchanged.
- Keep Phase 1 changes uncommitted unless the user asks for a commit.
- Use TDD for behavior changes.
- Do not run `prisma format`; there are no schema changes in this phase.

## Approaches Considered

1. **Contained changes (chosen)** — Add pagination to the saved endpoint and
   keep page state local to `Profile`. Make targeted shell changes without
   refactoring page wrappers. Lowest regression risk.
2. **Shared pagination abstraction** — Extract a reusable paged-list hook and
   migrate `Profile`, `ReviewerList`, and `Notifications`. Better long-term
   consistency, but reopens working Phase 1 code and increases blast radius.
3. **Minimal shell patch** — Profile pagination plus only the duplicate-main
   and mobile-header fixes. Faster, but leaves the padding, scrollbar, and
   theme-flash issues in place.

The user selected approach 1.

## Design

### Saved-reviewers API

`saveModel.findByUser(userId)` will accept `{ skip = 0, take = 20 }` and return
`{ saves, total }`, using `findMany` and `count` in parallel. Its cache key will
include `skip` and `take`.

`socialController.getSavedReviewers` will use the existing `parsePagination`
helper and return:

```js
{
  reviewers: [...],
  pagination: {
    page,
    limit,
    total,
    hasMore,
  },
}
```

The existing `reviewers` array remains, so older clients keep working.

### Profile lists

`Profile` will keep separate pagination state for the reviewers and saved tabs:

- `page`, `hasMore`, `total`, and `loadingMore` per tab.
- Initial requests use `page=1&limit=20`.
- The own-profile initial load keeps fetching both lists in parallel, matching
  current behavior; other profiles only fetch reviewers.
- Load more requests the next page for the active tab and appends unique items.
- A list resets when the profile id changes.
- The existing skeleton is used while the active list is empty and loading.
- A Load more button renders when `hasMore` is true and is disabled while its
  request is in flight.
- Non-own profiles keep the saved tab hidden.

### Shell and accessibility

- `NavigationShell` owns the only `<main>` element and the
  `id="main-content"` skip-link target.
- `Layout` becomes a plain wrapper: no `role="main"`, no duplicate id, and no
  duplicate page padding. It keeps the outer max width and gutter.
- `PageContainer` keeps `max-w-5xl` and vertical spacing but drops its
  horizontal padding, leaving one gutter from `Layout`.
- `Reviewer`'s inner `<main>` becomes a labelled `<section>`.
- The shell's content area uses `pt-16` so the absolute mobile header cannot
  cover page content.
- The shell's content area always uses `show-scroll`, so its vertical
  scrollbar is visible. Decorative inner scrollbars remain hidden.
- The reviewer-detail scrollbar special case is removed because the shell
  scrollbar is now always visible.

### Theme flash

`index.html` gets a small inline script in `<head>` before the module entry.
It reads `review-well-theme` from local storage and sets
`document.documentElement.dataset.theme` for `dark` or `reading` before paint.
`ThemeProvider` keeps its existing state and effect logic.

## Testing

- Backend model: `saveModel.findByUser` passes `skip`/`take`, returns `total`,
  and caches by page.
- Backend controller: `getSavedReviewers` returns paginated `reviewers` and
  `pagination`.
- Frontend Profile:
  - initial requests include `page=1&limit=20`
  - Load more appends reviewer page 2
  - Load more appends saved page 2
  - duplicate ids are not rendered twice
  - Load more hides when `hasMore` is false
- Shell:
  - one main landmark
  - skip link targets the shell main
  - shell main has the visible-scroll class
- Existing Home, ReviewerList, Notifications, and backend suites stay green.

Theme bootstrap is verified by inspecting the built HTML/source because a
unit test of an inline pre-paint script would test implementation text rather
than behavior.

## Left to the builder

- Exact Tailwind spacing values.
- Whether to extract small local helpers inside `Profile`.
- Test structure and fixture details.
- Whether a follow-up phase should tackle the 404 page, error boundary, copy,
  and broader page-container redesign.
