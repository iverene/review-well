# Review Well — System Documentation & User Guide

**Review Well** is a cozy academic study-club platform for students. Upload lecture slides (PDF/PPTX) and study them in a reviewer hub with three modes: an AI-generated flashcard deck, blurting (free-recall with AI grading), and a linked Pomodoro timer.

---

## 1. System Overview & Core Objectives

The platform is a kawaii-themed study club (see `DESIGN.md`) where every reviewer is an upload-backed study hub with flashcards, blurting, and focus tools, plus social discovery.

* **Authentication & Onboarding:** Secure Google OAuth 2.0 verification paired with an optional read-only Guest browsing mode. First-time users pass through a 3-step onboarding wizard capturing academic identity (School, Program), standing (Year, Major), and visual identity (Avatar, Handle).
* **Decoupled Architecture:** Clean separation between a React frontend and a Node.js/Express backend following the Model-View-Controller (MVC) pattern.
* **Data Persistence:** Powered by PostgreSQL (via Supabase) with Row-Level Security (RLS) ensuring strict tenant isolation.

---

## 2. Key Features & Functional Modules

* **Upload + Study Hub:** Create a reviewer by uploading a PDF or PPTX source file (max 25MB, replaceable with versioning). Each reviewer opens a study hub with Source (signed or public file URL), Flashcards, Blurting, and a Pomodoro dock.
* **AI Study Decks:** Generate a flashcard deck plus blurting prompts from the uploaded file. Enforces a rolling hard limit of **3 generations per 7-day period** per user; blurting AI grades have their own rolling limit (5 per window).
* **Social Graph & Sharing:** Follow other student creators, save/bookmark public reviewers, and share reviewers via public/unlisted/private visibility with direct links.
* **Notification Bell Center:** Real-time event tracking and unread counter badges for follows, saves, and new reviewers from followed creators.
* **Guest Taste-Only Mode:** Unauthenticated visitors can browse public reviewers and try flashcards/blurting in React state only (zero writes); writes redirect to sign-in with a `returnTo` URL.

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
