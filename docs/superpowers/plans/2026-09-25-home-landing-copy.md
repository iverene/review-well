# Home Landing Copy Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Swap the logged-out Landing hero + feature-trio copy in Home.jsx to the approved study-first wording, verified by a new page test.

**Architecture:** Copy-only change to one component (`Landing` in `frontend/src/pages/Home.jsx`); no layout, class, route, or behavior changes. One new test file locks the exact strings.

**Tech Stack:** React + Vite, Vitest + Testing Library, eslint.

## Global Constraints

- Copy strings verbatim from `docs/superpowers/specs/2026-09-25-home-landing-copy-design.md` (eyebrow, headline, subcopy, 3 card titles + bodies, secondary CTA label).
- CTA targets unchanged: primary `/login`, secondary `/reviewer/public`.
- No layout/class/route/behavior changes; guest and signed-in Home views untouched.
- Frontend tests: `npm test` in `frontend/`; eslint clean on touched files.

---

## File Structure

- `frontend/src/pages/Home.jsx` — only the `Landing` const (lines 43–64) changes: 8 string swaps. Everything else untouched.
- `frontend/tests/pages/Home.test.jsx` — new test file owning the copy contract: renders `Home` logged-out (mocked `useAuth` per `Login.test.jsx` pattern) and asserts the 8 new strings + 2 CTA hrefs + absence of the 3 stalest phrases.

### Task 1: Landing copy swap + copy-lock test

**Files:**
- Create: `frontend/tests/pages/Home.test.jsx`
- Modify: `frontend/src/pages/Home.jsx:43-64` (strings only)

**Interfaces:**
- Consumes: `useAuth` mock shape from `frontend/tests/pages/Login.test.jsx:8-25` (`{ isAuthenticated: false, isGuest: false, loading: false }`), `MemoryRouter` render pattern.
- Produces: passing copy-contract test; no other task depends on this.

- [ ] **Step 1: Write the failing test**

```jsx
// frontend/tests/pages/Home.test.jsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import Home from '../../src/pages/Home'
import { useAuth } from '../../src/contexts/AuthContext'

vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

describe('Home landing copy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isGuest: false,
      loading: false,
    })
  })

  it('sells upload-first studying in the hero', () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    expect(screen.getByText('Upload your slides. Study them well.')).toBeTruthy()
    expect(screen.getByText('Turn lecture slides into study sessions.')).toBeTruthy()
    expect(screen.getByText('Upload a PDF or PPTX, get AI-made flashcards and blurting prompts, and review in focused Pomodoro sprints — all in one cozy study club.')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Join the study club' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Try public reviewers' })).toHaveAttribute('href', '/reviewer/public')
  })

  it('frames the trio around the three study pillars', () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    expect(screen.getByText('Upload your slides')).toBeTruthy()
    expect(screen.getByText('Drop in a PDF or PPTX and keep every reviewer in one personal library.')).toBeTruthy()
    expect(screen.getByText('Study with techniques')).toBeTruthy()
    expect(screen.getByText('Flip AI-made flashcards and dump what you remember with blurting prompts.')).toBeTruthy()
    expect(screen.getByText('Stay in the zone')).toBeTruthy()
    expect(screen.getByText('Review in Pomodoro sprints, track daily focus, and grow a study streak.')).toBeTruthy()
  })

  it('contains no workspace-era wording', () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    expect(screen.queryByText('Make studying feel a little more like you.')).toBeNull()
    expect(screen.queryByText('Make it yours')).toBeNull()
    expect(screen.queryByText('Tiny wins count')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/pages/Home.test.jsx` in `frontend/`
Expected: FAIL — `Unable to find an element with the text: Upload your slides. Study them well.` (old copy still rendered).

- [ ] **Step 3: Write minimal implementation**

In `frontend/src/pages/Home.jsx`, change only these strings (nothing else):
1. `Your cozy corner for better notes` → `Upload your slides. Study them well.`
2. `Make studying feel a little more like you.` → `Turn lecture slides into study sessions.`
3. `Browse bright study guides, collect the good bits, and build a review space that makes sense to your brain.` → `Upload a PDF or PPTX, get AI-made flashcards and blurting prompts, and review in focused Pomodoro sprints — all in one cozy study club.`
4. `Browse public guides` → `Try public reviewers`
5. `Find your flow` card: title stays `Find your flow`; body stays `Discover public reviewers made by fellow students and start with the topics you need most.` (no change)
6. `Make it yours` → `Study with techniques`; body `Turn lecture notes into a colorful, structured guide that feels natural to revisit.` → `Flip AI-made flashcards and dump what you remember with blurting prompts.`
7. Card 1 title `Find your flow` → `Upload your slides`; body → `Drop in a PDF or PPTX and keep every reviewer in one personal library.`
8. `Tiny wins count` → `Stay in the zone`; body `Keep the hard stuff approachable with clear blocks, gentle prompts, and a little delight.` → `Review in Pomodoro sprints, track daily focus, and grow a study streak.`

Note: old card 1 (`Find your flow` / Discover...) is dropped and old card 2's `+` glyph slot takes the techniques card; keep the three pastel surfaces and `*`/`+`/`~` glyphs in order.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/pages/Home.test.jsx` in `frontend/`
Expected: PASS (3/3). Then run the full frontend suite once: `npm test` in `frontend/`
Expected: all PASS (if the default thread pool flakes page tests on this machine, re-run with `npx vitest run --pool=forks --maxWorkers=2 --minWorkers=2` and record which command was green).

- [ ] **Step 5: Commit**

```bash
git add frontend/tests/pages/Home.test.jsx frontend/src/pages/Home.jsx
git commit -m "feat: rephrase home landing to upload-first study concept"
```
