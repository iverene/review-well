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

- Use `public/logo.png` as the favicon and compact brand mark.
- Use `public/word-logo.png` as the primary header wordmark.
- Preserve the wordmark's casual hand-drawn character. Do not replace it with a formal text treatment.
- Use rounded forms and warm brown outlines instead of harsh black rules.
- Use illustrations as meaningful moments: empty states, onboarding, AI results, and gentle welcome areas.
- Keep artwork crisp and visible. Do not darken, blur, or crop the character artwork when it carries meaning.

## 3. Color Palette

Define the visual system with CSS variables so the palette remains consistent:

- **Cream `#FFF7E8`:** primary page and card surface.
- **Cocoa `#604A3A`:** primary text, outlines, and logo-aligned dark tone.
- **Blush `#F6C6D2`:** active tabs, friendly emphasis, and social moments.
- **Powder `#C9E6F2`:** links, information, and calm secondary actions.
- **Mint `#CDE8D2`:** saved, complete, and positive states.
- **Butter `#F9E4A8`:** AI tools, study prompts, and highlights.
- **Berry `#C96A83`:** primary action emphasis and important focus states.

Cream and cocoa form the foundation. Pastels should be used as accents, tags, block headers, illustration details, and selected surfaces. Maintain readable contrast and never communicate state with color alone.

Do not default to a dark interface. Do not use large gradients, floating color orbs, bokeh, or a one-color screen.

## 4. Typography

The supplied wordmark is expressive and hand-drawn, so the surrounding typography should support it rather than compete with it.

- **Display:** a rounded, friendly display face such as Fredoka, Baloo 2, or Nunito ExtraBold for page titles and welcoming moments.
- **Interface:** a warm, highly readable sans such as Nunito, Plus Jakarta Sans, or Atkinson Hyperlegible.
- **Study metadata:** JetBrains Mono for course codes, counts, and compact labels only.

Use friendly weight and generous line height instead of extreme size. Keep text legible on pastel surfaces. Do not use a formal editorial serif as the dominant page-heading style, since it conflicts with the hand-drawn logo personality.

## 5. Shape, Texture, and Components

- Use rounded corners from 10px to 16px for cards, buttons, inputs, avatars, and study blocks.
- Use soft cocoa borders, occasional offset outlines, and tiny sticker-like labels to create a handmade feel.
- Use subtle notebook dots, paper grain, washi-tape strips, and star marks as low-contrast texture.
- Keep decorative elements sparse and anchored to nearby content.
- Reserve cards for repeated content, dialogs, study blocks, and framed tools. Do not nest cards inside cards.
- Keep controls at stable dimensions so icons, labels, and state text never cause layout shifts.
- Use icon plus text for unfamiliar actions, and familiar icons with tooltips for compact tools.

Buttons should feel like friendly stationery labels, not pills floating in space. Primary actions use Berry or Cocoa with clear hover and focus states. Secondary actions use Cream, Powder, or Mint surfaces.

## 6. Header and Navigation

The header should resemble the top of a decorated study notebook:

- Left: `logo.png` icon plus `word-logo.png` wordmark.
- Center or below on workspace pages: a concise page title or reviewer context.
- Right: account controls and the most relevant action.
- Authenticated users see profile, notifications, and creation actions.
- Guests see `Guest - View only` and a clear `Sign in with Google` action.

### Desktop Navigation

Use a friendly sidebar with rounded active markers and small subject-colored icons. The sidebar should feel like labeled tabs in a personal binder, with generous breathing room and no dense enterprise styling.

Authenticated destinations:

- Home
- Browse public reviewers
- My reviewers
- Notifications
- Profile
- Create reviewer

Guests receive browsing destinations only. Do not show creation, editing, notification, or private-profile actions to guests.

### Mobile Navigation

Use a bottom dock with a warm cream surface, rounded upper corners, and clear active markers. The create action can be a visually distinct elevated control for authenticated users. Guests should see public browsing and a compact Google sign-in route instead.

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

## 9. Reviewer Workspace

The workspace should feel like arranging colorful index cards on a clean desk.

- Use a calm Cream canvas with a clear content boundary.
- Give each block type a restrained pastel accent and a simple icon.
- Use Cocoa text and outlines for reliable readability.
- Keep the two-column study layout stable and comfortable on desktop.
- Make add, save, reorder, and export controls obvious.
- Show save feedback as a friendly state: `Saving`, `Saved`, or `Needs attention`.
- Use sticker-like block labels sparingly so the study content stays primary.
- Style the AI extraction action with Butter and a small sparkle detail.
- Keep destructive actions behind confirmation or undo.

## 10. Motion and Feedback

Motion should feel gentle and hand-placed, not hyperactive:

- Welcome content fades in with a short stagger.
- Menus open with a small soft pop from their trigger.
- New study blocks settle into place with a short ease.
- Buttons use subtle press feedback.
- Saved states can briefly show a tiny sparkle or color transition.
- Empty-state illustrations may have a slow, occasional bob if it does not distract.

Respect `prefers-reduced-motion`. Avoid constant floating, exaggerated bouncing, parallax, and motion on every hover.

## 11. Accessibility and Responsive Rules

- Maintain WCAG AA contrast, especially for Cocoa text on pastel backgrounds.
- Provide accessible names and tooltips for icon-only controls.
- Keep keyboard focus visible and rounded to match the component language.
- Keep touch targets at least 44px where practical.
- Ensure long wordmark and button labels wrap or resize without overlap.
- Use stable dimensions for headers, docks, toolbars, cards, and block tiles.
- Never rely on color alone for permissions or status.
- Make `Guest - View only` visible in both text and behavior.
- Test the branded shell at mobile, tablet, and desktop widths.

## 12. Implementation Sequence

1. Establish Cream, Cocoa, Blush, Powder, Mint, Butter, and Berry design tokens.
2. Apply the supplied icon and wordmark consistently across the shell.
3. Redesign login around Google and Guest choices.
4. Build public discovery as the guest's primary destination.
5. Rework desktop and mobile navigation with authenticated and guest states.
6. Restyle reviewer blocks, workspace controls, and save feedback.
7. Add restrained kawaii details, illustration moments, and reduced-motion fallbacks.
8. Validate contrast, responsive layout, guest restrictions, and Google sign-in behavior.
