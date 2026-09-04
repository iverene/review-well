# Deploying Review Well

Split setup: the **frontend on Vercel** (static site) and the **backend on Render**
(persistent Node process, which sessions require).

## 1. Backend on Render (`review-well-api`)

1. Render → New → **Web Service** → connect the `review-well` repo.
2. Set **Root Directory** to `backend`, runtime **Node**.
3. Build Command: `npm install && npx prisma generate`
   Start Command: `npm start`
4. Add these **Environment Variables**:
   - `DATABASE_URL` — Supabase pooler URL (port `6543`) with `?pgbouncer=true` appended
   - `SESSION_SECRET` — fresh long random string (do not reuse dev)
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - `FRONTEND_URL` — your Vercel frontend URL, e.g. `https://review-well.vercel.app`
   - `BACKEND_URL` — this Render URL, e.g. `https://review-well-api.onrender.com`
   - `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_STORAGE_BUCKET`
   - `RESEND_API_KEY`, `CONTACT_EMAIL` (optional until contact mail goes live)
   - `NODE_ENV=production`
5. Deploy and copy the `https://<app>.onrender.com` URL.
6. In **Google Cloud Console → Credentials → OAuth client**, add to Authorized
   redirect URIs: `https://<app>.onrender.com/api/auth/google/callback`.
7. Heads-up: Render's free tier sleeps when idle, so the first request after a
   pause takes ~30–60s to wake the service. Paid instances stay warm.

## 2. Frontend on Vercel (`review-well`)

1. Vercel → Add New → Project → import `review-well` → set **Root Directory**
   to `frontend`. Framework preset: **Vite** (defaults are correct, no env vars needed).
2. In `frontend/vercel.json`, replace `REPLACE-WITH-BACKEND-URL` with the Render
   URL from step 1, commit, and redeploy. This proxies `/api/*` to Render, so
   the app code needs no changes and login cookies stay first-party.
3. If your frontend URL differs from step 1, update the backend's `FRONTEND_URL`.

## 3. Important production notes

- **Database schema changes** are never applied automatically. After changing
  `backend/prisma/schema.prisma`, run `npx prisma migrate deploy` (pointed at
  production) or apply the SQL in Supabase before deploying dependent code.
- Pushes to `master` trigger production deploys on both hosts; Vercel creates
  preview deployments for pull requests automatically.
- Because Render runs one persistent process, express-session works with no
  extra store. (Only move the backend to serverless functions if you also add
  a shared session store such as Upstash Redis.)
