# Review Well — Security Specification

## 1. Authentication & Session Security

* **Google OAuth 2.0:** Authentication is handled exclusively by Google OAuth, mapping Google subject IDs (`google_id`) directly to internal user records.
* **HttpOnly Session Cookies:** JWT tokens are managed via secure, HttpOnly, SameSite=Strict cookies to mitigate XSS and CSRF vectors.
* **Session Lifecycle & Invalidation:** Tokens include strict expiration limits accompanied by a silent refresh mechanism, with an explicit endpoint to revoke session tokens upon sign-out or account termination.
* **Guest Isolation:** Unauthenticated sessions are restricted strictly to read-only endpoints (`GET /api/reviewers/public`), preventing unauthorized data mutations or access to private drafting spaces.

---

## 2. Authorization & Resource Access Control

* **Row-Level Security (RLS):** Implemented at the Supabase/PostgreSQL database layer to enforce tenant isolation and ensure users can only read or modify their own private reviewers and draft states.
* **Visibility Enforcement:**
  * `public`: Readable by all authenticated users and guests.
  * `unlisted`: Accessible strictly via a unique, non-indexed URL token.
  * `private`: Restricted exclusively to the author ID.
* **Remix Permissions:** Document cloning checks the creator's `allow_remix` boolean flag before duplicating blocks and establishing linkage records.

---

## 3. Rate Limiting & Abuse Prevention

* **Global API Rate Limiting:** Express middleware enforces IP-based rate limiting across all public endpoints using sliding-window algorithms to prevent Denial of Service (DoS) attacks and brute-force scraping.
* **Authentication Throttling:** Strict rate limits applied specifically to login and Google OAuth callback endpoints to block credential stuffing and brute-force attempts.
* **AI Generation Quotas:** Enforces a rolling hard limit of **3 AI document extractions per 7-day period** per user, tracked in the `ai_quotas` table to prevent resource exhaustion or LLM API abuse.
* **Write Operation Thresholds:** Rate limiting applied to reviewer creation, block updates, comment submissions, and social actions (likes/follows) to prevent automated spam and bot manipulation.

---

## 4. Data Protection, Sanitization, & Compliance

* **Payload Validation:** Strict schema validation and sanitization on all incoming JSON block data and form inputs to prevent SQL injection and stored XSS vulnerabilities.
* **Data Portability & Deletion:** GDPR-compliant user data export features (packaging created reviewers and profile telemetry into a structured JSON file) and cascading account deletion protocols.
* **Transport Layer Security (TLS):** All client-server communications are encrypted in transit via forced HTTPS/TLS 1.3.
