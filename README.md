# Review Well — System Documentation & User Guide

**Review Well** is a cozy academic study-club platform for students. Upload lecture slides (PDF/PPTX), browse public study guides, and keep everything in one personal library. AI flashcards, blurting, and the Pomodoro technique are coming soon.

---

## 1. System Overview & Core Objectives

The platform is a kawaii-themed study club (see `DESIGN.md`) where every reviewer is an upload-backed hub with an inline source viewer, plus social discovery. Study modes (AI flashcards, blurting, Pomodoro) are parked behind `ENABLED_STUDY_MODES` and re-enable with one flip.

* **Authentication & Onboarding:** Secure Google OAuth 2.0 verification paired with an optional read-only Guest browsing mode. First-time users pass through a 3-step onboarding wizard capturing academic identity (School, Program), standing (Year, Major), and visual identity (Avatar, Handle).
* **Decoupled Architecture:** Clean separation between a React frontend and a Node.js/Express backend following the Model-View-Controller (MVC) pattern.
* **Data Persistence:** Powered by PostgreSQL (via Supabase) with Row-Level Security (RLS) ensuring strict tenant isolation.

---

## 2. Key Features & Functional Modules

* **Upload + Reviewer Hub:** Create a reviewer by uploading a PDF or PPTX source file (max 25MB, replaceable with versioning). Each reviewer opens a hub with an inline Source viewer (signed or public file URL).
* **Coming Soon — Study Modes:** AI flashcard decks (rolling limit of **3 generations per 7-day period**), blurting with AI grades (own rolling limit of 5 per window), and a linked Pomodoro timer. Backend, quotas, and UI components are built and tested; only the hub wiring is parked.
* **Social Graph & Sharing:** Follow other student creators, save/bookmark public reviewers, and share reviewers via public/unlisted/private visibility with direct links.
* **Notification Bell Center:** Real-time event tracking and unread counter badges for follows, saves, and new reviewers from followed creators.
* **Guest View-Only Mode:** Unauthenticated visitors can browse public reviewers and read source files; writes redirect to sign-in with a `returnTo` URL.

---

## 3. Technology Stack

* **Frontend:** React, Tailwind CSS (kawaii academic design system — Cream, Cocoa, Blush, Powder, Mint, Butter, Berry; see `DESIGN.md`).
* **Backend:** Node.js, Express (MVC architecture).
* **Database & Security:** PostgreSQL, Supabase RLS, HttpOnly session cookies, and sliding-window rate limiting.
* **Testing Pipeline:** Comprehensive unit, integration, and end-to-end testing utilizing **Vitest**, **Supertest**, and **Playwright**.

---

## 4. Repository Documentation Index

Refer to the individual specification files included in the project root for technical deep dives:
* `DESIGN.md` — UI/UX specification, color palettes, and layout design rules.
* `ARCHITECTURE.md` — System architecture, folder structure, data flow, and testing strategy.
* `SCHEMA.md` — Relational database schema, table definitions, and indexing strategies.
* `SECURITY.md` — Authentication controls, rate-limiting policies, and data compliance standards.
