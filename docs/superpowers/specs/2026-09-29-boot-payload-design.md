# Boot Payload Design

Date: 2026-09-29
Status: Approved (all sections)

## Problem

Cold start loads too much: `logo.png` is 1.3MB yet renders at 64–96px and
sits in the service-worker precache, `character-waving.png` is 300KB, the
main JS bundle is 252KB with no vendor splitting, and 4 Google Font families
block rendering. Measured 2026-09-29 from `frontend/public`, `src/assets`,
and `dist/assets`.

## Goal

Cut 1.5MB+ off the critical boot path with no visible or behavioral change.
First of three performance sub-projects (next: API latency, then
reviewer/PDF open). Out of scope here: the 510KB Reviewer chunk, the 1.2MB
PDF worker (both lazy-loaded, belong to sub-project 3), and font
self-hosting.

## Images

- Resize `frontend/public/logo.png` from 1080px (1.3MB) to 256px (~30KB).
  Still 4× its largest render, so no visible change.
- Compress `frontend/src/assets/character-waving.png` from 300KB to ~80KB
  (quantized PNG, same dimensions).
- Keep both filenames: precache, favicon, login, splash, and announcement
  art slim down with zero code changes.
- Acceptance: logo under 50KB, character under 120KB, PNG dimensions
  verified by header read, full frontend suite green, and screenshot verification of both renders (login logo, announcement illustration) against pre-change captures.

## JS Bundle and Fonts

- Split vendor code out of the main bundle with Rollup `manualChunks`
  (react, react-dom, react-router-dom into one long-cacheable chunk) in
  `frontend/vite.config.js`. Repeat visits re-download only changed app
  code. Also clears the build's chunk-size warning.
- Fonts: trim the Google Fonts request in `frontend/index.html` to families
  actually referenced in code (verify by search; Fredoka/Nunito/JetBrains
  Mono expected, Poppins dropped only if unreferenced). No self-hosting.
- Acceptance: `npm run build` shows a separate vendor chunk and a smaller
  main bundle, no unstyled-font flash on landing or desk (visual check),
  full frontend suite green, eslint clean, and screenshot verification of landing/desk typography against pre-change captures.

## Testing

- No new unit tests (binary assets and build config are verified by
  measurement, not mocks): assert file sizes, PNG dimensions, build output
  chunk list, and the green suite.
- Manual visual pass: login logo crisp, announcement illustration unchanged,
  landing/desk typography identical.

