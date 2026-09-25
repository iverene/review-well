# Home Landing Copy Revision — Design

Date: 2026-09-25
Status: Approved (both sections confirmed by owner)
Direction: A — Study-first

## 1. Goal

Rephrase the logged-out Landing hero + feature trio in `frontend/src/pages/Home.jsx`
to match the upload + study-modes concept. Copy-only change: no layout, class,
route, or behavior changes. CTA targets unchanged.

## 2. Hero (Section 1, approved)

- Eyebrow: `Upload your slides. Study them well.`
- Headline: `Turn lecture slides into study sessions.`
- Subcopy: `Upload a PDF or PPTX, get AI-made flashcards and blurting prompts, and review in focused Pomodoro sprints — all in one cozy study club.`
- CTA primary: `Join the study club` → `/login` (unchanged)
- CTA secondary: `Try public reviewers` → `/reviewer/public` (reworded, target unchanged)

## 3. Feature trio (Section 2, approved)

Same three pastel cards, same order, same decorative glyphs. New titles + copy:

- Card 1 (Blush, `*`): **Upload your slides** — `Drop in a PDF or PPTX and keep every reviewer in one personal library.`
- Card 2 (Mint, `+`): **Study with techniques** — `Flip AI-made flashcards and dump what you remember with blurting prompts.`
- Card 3 (Butter, `~`): **Stay in the zone** — `Review in Pomodoro sprints, track daily focus, and grow a study streak.`

## 4. Out of scope

Guest library view, signed-in desk view, and any structural or behavioral change
to Home. No new endpoints, components, or routes.
