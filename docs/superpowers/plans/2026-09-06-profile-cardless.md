# Cardless Profile Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Profile's boxed header card with a compact cardless left-aligned layout, keeping all content.

**Architecture:** In-place restructure of `frontend/src/pages/Profile.jsx` only; no new components, no backend changes, existing test mocks and wrappers reused.

**Tech Stack:** React + JSX, Tailwind CSS, Vitest + Testing Library (run `npx vitest run <file>` inside `frontend/`; lint from repo root with `npm run lint --workspace=@review-well/frontend`).

## Global Constraints

- No card, border, or shadow on the profile header area; tabs row and tile grid unchanged.
- Mobile-first sizes with `md:` restoring desktop: avatar `h-14 w-14 md:h-20 md:w-20`, name `text-xl md:text-3xl`, school line `text-xs md:text-sm`, stat numbers `text-lg md:text-xl`.
- Find friends button removed entirely; settings gear icon link (`aria-label="Settings"`, `to="/settings"`) pinned top-right on own profile only.
- Stats trio (Reviewers / Followers / Following) stays with working follower/following links; dead bio block removed.
- Existing suite must stay green; PowerShell: chain with `; if ($?) { ... }`, never `&&`.

---

### Task 1: Cardless identity row with settings gear

**Files:**
- Modify: `frontend/src/pages/Profile.jsx:4,137-187`
- Modify: `frontend/tests/pages/Profile.test.jsx` (append regression test)

**Interfaces:**
- Consumes: `PageHeader`, `PageContainer`, `FollowButton`, existing `renderProfile` wrapper and fixtures.
- Produces: cardless header markup other tasks build on (relative wrapper, gear link, identity row, action row).

- [ ] **Step 1: Write the failing regression test**

Append to the existing `describe('Profile')` block in `frontend/tests/pages/Profile.test.jsx`:

```jsx
it('shows a cardless header with settings gear and no find-friends button', async () => {
  renderProfile('/profile', '/profile')
  await screen.findByText('Me User')
  expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings')
  expect(screen.queryByRole('link', { name: /Find friends/ })).toBeNull()
  expect(screen.queryByText('Your study desk')).toBeNull()
})

it('shows no settings gear on other profiles', async () => {
  renderProfile('/profile/user-9', '/profile/:userId')
  await screen.findByText('Ann Lee')
  expect(screen.queryByRole('link', { name: 'Settings' })).toBeNull()
  expect(screen.getByRole('button', { name: 'Follow' })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/pages/Profile.test.jsx` inside `frontend/`
Expected: FAIL — no `Settings` link exists and `Find friends` still renders

- [ ] **Step 3: Rebuild the header**

Replace the card `<section className="rounded-soft border-2 border-stone bg-paper p-4 mt-5 club-shadow sm:p-8" aria-label="Profile">` block (lines 137-187) with:

```jsx
{/* Profile header (cardless) */}
<div className="relative mt-5" aria-label="Profile">
  {isOwnProfile && (
    <Link
      to="/settings"
      aria-label="Settings"
      title="Settings"
      className="absolute right-0 top-0 inline-flex items-center justify-center rounded-soft border-2 border-stone bg-paper p-2.5 text-ink hover:bg-powder"
    >
      <SettingsIcon className="h-5 w-5" aria-hidden="true" />
    </Link>
  )}
  <div className="flex items-center gap-4">
    {profile.avatarUrl ? (
      <img
        src={profile.avatarUrl}
        alt={profile.displayName}
        className="h-14 w-14 rounded-full border-2 border-stone object-cover md:h-20 md:w-20"
      />
    ) : (
      <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-stone bg-blush font-display text-xl font-bold text-ink md:h-20 md:w-20 md:text-2xl" aria-hidden="true">
        {profile.displayName?.charAt(0).toUpperCase() || 'U'}
      </div>
    )}
    <div className="min-w-0">
      <h1 className="font-display text-xl font-bold text-ink md:text-3xl">{profile.displayName}</h1>
      {(profile.school || profile.program || profile.major || profile.yearLevel) && (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted md:text-sm">
          <GraduationCap className="h-4 w-4 shrink-0" aria-hidden="true" />
          {[profile.school, profile.program, profile.major, profile.yearLevel].filter(Boolean).join(' • ')}
        </p>
      )}
    </div>
  </div>

  {!isOwnProfile && (
    <div className="mt-4">
      <FollowButton
        userId={profile.id}
        initialFollowing={following}
        initialFollowerCount={followerCount}
        onToggle={handleFollowToggle}
      />
    </div>
  )}
```

Delete the Find friends `<Link>` entirely. Remove `UserPlus` from the lucide-react import on line 4 (nothing else uses it); keep `SettingsIcon` (gear), `GraduationCap` (school line), `Bookmark` and `LibraryBig` (used below). Leave the stats block, bio block, tabs, and grid untouched for Task 2.

- [ ] **Step 4: Run tests and lint to verify**

Run: `npx vitest run tests/pages/Profile.test.jsx` inside `frontend/`
Expected: PASS (existing 5 tests plus the 2 new ones)

Run: `npm run lint --workspace=@review-well/frontend` from repo root.
Expected: no errors (catches the removed `UserPlus` import if left behind)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Profile.jsx frontend/tests/pages/Profile.test.jsx
git commit -m "feat(profile): cardless identity row with settings gear"
```

---

### Task 2: Borderless stats and bio removal

**Files:**
- Modify: `frontend/src/pages/Profile.jsx:189-219` (stats block and bio block from the original file; line numbers shift after Task 1)
- Modify: `frontend/tests/pages/Profile.test.jsx` (bio fixture and assertion)

**Interfaces:**
- Consumes: cardless header markup from Task 1.
- Produces: nothing further (final task).

- [ ] **Step 1: Write the failing bio-absence test**

Add `bio: 'I love soil science.'` to the `ownProfile` fixture in `frontend/tests/pages/Profile.test.jsx`, then append to the `describe('Profile')` block:

```jsx
it('never renders a bio section', async () => {
  renderProfile('/profile', '/profile')
  await screen.findByText('Me User')
  expect(screen.queryByText('I love soil science.')).toBeNull()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/pages/Profile.test.jsx` inside `frontend/`
Expected: FAIL — the bio text renders inside the old card block

- [ ] **Step 3: Restyle stats and delete the bio block**

Replace the stats `<div className="mt-5 flex gap-1 border-t-2 border-stone pt-3 sm:gap-3">` with `<div className="mt-5 flex gap-1 sm:gap-3">` (drop the top border; keep the three columns, counts, labels, and follower/following links exactly as-is). Change each stat number span from `font-display text-xl font-bold text-ink` to `font-display text-lg font-bold text-ink md:text-xl`. Delete the entire `{profile.bio && (...)}` block (the About heading and paragraph). Do not touch tabs, panels, or the tile grid.

- [ ] **Step 4: Run full verification**

Run: `npx vitest run tests/pages/Profile.test.jsx tests/pages/Followers.test.jsx` inside `frontend/`
Expected: PASS

Run: `npm run lint --workspace=@review-well/frontend` from repo root.
Expected: no errors

Run: `npm run build --workspace=@review-well/frontend` from repo root.
Expected: build succeeds

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Profile.jsx frontend/tests/pages/Profile.test.jsx
git commit -m "feat(profile): borderless stats and remove dead bio block"
```

---

## Self-Review

**1. Spec coverage:** Section 1 (identity row sizes, gear top-right, Find friends removed) → Task 1. Section 2 (buttons for other profiles, borderless stats trio with links, numbers `text-lg md:text-xl`) → Tasks 1–2. Section 3 (bio removed with evidence, tabs/grid unchanged) → Task 2. Out-of-scope items (Followers pages, Find Friends page, Settings, backend) are touched by no task.

**2. Placeholder scan:** All steps carry exact file paths, class strings, commands, and test code. No TBD/TODO, no "similar to Task N", no undefined references (`renderProfile`, fixtures, mocks all pre-exist; `SettingsIcon`, `FollowButton`, `GraduationCap` already imported).

**3. Type consistency:** Test helper names, route paths (`/settings`, `/profile/me/followers`), and aria labels match the existing suite and implementation.
