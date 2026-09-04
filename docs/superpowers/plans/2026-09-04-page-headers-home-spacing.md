# Page Headers, Home Hero, Unified Spacing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every page header with a name-only `PageHeader`, rebuild the logged-in Home hero, and unify all page containers at `max-w-5xl` with trimmed desktop top padding.

**Architecture:** Two new presentational components (`PageHeader`, `PageContainer`) in `frontend/src/components/common/`; each page swaps its header block and root container class. No backend, routing, or data-flow changes.

**Tech Stack:** React + JSX, Tailwind CSS, Vitest + Testing Library (tests live in `frontend/tests/`, run with `npm test --workspace=@review-well/frontend` from repo root or `npm test` inside `frontend/`).

## Global Constraints

- PageHeader renders exactly one `<h1>` with classes `font-display text-4xl font-bold text-ink` and no kicker, icon, or subtext — one line each, exact values.
- Shared container class is exactly `mx-auto w-full max-w-5xl px-4 pb-10 md:px-6` — copied verbatim, no per-page width overrides.
- Header-vs-content boundary: kicker/description lines attached to page titles are removed; in-content identity blocks (reviewer doc card title + course description, profile card avatar + name + school) stay, minus their kicker lines.
- Fixed titles: Home, Profile, My Reviewers, Public Reviewers, Reviewers from the same course, Reviewer, Find Friends, Followers, Following, Notifications, Create, Settings, About, Contact, Privacy Policy, Terms and Conditions, Guide.
- Untouched: logged-out Landing, guest Home list, Workspace (fullscreen), Login, Onboarding, all loading skeletons, error/empty states, tab labels.
- Settings onboarding variant keeps its conditional title (`Complete your profile` when `location.state?.onboarding`, else `Settings`).
- Verify with `npx vitest run <file>` inside `frontend/` and `npm run lint --workspace=@review-well/frontend` from repo root after every task.

---

### Task 1: PageHeader + PageContainer components

**Files:**
- Create: `frontend/src/components/common/PageHeader.jsx`
- Create: `frontend/src/components/common/PageContainer.jsx`
- Create: `frontend/tests/components/common/PageHeader.test.jsx`
- Create: `frontend/tests/components/common/PageContainer.test.jsx`

**Interfaces:**
- Consumes: nothing (standalone presentational components).
- Produces: `PageHeader({ title })` rendering an h1; `PageContainer({ children, className })` rendering a div with the shared container class plus any extra `className`. Later tasks import both via `../components/common/PageHeader` and `../components/common/PageContainer`.

- [ ] **Step 1: Write the failing PageHeader test**

```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import PageHeader from '../../../src/components/common/PageHeader'

describe('PageHeader', () => {
  it('renders only the page name as a level-one heading', () => {
    render(<PageHeader title="Home" />)
    const heading = screen.getByRole('heading', { name: 'Home', level: 1 })
    expect(heading).toBeInTheDocument()
    expect(heading.tagName).toBe('H1')
    expect(heading).toHaveClass('font-display', 'text-4xl', 'font-bold', 'text-ink')
  })
})
```

- [ ] **Step 2: Write the failing PageContainer test**

```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import PageContainer from '../../../src/components/common/PageContainer'

describe('PageContainer', () => {
  it('wraps children in the shared page container', () => {
    render(<PageContainer><p>child content</p></PageContainer>)
    const child = screen.getByText('child content')
    expect(child.parentElement).toHaveClass('mx-auto', 'w-full', 'max-w-5xl', 'px-4', 'pb-10', 'md:px-6')
  })

  it('merges an extra className without dropping the shared classes', () => {
    render(<PageContainer className="space-y-8"><p>extra class child</p></PageContainer>)
    const child = screen.getByText('extra class child')
    expect(child.parentElement).toHaveClass('max-w-5xl', 'space-y-8')
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/components/common/PageHeader.test.jsx tests/components/common/PageContainer.test.jsx` inside `frontend/`
Expected: FAIL with "Failed to resolve import ... PageHeader" (components do not exist yet)

- [ ] **Step 4: Write minimal implementations**

```jsx
const PageHeader = ({ title }) => (
  <h1 className="font-display text-4xl font-bold text-ink">{title}</h1>
)

export default PageHeader
```

```jsx
const PageContainer = ({ children, className = '' }) => (
  <div className={`mx-auto w-full max-w-5xl px-4 pb-10 md:px-6${className ? ` ${className}` : ''}`}>{children}</div>
)

export default PageContainer
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/components/common/PageHeader.test.jsx tests/components/common/PageContainer.test.jsx` inside `frontend/`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/common/PageHeader.jsx frontend/src/components/common/PageContainer.jsx frontend/tests/components/common/PageHeader.test.jsx frontend/tests/components/common/PageContainer.test.jsx
git commit -m "feat: add shared PageHeader and PageContainer"
```

---

### Task 2: Library pages (ReviewerList, FindFriends, Followers, Notifications)

**Files:**
- Modify: `frontend/src/pages/ReviewerList.jsx:40-41`
- Modify: `frontend/src/pages/FindFriends.jsx:45-49`
- Modify: `frontend/src/pages/Followers.jsx:36-42`
- Modify: `frontend/src/pages/Notifications.jsx:105-118`
- Modify: `frontend/tests/pages/FindFriends.test.jsx` (append kicker-absence assertion)

**Interfaces:**
- Consumes: `PageHeader`, `PageContainer` from Task 1.
- Produces: no new exports; pages render the same content under name-only headers.

- [ ] **Step 1: Extend FindFriends test to lock the name-only header**

Append to the existing `describe('FindFriends')` block in `frontend/tests/pages/FindFriends.test.jsx`:

```jsx
it('shows a name-only header without the old subtext', async () => {
  render(<MemoryRouter><FindFriends /></MemoryRouter>)
  expect(await screen.findByRole('heading', { name: 'Find Friends', level: 1 })).toBeInTheDocument()
  expect(screen.queryByText('Discover classmates, follow their study guides, and grow your circle.')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/pages/FindFriends.test.jsx` inside `frontend/`
Expected: FAIL — heading is still `Find friends` (lowercase f) and the subtext still renders

- [ ] **Step 3: Swap headers and containers in all four pages**

ReviewerList.jsx: replace the root `<section className="space-y-6 pb-8">` with `<PageContainer className="space-y-6">` (closing tag likewise) and replace the header `<div>` block with `<PageHeader title={title} />`. Delete the kicker `<p>` (`Your library` / `Community library`) and the description `<p className="mt-2 text-muted">`. Add imports for `PageHeader` and `PageContainer`.

FindFriends.jsx: replace root `<div className="mx-auto max-w-3xl pb-10">` with `<PageContainer>`, replace the `<h1>` (lines 46-48) with `<PageHeader title="Find Friends" />`, delete the subtext `<p className="mt-2 text-muted">Discover classmates…</p>`.

Followers.jsx: replace root `<div className="mx-auto max-w-2xl pb-10">` with `<PageContainer>`, replace the `<h1>` block (icon + `{title}`) with `<PageHeader title={title} />`. Keep the Back to profile link. Remove the now-unused `Users` import if nothing else uses it.

Notifications.jsx: replace inner `<div className="mx-auto max-w-2xl px-4 py-8">` with `<PageContainer>` (keep the outer `min-h-screen bg-paper` div) and replace the header block with:

```jsx
<div className="mb-6 flex items-center justify-between gap-4">
  <PageHeader title="Notifications" />
  {notifications.some((n) => !n.isRead) && (
    <button onClick={handleMarkAllRead} className="shrink-0 text-sm text-muted hover:text-ink">
      Mark all as read
    </button>
  )}
</div>
```

Add `PageHeader` / `PageContainer` imports in each file.

- [ ] **Step 4: Run tests and lint to verify**

Run: `npx vitest run tests/pages/FindFriends.test.jsx tests/pages/Followers.test.jsx tests/pages/Notifications.test.jsx` inside `frontend/`
Expected: PASS. Then run `npm run lint --workspace=@review-well/frontend` from repo root.
Expected: no errors (catches unused `Users` / `BookOpen` / `LibraryBig` imports if left behind)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/ReviewerList.jsx frontend/src/pages/FindFriends.jsx frontend/src/pages/Followers.jsx frontend/src/pages/Notifications.jsx frontend/tests/pages/FindFriends.test.jsx
git commit -m "feat: name-only headers and shared container on library pages"
```

---

### Task 3: Reviewer detail + Profile pages

**Files:**
- Modify: `frontend/src/pages/Reviewer.jsx:190,267-269`
- Modify: `frontend/src/pages/Profile.jsx:132,149-152`

**Interfaces:**
- Consumes: `PageHeader`, `PageContainer` from Task 1.
- Produces: no new exports.

- [ ] **Step 1: Write failing assertions for the fixed headers**

Append to `frontend/tests/pages/Reviewer.test.jsx` (check its existing axios/AuthContext mock setup at the top of the file and reuse it; the test below assumes a `reviewer` object and the same render wrapper the file already uses):

```jsx
it('shows a fixed Reviewer header above the document card', async () => {
  render(<MemoryRouter><Reviewer /></MemoryRouter>)
  expect(await screen.findByRole('heading', { name: 'Reviewer', level: 1 })).toBeInTheDocument()
  expect(screen.queryByText('Study guide')).not.toBeInTheDocument()
})
```

Append to the existing describe block in `frontend/tests/pages/Profile.test.jsx` (reuse that file's mocks and render wrapper):

```jsx
it('shows a fixed Profile header without the kicker', async () => {
  render(<MemoryRouter><Profile /></MemoryRouter>)
  expect(await screen.findByRole('heading', { name: 'Profile', level: 1 })).toBeInTheDocument()
  expect(screen.queryByText('Your study desk')).not.toBeInTheDocument()
  expect(screen.queryByText('Study buddy')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/pages/Reviewer.test.jsx tests/pages/Profile.test.jsx` inside `frontend/`
Expected: FAIL — no `Reviewer` / `Profile` level-one heading exists yet

- [ ] **Step 3: Apply the header and container changes**

Reviewer.jsx: change root `<div className="w-full pb-10">` to `<PageContainer>` (closing tag likewise) and insert `<PageHeader title="Reviewer" />` as its first child. In the header card, delete the kicker line `<p className="flex items-center gap-2 font-mono …"><BookOpen … /> Study guide</p>` but keep `<h1>{reviewer.title}</h1>`, the course-description paragraph, and all meta/visibility controls. Remove the `BookOpen` import only if nothing else in the file uses it.

Profile.jsx: change root `<div className="mx-auto max-w-4xl pb-10">` to `<PageContainer>` and insert `<PageHeader title="Profile" />` as its first child (above the profile card section). Delete the kicker `<p className="font-mono …">{isOwnProfile ? 'Your study desk' : 'Study buddy'}</p>`. Keep the avatar, display-name h1, school line, stats, tabs, and lists exactly as-is.

- [ ] **Step 4: Run tests and lint to verify**

Run: `npx vitest run tests/pages/Reviewer.test.jsx tests/pages/Profile.test.jsx` inside `frontend/`
Expected: PASS. Then run `npm run lint --workspace=@review-well/frontend` from repo root.
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Reviewer.jsx frontend/src/pages/Profile.jsx frontend/tests/pages/Reviewer.test.jsx frontend/tests/pages/Profile.test.jsx
git commit -m "feat: name-only headers and shared container on Reviewer and Profile"
```

---

### Task 4: Static and form pages (About, Contact, Privacy, Terms, Guide, Settings, Create)

**Files:**
- Modify: `frontend/src/pages/About.jsx:15-28`
- Modify: `frontend/src/pages/Contact.jsx:38-39,58-63`
- Modify: `frontend/src/pages/Privacy.jsx:9-10`
- Modify: `frontend/src/pages/Terms.jsx:9-11`
- Modify: `frontend/src/pages/Guide.jsx:5-11`
- Modify: `frontend/src/pages/Settings.jsx:94-102`
- Modify: `frontend/src/pages/Create.jsx:55-69`

**Interfaces:**
- Consumes: `PageHeader`, `PageContainer` from Task 1.
- Produces: no new exports. Existing `Legal.test.jsx` and `Settings.test.jsx` assertions (headings `Privacy Policy`, `Terms and Conditions`, `Settings`) must keep passing unchanged.

- [ ] **Step 1: Run the existing legal/settings tests as the baseline**

Run: `npx vitest run tests/pages/Legal.test.jsx tests/pages/Settings.test.jsx tests/pages/Contact.test.jsx` inside `frontend/`
Expected: PASS before changes

- [ ] **Step 2: Swap headers and containers in all seven pages**

About.jsx: replace root `<div className="mx-auto max-w-3xl pb-10">` with `<PageContainer>`; replace the hero `<section>` block (logo image + kicker + h1 + intro paragraph) with `<PageHeader title="About" />`. Keep the feature grid below unchanged.

Contact.jsx (both branches): replace each `<div className="mx-auto max-w-2xl pb-10">` with `<PageContainer>` and each `<h1>Contact</h1>` with `<PageHeader title="Contact" />`. In the authed branch delete the intro paragraph (`Questions, ideas, or a study-club story…`). Keep the sign-in card and the form exactly as-is.

Privacy.jsx: replace root `<div className="mx-auto max-w-2xl pb-10">` with `<PageContainer>` and the `<h1>` with `<PageHeader title="Privacy Policy" />`. Terms.jsx: same with `<PageHeader title="Terms and Conditions" />` (also drop the stray blank line at line 10).

Guide.jsx: replace root `<section className="mx-auto max-w-2xl py-8">` with `<PageContainer className="py-8">` and the icon `<h1>` with `<PageHeader title="Guide" />`. Keep the Back to desk link and all numbered sections. Remove the now-unused `BookOpen` import.

Settings.jsx: replace root `<div className="mx-auto max-w-2xl pb-10">` with `<PageContainer>`; replace the conditional `<h1>` with `<PageHeader title={location.state?.onboarding ? 'Complete your profile' : 'Settings'} />`; delete the onboarding helper paragraph (`Add your academic information…`). Keep the form below unchanged.

Create.jsx: replace root `<div className="mx-auto max-w-4xl pb-6">` with `<PageContainer>`; replace the icon/kicker/h1/subtext header block (lines 60-69) with `<PageHeader title="Create" />`. Keep the Back to desk link and the form exactly as-is. Remove the now-unused `BookOpen` import.

Add `PageHeader` / `PageContainer` imports in each file.

- [ ] **Step 3: Run tests and lint to verify**

Run: `npx vitest run tests/pages/Legal.test.jsx tests/pages/Settings.test.jsx tests/pages/Contact.test.jsx` inside `frontend/`
Expected: PASS. Then run `npm run lint --workspace=@review-well/frontend` from repo root.
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/About.jsx frontend/src/pages/Contact.jsx frontend/src/pages/Privacy.jsx frontend/src/pages/Terms.jsx frontend/src/pages/Guide.jsx frontend/src/pages/Settings.jsx frontend/src/pages/Create.jsx
git commit -m "feat: name-only headers and shared container on static pages"
```

---

### Task 5: Logged-in Home hero

**Files:**
- Modify: `frontend/src/pages/Home.jsx:102`
- Create: `frontend/tests/pages/Home.test.jsx`

**Interfaces:**
- Consumes: `PageHeader`, `PageContainer` from Task 1; existing `characterWaving` asset import stays.
- Produces: no new exports. Guest branch (line 97) and `Landing` are untouched.

- [ ] **Step 1: Write the failing Home hero test**

```jsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import Home from '../../src/pages/Home'

const { authState } = vi.hoisted(() => ({
  authState: { user: { id: 'user-1', displayName: 'Ann Lee' }, isAuthenticated: true, isGuest: false },
}))

const mockGet = vi.hoisted(() => vi.fn())

vi.mock('axios', () => ({
  default: { get: mockGet },
}))

vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => authState,
}))

beforeEach(() => {
  mockGet.mockReset()
  mockGet.mockImplementation((url) => {
    if (url === '/api/reviewers/my') return Promise.resolve({ data: { reviewers: [] } })
    return Promise.resolve({ data: { reviewers: [] } })
  })
})

describe('Home hero', () => {
  it('shows the Home header, greeting hero, and right-aligned New reviewer button', async () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Home', level: 1 })).toBeInTheDocument()
    expect(await screen.findByText(/Small steps every day turn into big wins/)).toBeInTheDocument()
    expect(screen.getByText(/what are we reviewing today, Ann/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /New reviewer/ })).toBeInTheDocument()
    expect(screen.queryByText('Your study desk')).not.toBeInTheDocument()
    expect(screen.queryByText('Good to see you, Ann')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/pages/Home.test.jsx` inside `frontend/`
Expected: FAIL — no `Home` heading or greeting exists yet

- [ ] **Step 3: Rebuild the logged-in hero**

Replace the header `<div className="flex flex-wrap items-end justify-between gap-4">…</div>` block (line 102) with:

```jsx
<PageHeader title="Home" />
<div className="flex items-center gap-4">
  <img src={characterWaving} alt="Waving student illustration" className="h-20 w-24 shrink-0 object-contain object-left" />
  <p className="text-lg font-semibold leading-snug text-ink">Small steps every day turn into big wins — what are we reviewing today{user?.displayName?.split(' ')[0] ? `, ${user.displayName.split(' ')[0]}` : ''}?</p>
</div>
<div className="flex justify-end">
  <Link to="/create" className="flex w-full items-center justify-center gap-2 rounded-soft border-2 border-accent bg-accent px-4 py-3 text-sm font-extrabold text-paper hover:-translate-y-0.5 sm:w-auto"><Plus className="h-4 w-4" aria-hidden="true" /> New reviewer</Link>
</div>
```

Replace the logged-in root `<div className="space-y-10 pb-8">` with `<PageContainer className="space-y-8">` (closing tag likewise). Keep the sections, loading skeletons, and `ErrorAlert` exactly as-is. Add the `PageHeader` / `PageContainer` imports.

- [ ] **Step 4: Run test and lint to verify**

Run: `npx vitest run tests/pages/Home.test.jsx` inside `frontend/`
Expected: PASS. Then run `npm run lint --workspace=@review-well/frontend` from repo root.
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Home.jsx frontend/tests/pages/Home.test.jsx
git commit -m "feat: rebuild Home hero with name-only header and greeting"
```

---

### Task 6: Trim shell top padding + full verification

**Files:**
- Modify: `frontend/src/components/layout/NavigationShell.jsx:65`

**Interfaces:**
- Consumes: nothing new. Produces: tighter desktop spacing for all pages at once.

- [ ] **Step 1: Trim the desktop top padding**

In `frontend/src/components/layout/NavigationShell.jsx` line 65, change `md:pt-24` to `md:pt-16` in the `<main>` className. Mobile `pt-20`, `pb-24`/`md:pb-0`, and the `show-scroll` logic stay exactly as-is.

- [ ] **Step 2: Run the full frontend suite, lint, and build**

Run: `npx vitest run` inside `frontend/`
Expected: all tests PASS (82 pre-existing plus the new PageHeader, PageContainer, and Home tests)

Run: `npm run lint --workspace=@review-well/frontend` from repo root.
Expected: no errors

Run: `npm run build --workspace=@review-well/frontend` from repo root.
Expected: build succeeds

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/layout/NavigationShell.jsx
git commit -m "style: tighten desktop top padding in app shell"
```

---

## Self-Review

**1. Spec coverage:** Section 1 (name-only headers + title map) → Tasks 1–4. Fixed-name rule for dynamic pages → Task 3 (Reviewer/Profile keep content cards minus kickers). Section 2 (Home hero, greeting, button row, logged-out untouched) → Task 5. Section 3 (shared container, shell trim, mobile unchanged, Workspace excluded) → Tasks 1–4, 6. Out-of-scope items (backend, PDF, auth, tokens) are not touched by any task.

**2. Placeholder scan:** Every step contains exact file paths, line numbers, class strings, and runnable commands. No TBD/TODO. No "similar to Task N" — repeated swaps spell out each page's edits. No undefined references — `PageHeader`/`PageContainer` props are defined in Task 1 before use.

**3. Type consistency:** `PageHeader({ title })`, `PageContainer({ children, className })` signatures are identical in Task 1 definitions and all consuming tasks. Test import paths match the `tests/**` layout from `vitest.config.js` (`tests/components/common/…`, `tests/pages/…`).
