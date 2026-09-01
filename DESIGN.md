# Review Well — UI/UX Design Specification

## 1. Design Philosophy & Visual Language

**Review Well** rejects contemporary, generic SaaS aesthetics ("vibe-coded" minimalism, heavy rounded cards, bright primary drop shadows, and ubiquitous sans-serifs like *Inter*). Instead, it adopts an **Editorial Academic / Archival Brutalist** aesthetic that honors print publishing precision and institutional structure.

* **Typography:** High-contrast editorial serif headings (*Newsreader* or *Lora*), clean neo-grotesque body text (*Plus Jakarta Sans* or *IBM Plex Sans*), and monospaced data figures (*JetBrains Mono*). **Inter is strictly prohibited.**
* **Geometry & Layout:** Crisp 90-degree right angles (`border-radius: 0px` or razor-sharp 2px architectural tokens). Pill buttons, floating rounded cards, and bouncy micro-animations are completely banned.
* **Surface Treatment & Depth:** Matte, tactile paper-like backgrounds (`#FAF8F5` light mode / `#141414` dark mode) utilizing sharp 1px solid borders (`#262626` or `#E5E2DC`) rather than blurred drop shadows.
* **Color System:** Desaturated, earthy institutional tones (warm bone, ink black, sage green, and muted terracotta) inspired by vintage academic archives.

---

## 2. Information Architecture & Navigation Shell

The platform layout adapts fluidly between desktop and mobile viewports while preserving strict structural alignment.

* **Desktop Navigation (Sidebar Layout):**
  * Fixed left vertical rail (240px width) with a 1px right border.
  * Primary links: *Home*, *My Reviewers*, *Profile*, *Notifications*.
  * Pinned bottom element: Full-width rectangular `+ Add Reviewer` primary action button.
* **Mobile Navigation (Bottom Dock Layout):**
  * Fixed bottom navigation dock with high-contrast active state indicators.
  * Center prominence: Elevated square icon button (`+ Add`) breaking the top border plane of the navigation dock.
* **Header Bar:**
  * Left: Dynamic workspace breadcrumb or active document title.
  * Right: Live notification badge for follows and likes, paired with a User Avatar dropdown exposing *Settings* and *About*.

---

## 3. Onboarding & User Flows

* **Authentication Entry:** Low-friction Google Sign-In or a read-only Guest browsing mode.
* **First-Time Profile Wizard:** A sequential 3-step modal appearing immediately after initial Google authentication:
  * *Step 1 — Academic Identity:* Input School and Program/Course with institutional auto-complete.
  * *Step 2 — Standing:* Select Year Level and Major/Specialization.
  * *Step 3 — Visual Identity:* Upload avatar image and set username handle.

---

## 4. The Workspace & Document Engine

The workspace adapts the ergonomic utility of a familiar document toolbar layout, custom-built exclusively for structuring two-column academic study guides rather than general word processing.

* **Top App Bar & Document Title:**
  * Left: Application brand icon, editable document title field, auto-save cloud sync indicator, and a streamlined menu (*File, Edit, View, Insert, Format*).
  * Right: Version history, sharing controls (public, unlisted by link, private), user profile avatar, and the AI extraction panel trigger.
* **Formatting Toolbar (Ergonomic Layout Reference):**
  * Inspired by standard document editor layouts, this toolbar is customized specifically for review creation: Undo/Redo, print, zoom level, paragraph styles (*Heading 1*, *Topic Header*, *Sub-Topic Banner*), font selector family, font size controls, text formatting (*Bold*, *Italic*, text color, and academic highlight colors), table insertion, image embedding, and bullet/numbered lists.
  * Right edge houses the AI extraction tool toggle and export to PDF action.
* **Document Canvas & Grid Engine:**
  * Standard A4 preview canvas enforcing an automated strict **2-column layout**.
  * Modular block insertion for pre-styled academic components: *Main Title Block* (course code, description, semester, exam type, optional icon), *Topic Header Banners*, *Sub-Topic Banners*, and *Content Blocks*.
  * Automated footer pagination rendering `Page X` alongside optional author name and the mandatory watermark: *"Made with Review Well"*.

---

## 5. Social Interactions & Remix UX

* **Long-Press Preview:** On mobile and desktop hover states, interacting with a reviewer triggers an iOS-style preview modal for rapid browsing without full navigation.
* **Remix / Clone Workflow:** Public reviewers configured with remix permissions display a distinct `Clone to Workspace` action button. Cloned documents automatically inherit an immutable footer/header attribution tag: *"Remixed from [Original Author]"*.
