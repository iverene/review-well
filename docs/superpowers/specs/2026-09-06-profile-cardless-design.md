# Design: Cardless Profile Page (compact, mobile-first)

Date: 2026-09-06. Approach: restructure in place (no new components).

## 1. Identity row (approved)

No card, border, or shadow anywhere on the page header area. Directly under
the `Profile` page header: a left-aligned row with the avatar at
`h-14 w-14` (`md:h-20 md:w-20` on desktop), the display name beside it at
`text-xl md:text-3xl`, and the school/program/major/yearLevel details beneath
the name as wrapping powder pills (accent graduation-cap icon + one pill per
present field) instead of plain joined text. Same data, alt text, and avatar
fallback (initial) as today. Own profile shows a borderless settings gear
icon button (aria-label "Settings", links to `/settings`) aligned in the
identity row after the name block (`ml-auto self-center`); the Find friends
button is removed entirely.

## 2. Buttons + stats (approved)

Below the identity row, full-width on mobile: own profile previously showed
Find friends + Edit Profile — now only the settings gear (top-right) remains
as the settings entry point. Other profiles keep the Follow button in place.
Beneath: the stats trio (Reviewers / Followers / Following) as plain
text-centered columns with spacing separators only (no top border, no pills),
numbers at `text-lg md:text-xl`, labels unchanged. Followers/Following stay
links to their list pages.

## 3. Collections (approved)

The dead bio block is removed (verified: no schema field, no edit UI, no API
support — the conditional could never render). Tabs row and reviewer tile
grid are unchanged. Final page order: page header → identity row (gear
top-right on own profile) → action buttons (other profiles) → stats trio →
tabs → tile grid.

## Out of scope

No changes to Followers/Following pages, Find Friends page (still reachable
via sidebar/dock), Settings page, tab behavior, tile design, backend, or
design tokens. Existing tests assert names/counts, not layout: no test
changes expected, suite must stay green.
