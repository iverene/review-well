# Design: Name-Only Page Headers, Home Hero, Unified Page Spacing

Date: 2026-09-04. Approach: shared `PageHeader` + shared page container.

## 1. Name-only headers (approved)

New shared component `frontend/src/components/common/PageHeader.jsx` rendering a
single `<h1>` (`font-display text-4xl font-bold text-ink`). No eyebrow kicker,
no subtext. Every page replaces its header block with `<PageHeader title="…" />`.

Fixed title map: Home, Profile, My Reviewers, Public Reviewers,
Reviewers from the same course, Reviewer, Find Friends, Followers, Following,
Notifications, Create, Settings, About, Contact, Privacy Policy,
Terms and Conditions, Guide. Dynamic pages use the fixed name (Reviewer detail
shows "Reviewer", any Profile shows "Profile"). Excluded: Workspace
(fullscreen), Login, Onboarding (auth flows, no header today). In-page
error/empty states and tab labels are untouched.

## 2. Logged-in Home hero (approved)

Top-to-bottom: `PageHeader "Home"` → hero row (waving character image left,
greeting right, vertically centered, character slightly smaller for a compact
row) → right-aligned "New Reviewer" button row (current accent style,
full-width on mobile) → existing sections unchanged. Greeting:
"Small steps every day turn into big wins — what are we reviewing today,
{name}?" Logged-out Landing and guest list views are untouched.

## 3. Unified page spacing (approved)

Every page root uses one shared container:
`mx-auto w-full max-w-5xl px-4 md:px-6`, replacing the mix of `max-w-4xl`,
full-width, `space-y-8`/`space-y-10`. Shell desktop top padding is trimmed so
content starts closer to the header bar; mobile gutters and bottom-dock
clearance are unchanged. Workspace stays fullscreen and excluded.

## Out of scope

No changes to block rendering, PDF export, auth, backend, or design tokens.
No new header variants. Future pages adopt `PageHeader` + the shared container.
