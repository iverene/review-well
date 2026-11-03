# Review Well - Kawaii Academic Study Club

## 1. Core Feeling

Review Well is a cheerful online study club: a cozy place where students collect notes, discover helpful reviewers, and make their own study guides. The interface should feel like opening a favorite notebook at a shared study table.

The visual personality is **kawaii academic**: soft, hand-drawn, rounded, pastel, and encouraging. It should be charming without becoming childish, and organized without becoming institutional. The supplied `logo.png` and `word-logo.png` are the source of truth for this tone.

Every screen should balance three qualities:

- **Cozy:** warm surfaces, gentle contrast, friendly illustrations.
- **Clear:** strong hierarchy, readable study content, predictable controls.
- **Playful:** colorful labels, small expressive details, and rewarding feedback.

Avoid archival brutalism, rigid black-and-white layouts, corporate SaaS polish, purple gradients, neon overload, and decoration that competes with learning.

## 2. Brand Translation

The logo combines a soft cream background, cocoa-brown outlines, a cute student illustration, blush pink details, powder blue accents, and small star-like decorations. The interface should borrow those qualities without turning every surface into an illustration.

- Use `public/logo.png` as the favicon, manifest icon, and offline-page mark; in-app images use the right-sized `public/logo.webp`.
- Use `public/word-logo.webp` (430x112) as the header wordmark; `word-logo.png` is the 1920px source. Give the `<img>` its intrinsic `width`/`height` and the `wordmark` class (the dark theme renders it off-white).
- Preserve the wordmark's casual hand-drawn character. Do not replace it with a formal text treatment.
- Use rounded forms and warm brown outlines instead of harsh black rules.
- Use illustrations as meaningful moments: empty states, onboarding, AI results, and gentle welcome areas.
- Keep artwork crisp and visible. Do not darken, blur, or crop the character artwork when it carries meaning.

## 3. Color Palette

Define the visual system with CSS variables so the palette remains consistent:

- **White `#FFFFFF`:** page and card surface in the light theme, so the pastels and artwork read clean and bright.
- **Cream `#FFF6F3`:** blush-tinted inset for fields, rows, secondary buttons, and hovers.
- **Cocoa `#4A3A30`:** primary text, outlines, and logo-aligned dark tone.
- **Blush `#FAD8E1`:** active tabs, friendly emphasis, and social moments.
- **Powder `#D3EBF7`:** links, information, and calm secondary actions.
- **Peach `#FFE3D3`:** warm companion pastel for card bands and illustrations.
- **Mint `#D3EFDD`:** saved, complete, and positive states.
- **Butter `#FCEDBC`:** AI tools, study prompts, and highlights.
- **Berry `#B04F69`:** primary actions, active tabs and dock item, focus rings. Berry *text* belongs on white or cream only; on a pastel it drops to 3.8–4.3:1, so use Cocoa there.

White and cocoa form the foundation, with Cream for quiet insets. Pastels should be used as accents, tags, headers, illustration details, and selected surfaces. Maintain readable contrast and never communicate state with color alone.

Do not default to a dark interface. Do not use large gradients, floating color orbs, bokeh, or a one-color screen.

### Token roles

Colors live as RGB triplets in `frontend/src/index.css` (light `:root`, `[data-theme='dark']`, `[data-theme='reading']`) and map to Tailwind names in `tailwind.config.js`. Use the role, never a hex literal:

| Token | Light | Role |
| --- | --- | --- |
| `page` | White `#FFFFFF` | The canvas behind everything (body, shell). |
| `paper` | White `#FFFFFF` | Sheets on the page: cards, dialogs, header, dock (set apart by 1px Stone borders and soft shadows). |
| `cream` | `#FFF6F3` | Insets inside a sheet: toolbars, dropzones, hovers. |
| `ink` | Cocoa `#4A3A30` | Body text, headings, icons. |
| `muted` | `#6B5A4F` | Secondary text and labels. |
| `accent` | Berry `#B04F69` | Primary actions, focus, eyebrows, links. |
| `line` | `#9C8579` | Form-field borders (>= 3:1 on `page` and `paper`). |
| `stone` | `#F1E4DE` | Decorative borders, dividers, dashed empties. |
| `blush` / `peach` / `powder` / `mint` / `butter` | pastels | Tags, selected states, feature tints. |

**Contrast rule:** `ink` and `muted` must stay >= 4.5:1 on `page`, `paper`, `cream`, and every pastel; `accent` must be >= 4.5:1 as text on `page`/`paper` and under `paper` button labels; `line` >= 3:1. All three themes currently pass. Re-check any value change with a WCAG contrast calculator before shipping.

## 4. Typography

The hand-drawn wordmark carries the personality; the type around it stays modern, geometric, and calm.

- **Display: Outfit** (500–700) for page titles, section headings, card titles, and welcoming moments. Slight negative tracking (-0.01em).
- **Interface: DM Sans** (400–700) for body text, labels, and controls. It tops out at 700, so `font-bold` is the heaviest interface weight.
- **Study metadata: DM Mono** for course codes, counts, and compact labels only.

Loaded from Google Fonts in `frontend/index.html`; mapped to Tailwind `font-display`, `font-sans`, and `font-mono`. Use friendly weight and generous line height instead of extreme size.

## 5. Shape, Texture, and Components

- **Soft Pop shapes:** pill (`rounded-full`) buttons, tabs, chips, single-line fields, and the dock; 26px cards (`rounded-club`), 32px banners and dialogs, 16px for textareas and inner rows (`rounded-soft`).
- Use 1px Stone borders and soft, blurred, Berry-tinted shadows (`shadow-soft`, `shadow-soft-sm`, `shadow-float` for the dock). Never offset or hard shadows.
- Use subtle notebook dots, paper grain, washi-tape strips, and star marks as low-contrast texture.
- Keep decorative elements sparse and anchored to nearby content.
- Reserve cards for repeated content, dialogs, study tools, and framed tools. Do not nest cards inside cards.
- Keep controls at stable dimensions so icons, labels, and state text never cause layout shifts.
- Use icon plus text for unfamiliar actions, and familiar icons with tooltips for compact tools.

Buttons should feel like friendly stationery labels, not pills floating in space. Primary actions use Berry with Paper labels; secondary actions are Paper with a Stone border; quiet actions are borderless; destructive actions use a Blush tint with Berry text.

### Shared components

Build screens from `frontend/src/components/common` instead of hand-assembling classes:

- **Button** (`primary`, `secondary`, `quiet`, `danger`; sizes `sm`, `md`, `lg`, `icon`). Pass `to` for router links and `href` for plain links. Use `buttonClasses()` when another component must render its own element.
- **Card:** a Paper sheet with a 26px radius, 1px Stone border, and soft shadow. With `to`, it becomes a whole-card link with a small lift on hover.
- **ReviewerCard** (`components/reviewer`): pastel band (stable colour per course code via `pastelFor`) with the course pill, then title and footer. Use it for every reviewer grid.
- **Tag:** pill labels for course codes (`mono`), visibility (`mint` public, `powder` unlisted, `neutral` private), and small states such as "New".
- **Field** (`Label`, `Input`, `Select`, `Textarea`): uses `line` borders and muted placeholders.
- **Modal:** every dialog. It is a bottom sheet on phones and a centred card from `sm` up. The visible title names it; it traps Tab, closes on Escape or a backdrop press, and returns focus to the trigger. Confirmations pass `role="alertdialog"` and focus the safe choice.
- **Tabs:** a segmented tablist with roving focus and Left/Right/Home/End.
- **EmptyState:** the illustration, a title, one sentence, and a next step. Use it for empty, error, and not-found states; `compact` drops the art for inline sections.
- **Skeleton** and its page variants: they must mirror the final layout.

## 6. Header and Navigation

The header should resemble the top of a decorated study notebook:

- Left: `logo.webp` icon plus `word-logo.webp` wordmark.
- Center or below on reviewer pages: a concise page title or reviewer context.
- Right: account controls and the most relevant action.
- Authenticated users see profile, notifications, and creation actions.
- Guests see a clear Google sign-in action (labelled "Sign in" on phones so the header never wraps; the accessible name stays "Sign in with Google").

### Desktop and Mobile Navigation

One shell for every screen size: a light header (logo and wordmark, search that opens the public library with `?q=`, New reviewer, notifications, account) and a floating pill dock fixed at the bottom centre. The current destination expands into a Berry pill with its label; the others are icons with accessible names. There is no sidebar.

Authenticated destinations:

- Home
- Browse public reviewers
- My reviewers
- Notifications
- Profile
- Create reviewer

Guests receive browsing destinations only. Do not show creation, editing, notification, or private-profile actions to guests.

## 7. Login and Guest Experience

The login screen should present two equally clear choices:

1. **Continue with Google:** full account access for creating, editing, AI extraction, profiles, and social actions.
2. **Continue as Guest:** immediate anonymous access to public study material in view-only mode.

Guest mode is a local browsing state, not a database account and not an authenticated backend session. It may persist across refreshes so the user remains in browsing mode.

Protected routes must continue to require Google authentication. If a guest selects a protected action or route, explain that Google sign-in is required and preserve the intended destination.

Use a small friendly illustration or logo moment on the login page. The layout should be welcoming and compact, not a marketing hero.

## 8. Home and Public Discovery

The first screen should feel like entering the study club, not reading a product pitch. Show the brand, a short invitation to study, and immediate public content.

Public reviewer browsing should include:

- Color-coded course or subject tags.
- Short content previews.
- Author identity and save counts.
- Clear view buttons.
- A cozy empty state using `logo.png` or a supplied illustration.

The public browsing path must work for both guests and Google users. Guest interactions stop at reading: save, follow, create, edit, AI, and notifications remain authenticated-only.

## 9. Reviewer Study Hub

The reviewer detail view is a hub with the Source viewer, all in kawaii tokens:

- Use a calm white page with a minimal reviewer header and no card chrome. Show the course-code tag and an owner-only visibility tag, then the title and description, then an inline details row (creator, assessment, semester, upload date). The details row is visible at every width.
- Put the actions on one dashed rule below the header: Save, Download, and Share; owners also get Edit and Delete, which move into a "More actions" menu on phones.
- **Source viewer:** the uploaded file at full content width. PDFs use the lazy-loaded viewer, PPTX files use a 16:9 Office embed. With no file, owners see an EmptyState that links to upload; everyone else sees a short note.
- **Parked study modes:** Flashcards, Blurting, and the Pomodoro dock are hidden behind `ENABLED_STUDY_MODES` (components, tokens, and tests intact). When re-enabled: Butter accents for the AI deck action and quota states (`decksLeft`); Mint for known/complete states; Powder info surfaces for blurting grades; Mint/Butter companion panel for the dock.
- Guest nudges (`returnTo` links) use Powder surfaces with Cocoa text — never color alone.
- Keep destructive actions (card delete, reviewer delete) behind confirmation.
- Show quota and save feedback as friendly states: `Saving`, `Saved`, or `Needs attention`.

## 10. Motion and Feedback

Motion should feel gentle and hand-placed, not hyperactive:

- Welcome content fades in with a short stagger.
- Menus open with a small soft pop from their trigger.
- New study cards settle into place with a short ease.
- Buttons use subtle press feedback.
- Saved states can briefly show a tiny sparkle or color transition.
- Empty-state illustrations may have a slow, occasional bob if it does not distract.

Respect `prefers-reduced-motion`. Avoid constant floating, exaggerated bouncing, parallax, and motion on every hover.

Timing rules: animate only `transform` and `opacity` (colour fades on hover are fine). Keep durations at or under 250ms with `ease-out-soft` (`cubic-bezier(0.2, 0, 0, 1)`). Entrances use `.club-rise` (220ms). Press feedback is `active:scale-[0.97]`. Looping loaders are the only exception, and they stop under reduced motion.

## 11. Accessibility and Responsive Rules

- Maintain WCAG AA contrast, especially for Cocoa text on pastel backgrounds.
- Provide accessible names and tooltips for icon-only controls.
- Keep keyboard focus visible. Every focusable element gets the global 2px Berry ring with a 2px offset. Visually hidden inputs (such as radio cards) show it on their label with `has-[:focus-visible]:outline-*`.
- Never nest interactive controls (links or buttons) inside another button or link.
- Keep touch targets at least 44px where practical.
- Ensure long wordmark and button labels wrap or resize without overlap.
- Use stable dimensions for headers, docks, toolbars, cards, and study tiles.
- Never rely on color alone for permissions or status.
- Guests can read everything public. Write affordances such as Save send them to `/login?returnTo=<current page>`, and that page survives the Google round trip.
- Test the branded shell at mobile, tablet, and desktop widths.

## 12. Implementation Sequence

1. Establish Cream, Cocoa, Blush, Powder, Mint, Butter, and Berry design tokens.
2. Apply the supplied icon and wordmark consistently across the shell.
3. Redesign login around Google and Guest choices.
4. Build public discovery as the guest's primary destination.
5. Rework desktop and mobile navigation with authenticated and guest states.
6. Restyle the study hub, quota feedback, and save feedback.
7. Add restrained kawaii details, illustration moments, and reduced-motion fallbacks.
8. Validate contrast, responsive layout, guest restrictions, and Google sign-in behavior.
