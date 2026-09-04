# Review Well — System Documentation & User Guide

**Review Well** is a structured academic study guide and reviewer generation platform designed for students. It bridges the gap between raw lecture transcripts and publication-ready, beautifully formatted two-column reference sheets.

---

## 1. System Overview & Core Objectives

The platform provides an institutional archival brutalist workspace that enforces publication precision, structured modular layouts, and seamless social collaboration. 

* **Authentication & Onboarding:** Secure Google OAuth 2.0 verification paired with an optional read-only Guest browsing mode. First-time users pass through a 3-step onboarding wizard capturing academic identity (School, Program), standing (Year, Major), and visual identity (Avatar, Handle).
* **Decoupled Architecture:** Clean separation between a React frontend and a Node.js/Express backend following the Model-View-Controller (MVC) pattern.
* **Data Persistence:** Powered by PostgreSQL (via Supabase) with Row-Level Security (RLS) ensuring strict tenant isolation.

---

## 2. Key Features & Functional Modules

* **Google Docs-Inspired Workspace:** Ergonomic toolbar layout featuring a streamlined menu (`File, Edit, View, Insert, Format`) and customized tools for building strict two-column A4 review sheets with modular academic components (*Main Title Block*, *Topic Header Banners*, *Sub-Topic Banners*, and *Content Blocks*).
* **AI Slide Extraction:** Upload PDF or PPTX lecture files (max 25MB) to automatically extract key terms and definitions into structured blocks. Enforces a rolling hard limit of **3 generations per 7-day period** per user.
* **Social Graph & Remixing:** Follow other student creators, save/bookmark public reviewers, and fork/clone study guides into your own workspace using the creator's remix permission toggle with automated attribution tagging (*"Remixed from [Author]"*).
* **Notification Bell Center:** Real-time event tracking and unread counter badges for follows, saves, and document remixes.
* **A4 PDF Export & Watermarking:** Client-side vector rendering ensuring automated page numbering (`Page X`) alongside the tamper-evident watermark: `"Made with Review Well"`.

---

## 3. Technology Stack

* **Frontend:** React, Tailwind CSS (Archival Brutalist design system; *Inter* font and rounded cards are strictly prohibited).
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
