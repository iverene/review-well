# Deploying Review Well on Vercel

Two separate Vercel projects: one for the frontend, one for the backend.
Separate projects are required because the frontend is a static Vite site
while the backend is a stateful Express API (sessions, Passport, Prisma).

## 1. Backend project (`review-well-api`)

1. Vercel → Add New → Project → import `review-well` → set **Root Directory** to `backend`.
2. Framework preset: **Other**. Build command is already set in `backend/vercel.json`
   (`npx prisma generate`); no output directory needed.
3. Add these **Environment Variables** (Production + Preview):
   - `DATABASE_URL` — Supabase pooler URL (port `6543`) with `?pgbouncer=true` appended
   - `SESSION_SECRET` — long random string (generate a fresh one, do not reuse dev)
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - `FRONTEND_URL` — your frontend URL, e.g. `https://review-well.vercel.app`
   - `BACKEND_URL` — this backend URL, e.g. `https://review-well-api.vercel.app`
   - `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_STORAGE_BUCKET`
   - `RESEND_API_KEY`, `CONTACT_EMAIL` (optional until contact mail goes live)
   - `NODE_ENV=production`
4. Deploy and copy the backend URL.
5. In **Google Cloud Console → Credentials → OAuth client**, add to Authorized
   redirect URIs: `https://<backend-url>/api/auth/google/callback`.

## 2. Frontend project (`review-well`)

1. Add New → Project → import `review-well` again → set **Root Directory** to `frontend`.
2. Framework preset: **Vite** (defaults are correct, no env vars needed).
3. In `frontend/vercel.json`, replace `REPLACE-WITH-BACKEND-URL` with the backend
   URL from step 1, commit, and redeploy. This proxies `/api/*` to the backend,
   so the app code needs no changes and login cookies stay first-party.
4. Update the backend project's `FRONTEND_URL` if your frontend URL differs.

## 3. Important production notes

- **Sessions are in-memory.** On Vercel's serverless functions each request can
  hit a fresh instance, so users may be logged out at random once traffic spans
  instances. If that happens, the fix is a shared session store (e.g. Upstash
  Redis) — say the word and it will be wired into `backend/config/session.js`.
  For a single-instance host (Render, Railway, Fly) no change is needed.
- **Prisma client**: `backend/vercel.json` regenerates the client on every
  build, so schema changes deploy cleanly. No migration step runs automatically;
  apply schema changes with `npx prisma migrate deploy` (or via Supabase SQL)
  before deploying code that depends on them.
- Pushes to `master` trigger production deploys; preview deployments are
  created for pull requests automatically.
