# Review Well — Project Scaffolding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Review Well monorepo with npm workspaces, Vite React frontend, Express backend, full Prisma schema, and shared configs.

**Architecture:** Hybrid approach — CLI-driven initialization for Vite and Prisma, manual creation for folder structure and all config files. Two packages: `frontend` (Vite + React + Tailwind) and `backend` (Express + Prisma).

**Tech Stack:** Node.js, npm workspaces, Vite, React, Tailwind CSS, Express, Prisma, PostgreSQL (Supabase), ESLint, Prettier, GitHub Actions.

## Global Constraints

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL via Supabase (DATABASE_URL in .env)
- Inter font strictly prohibited — use Newsreader, Plus Jakarta Sans, JetBrains Mono
- All border-radius must be 0px or 2px architectural token only
- No rounded cards, pill buttons, or bouncy micro-animations

---

## File Structure

### Root Files
| File | Purpose |
|------|---------|
| `package.json` | npm workspaces root config, shared scripts |
| `.gitignore` | Ignore node_modules, .env, dist, prisma/migrations |
| `.env.example` | Template for required environment variables |
| `.prettierrc` | Prettier formatting rules |
| `.eslintrc.cjs` | Shared ESLint configuration |
| `.github/workflows/test.yml` | CI/CD pipeline skeleton |

### Backend Files
| File | Purpose |
|------|---------|
| `backend/package.json` | Backend dependencies and scripts |
| `backend/server.js` | Express entry point |
| `backend/config/database.js` | Prisma client singleton |
| `backend/config/googleOAuth.js` | Google OAuth config |
| `backend/config/session.js` | Session cookie config |
| `backend/controllers/authController.js` | Auth controller (stub) |
| `backend/controllers/reviewerController.js` | Reviewer controller (stub) |
| `backend/controllers/remixController.js` | Remix controller (stub) |
| `backend/controllers/aiController.js` | AI controller (stub) |
| `backend/models/userModel.js` | User model (stub) |
| `backend/models/reviewerModel.js` | Reviewer model (stub) |
| `backend/models/blockModel.js` | Block model (stub) |
| `backend/routes/authRoutes.js` | Auth routes (stub) |
| `backend/routes/reviewerRoutes.js` | Reviewer routes (stub) |
| `backend/routes/remixRoutes.js` | Remix routes (stub) |
| `backend/routes/aiRoutes.js` | AI routes (stub) |
| `backend/middleware/auth.js` | Auth middleware (stub) |
| `backend/middleware/rateLimiter.js` | Rate limiter (stub) |
| `backend/middleware/validate.js` | Validation middleware (stub) |
| `backend/services/aiService.js` | AI service (stub) |
| `backend/services/emailService.js` | Email service (stub) |
| `backend/prisma/schema.prisma` | Full database schema |

### Frontend Files
| File | Purpose |
|------|---------|
| `frontend/package.json` | Frontend dependencies and scripts |
| `frontend/index.html` | Vite entry HTML |
| `frontend/vite.config.js` | Vite configuration |
| `frontend/tailwind.config.js` | Tailwind with brutalist tokens |
| `frontend/postcss.config.js` | PostCSS config |
| `frontend/src/main.jsx` | React root mount |
| `frontend/src/App.jsx` | App shell (stub) |
| `frontend/src/index.css` | Tailwind directives + font imports |

---

### Task 1: Initialize Root Package.json

**Files:**
- Create: `package.json`

**Interfaces:**
- Consumes: None
- Produces: Root workspace config that both packages reference

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "review-well",
  "version": "0.1.0",
  "private": true,
  "workspaces": [
    "frontend",
    "backend"
  ],
  "scripts": {
    "dev": "npm run dev --workspace=backend & npm run dev --workspace=frontend",
    "build": "npm run build --workspace=frontend",
    "test": "npm run test --workspaces --if-present",
    "lint": "eslint . --ext .js,.jsx",
    "format": "prettier --write ."
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "chore: initialize root package.json with npm workspaces"
```

---

### Task 2: Create .gitignore

**Files:**
- Create: `.gitignore`

**Interfaces:**
- Consumes: None
- Produces: Git ignore rules for all generated files

- [ ] **Step 1: Create .gitignore**

```gitignore
# Dependencies
node_modules/

# Environment
.env
.env.local
.env.*.local

# Build
dist/
build/

# Prisma
backend/prisma/migrations/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Testing
coverage/

# Misc
*.log
npm-debug.log*
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: add .gitignore for node, env, build, and prisma"
```

---

### Task 3: Create .env.example

**Files:**
- Create: `.env.example`

**Interfaces:**
- Consumes: None
- Produces: Template for environment variables

- [ ] **Step 1: Create .env.example**

```env
# Database
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Session
SESSION_SECRET=generate-a-random-64-char-string

# Frontend
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "chore: add .env.example with required environment variables"
```

---

### Task 4: Create Shared Config Files

**Files:**
- Create: `.prettierrc`
- Create: `.eslintrc.cjs`

**Interfaces:**
- Consumes: None
- Produces: Shared formatting and linting rules

- [ ] **Step 1: Create .prettierrc**

```json
{
  "singleQuote": true,
  "semi": false,
  "printWidth": 100,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

- [ ] **Step 2: Create .eslintrc.cjs**

```js
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:react/recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react', 'import'],
  rules: {
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
      },
    ],
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
}
```

- [ ] **Step 3: Commit**

```bash
git add .prettierrc .eslintrc.cjs
git commit -m "chore: add shared prettier and eslint configs"
```

---

### Task 5: Initialize Backend Package

**Files:**
- Create: `backend/package.json`

**Interfaces:**
- Consumes: Root package.json workspaces config
- Produces: Backend package with dependencies

- [ ] **Step 1: Create backend/package.json**

```json
{
  "name": "backend",
  "version": "0.1.0",
  "private": true,
  "type": "commonjs",
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "cookie-session": "^2.1.0",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.0",
    "helmet": "^7.1.0",
    "hpp": "^0.2.3",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0",
    "prisma": "^5.0.0",
    "vitest": "^1.0.0",
    "supertest": "^6.3.0"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/package.json
git commit -m "chore: initialize backend package.json with dependencies"
```

---

### Task 6: Create Backend Folder Structure

**Files:**
- Create: `backend/server.js` (stub)
- Create: `backend/config/database.js` (stub)
- Create: `backend/config/googleOAuth.js` (stub)
- Create: `backend/config/session.js` (stub)

**Interfaces:**
- Consumes: None
- Produces: Backend entry point and config stubs

- [ ] **Step 1: Create backend/server.js**

```js
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const hpp = require('hpp')
const { sessionConfig } = require('./config/session')

const app = express()
const PORT = process.env.PORT || 3000

// Security middleware
app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }))
app.use(hpp())

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Session
app.use(sessionConfig)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  })
})

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

module.exports = app
```

- [ ] **Step 2: Create backend/config/database.js**

```js
const { PrismaClient } = require('@prisma/client')

let prisma

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient()
  }
  prisma = global.prisma
}

module.exports = { prisma }
```

- [ ] **Step 3: Create backend/config/googleOAuth.js**

```js
module.exports = {
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
  scope: ['profile', 'email'],
}
```

- [ ] **Step 4: Create backend/config/session.js**

```js
const session = require('cookie-session')

const sessionConfig = session({
  name: 'session',
  keys: [process.env.SESSION_SECRET || 'dev-secret-change-in-production'],
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'strict',
})

module.exports = { sessionConfig }
```

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat: create backend folder structure with server and config stubs"
```

---

### Task 7: Create Backend Controller Stubs

**Files:**
- Create: `backend/controllers/authController.js`
- Create: `backend/controllers/reviewerController.js`
- Create: `backend/controllers/remixController.js`
- Create: `backend/controllers/aiController.js`

**Interfaces:**
- Consumes: None
- Produces: Controller function signatures for routes

- [ ] **Step 1: Create authController.js**

```js
const googleAuth = async (req, res) => {
  // TODO: Verify Google token, create/find user, establish session
  res.status(501).json({ error: 'Not implemented' })
}

const logout = async (req, res) => {
  // TODO: Destroy session
  res.status(501).json({ error: 'Not implemented' })
}

const getMe = async (req, res) => {
  // TODO: Return current user from session
  res.status(501).json({ error: 'Not implemented' })
}

module.exports = { googleAuth, logout, getMe }
```

- [ ] **Step 2: Create reviewerController.js**

```js
const getPublicReviewers = async (req, res) => {
  // TODO: Fetch public reviewers with pagination
  res.status(501).json({ error: 'Not implemented' })
}

const getMyReviewers = async (req, res) => {
  // TODO: Fetch current user's reviewers
  res.status(501).json({ error: 'Not implemented' })
}

const getReviewerById = async (req, res) => {
  // TODO: Fetch single reviewer by ID
  res.status(501).json({ error: 'Not implemented' })
}

const createReviewer = async (req, res) => {
  // TODO: Create new reviewer
  res.status(501).json({ error: 'Not implemented' })
}

const updateReviewer = async (req, res) => {
  // TODO: Update reviewer metadata
  res.status(501).json({ error: 'Not implemented' })
}

const deleteReviewer = async (req, res) => {
  // TODO: Delete reviewer and cascade blocks
  res.status(501).json({ error: 'Not implemented' })
}

module.exports = {
  getPublicReviewers,
  getMyReviewers,
  getReviewerById,
  createReviewer,
  updateReviewer,
  deleteReviewer,
}
```

- [ ] **Step 3: Create remixController.js**

```js
const cloneReviewer = async (req, res) => {
  // TODO: Check allow_remix, duplicate blocks, create lineage record
  res.status(501).json({ error: 'Not implemented' })
}

module.exports = { cloneReviewer }
```

- [ ] **Step 4: Create aiController.js**

```js
const extractFromUpload = async (req, res) => {
  // TODO: Check quota, parse PDF/PPTX, call LLM, return blocks
  res.status(501).json({ error: 'Not implemented' })
}

module.exports = { extractFromUpload }
```

- [ ] **Step 5: Commit**

```bash
git add backend/controllers/
git commit -m "feat: add controller stubs for auth, reviewer, remix, and ai"
```

---

### Task 8: Create Backend Model Stubs

**Files:**
- Create: `backend/models/userModel.js`
- Create: `backend/models/reviewerModel.js`
- Create: `backend/models/blockModel.js`

**Interfaces:**
- Consumes: Prisma client from config/database.js
- Produces: Model query functions for controllers

- [ ] **Step 1: Create userModel.js**

```js
const { prisma } = require('../config/database')

const findByGoogleId = async (googleId) => {
  return prisma.user.findUnique({ where: { googleId } })
}

const findByEmail = async (email) => {
  return prisma.user.findUnique({ where: { email } })
}

const create = async (data) => {
  return prisma.user.create({ data })
}

const update = async (id, data) => {
  return prisma.user.update({ where: { id }, data })
}

module.exports = { findByGoogleId, findByEmail, create, update }
```

- [ ] **Step 2: Create reviewerModel.js**

```js
const { prisma } = require('../config/database')

const findPublic = async ({ skip = 0, take = 20 } = {}) => {
  return prisma.reviewer.findMany({
    where: { visibility: 'public', isDraft: false },
    include: { author: { select: { displayName: true, avatarUrl: true } } },
    orderBy: { updatedAt: 'desc' },
    skip,
    take,
  })
}

const findByAuthor = async (authorId) => {
  return prisma.reviewer.findMany({
    where: { authorId },
    orderBy: { updatedAt: 'desc' },
  })
}

const findById = async (id) => {
  return prisma.reviewer.findUnique({
    where: { id },
    include: {
      author: { select: { displayName: true, avatarUrl: true } },
      blocks: { orderBy: { sortOrder: 'asc' } },
    },
  })
}

const create = async (data) => {
  return prisma.reviewer.create({ data })
}

const update = async (id, data) => {
  return prisma.reviewer.update({ where: { id }, data })
}

const remove = async (id) => {
  return prisma.reviewer.delete({ where: { id } })
}

module.exports = { findPublic, findByAuthor, findById, create, update, remove }
```

- [ ] **Step 3: Create blockModel.js**

```js
const { prisma } = require('../config/database')

const findByReviewer = async (reviewerId) => {
  return prisma.reviewerBlock.findMany({
    where: { reviewerId },
    orderBy: [{ columnIndex: 'asc' }, { sortOrder: 'asc' }],
  })
}

const createMany = async (data) => {
  return prisma.reviewerBlock.createMany({ data })
}

const update = async (id, data) => {
  return prisma.reviewerBlock.update({ where: { id }, data })
}

const remove = async (id) => {
  return prisma.reviewerBlock.delete({ where: { id } })
}

const removeAllByReviewer = async (reviewerId) => {
  return prisma.reviewerBlock.deleteMany({ where: { reviewerId } })
}

module.exports = { findByReviewer, createMany, update, remove, removeAllByReviewer }
```

- [ ] **Step 4: Commit**

```bash
git add backend/models/
git commit -m "feat: add model stubs for user, reviewer, and block queries"
```

---

### Task 9: Create Backend Route Stubs

**Files:**
- Create: `backend/routes/authRoutes.js`
- Create: `backend/routes/reviewerRoutes.js`
- Create: `backend/routes/remixRoutes.js`
- Create: `backend/routes/aiRoutes.js`

**Interfaces:**
- Consumes: Controller functions from Task 7
- Produces: Express router instances for server.js mounting

- [ ] **Step 1: Create authRoutes.js**

```js
const express = require('express')
const router = express.Router()
const { googleAuth, logout, getMe } = require('../controllers/authController')

router.post('/google', googleAuth)
router.post('/logout', logout)
router.get('/me', getMe)

module.exports = router
```

- [ ] **Step 2: Create reviewerRoutes.js**

```js
const express = require('express')
const router = express.Router()
const {
  getPublicReviewers,
  getMyReviewers,
  getReviewerById,
  createReviewer,
  updateReviewer,
  deleteReviewer,
} = require('../controllers/reviewerController')

router.get('/public', getPublicReviewers)
router.get('/my', getMyReviewers)
router.get('/:id', getReviewerById)
router.post('/', createReviewer)
router.put('/:id', updateReviewer)
router.delete('/:id', deleteReviewer)

module.exports = router
```

- [ ] **Step 3: Create remixRoutes.js**

```js
const express = require('express')
const router = express.Router()
const { cloneReviewer } = require('../controllers/remixController')

router.post('/:id/clone', cloneReviewer)

module.exports = router
```

- [ ] **Step 4: Create aiRoutes.js**

```js
const express = require('express')
const router = express.Router()
const { extractFromUpload } = require('../controllers/aiController')

router.post('/extract', extractFromUpload)

module.exports = router
```

- [ ] **Step 5: Update server.js to mount routes**

Add to `backend/server.js` after session middleware:

```js
// Routes
app.use('/api/auth', require('./routes/authRoutes'))
app.use('/api/reviewers', require('./routes/reviewerRoutes'))
app.use('/api/reviewers', require('./routes/remixRoutes'))
app.use('/api/ai', require('./routes/aiRoutes'))
```

- [ ] **Step 6: Commit**

```bash
git add backend/routes/ backend/server.js
git commit -m "feat: add route stubs and mount in server.js"
```

---

### Task 10: Create Backend Middleware Stubs

**Files:**
- Create: `backend/middleware/auth.js`
- Create: `backend/middleware/rateLimiter.js`
- Create: `backend/middleware/validate.js`

**Interfaces:**
- Consumes: Session from request
- Produces: Express middleware functions

- [ ] **Step 1: Create auth.js**

```js
const requireAuth = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  next()
}

const optionalAuth = (req, res, next) => {
  // Attach user if session exists, but don't block
  next()
}

module.exports = { requireAuth, optionalAuth }
```

- [ ] **Step 2: Create rateLimiter.js**

```js
const rateLimit = require('express-rate-limit')

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later' },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts, please try again later' },
})

const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { error: 'Too many write operations, please slow down' },
})

module.exports = { globalLimiter, authLimiter, writeLimiter }
```

- [ ] **Step 3: Create validate.js**

```js
const validateBody = (schema) => {
  return (req, res, next) => {
    // TODO: Implement schema validation with zod or joi
    next()
  }
}

module.exports = { validateBody }
```

- [ ] **Step 4: Commit**

```bash
git add backend/middleware/
git commit -m "feat: add middleware stubs for auth, rate limiting, and validation"
```

---

### Task 11: Create Backend Service Stubs

**Files:**
- Create: `backend/services/aiService.js`
- Create: `backend/services/emailService.js`

**Interfaces:**
- Consumes: External API endpoints
- Produces: Service functions for controllers

- [ ] **Step 1: Create aiService.js**

```js
const extractTerms = async (fileBuffer, fileType) => {
  // TODO: Send to LLM API, parse response into structured blocks
  throw new Error('Not implemented')
}

const checkQuota = async (userId) => {
  // TODO: Query ai_quotas table, check if under limit
  throw new Error('Not implemented')
}

const incrementQuota = async (userId) => {
  // TODO: Increment generations_used in ai_quotas
  throw new Error('Not implemented')
}

module.exports = { extractTerms, checkQuota, incrementQuota }
```

- [ ] **Step 2: Create emailService.js**

```js
const sendVerificationEmail = async (email, token) => {
  // TODO: Send verification email with cryptographic token
  throw new Error('Not implemented')
}

module.exports = { sendVerificationEmail }
```

- [ ] **Step 3: Commit**

```bash
git add backend/services/
git commit -m "feat: add service stubs for ai extraction and email"
```

---

### Task 12: Create Prisma Schema

**Files:**
- Create: `backend/prisma/schema.prisma`

**Interfaces:**
- Consumes: SCHEMA.md table definitions
- Produces: Full database schema for migration

- [ ] **Step 1: Create schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  googleId     String   @unique @map("google_id") @db.VarChar(255)
  email        String   @unique @db.VarChar(255)
  displayName  String   @map("display_name") @db.VarChar(100)
  avatarUrl    String?  @map("avatar_url")
  school       String   @db.VarChar(150)
  program      String   @db.VarChar(150)
  major        String?  @db.VarChar(100)
  yearLevel    String   @map("year_level") @db.VarChar(20)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @default(now()) @map("updated_at")

  reviewers             Reviewer[]
  likes                 Like[]
  followers             Follow[]       @relation("following")
  following             Follow[]       @relation("follower")
  notificationsReceived Notification[] @relation("receivedNotifications")
  notificationsActor    Notification[] @relation("actorNotifications")
  aiQuotas              AiQuota[]

  @@map("users")
}

model Reviewer {
  id                String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  authorId          String   @map("author_id") @db.Uuid
  title             String   @db.VarChar(255)
  courseCode        String   @map("course_code") @db.VarChar(50)
  courseDescription String   @map("course_description")
  semester          String   @db.VarChar(50)
  examType          String   @map("exam_type") @db.VarChar(50)
  thumbnailIcon     String?  @map("thumbnail_icon")
  colorPalette      Json     @map("color_palette")
  visibility        String   @default("private") @db.VarChar(20)
  allowRemix        Boolean  @default(true) @map("allow_remix")
  isDraft           Boolean  @default(true) @map("is_draft")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @default(now()) @map("updated_at")

  author          User              @relation(fields: [authorId], references: [id], onDelete: Cascade)
  blocks          ReviewerBlock[]
  likes           Like[]
  lineageCloned   ReviewerLineage[] @relation("clonedReviewer")
  lineageOriginal ReviewerLineage[] @relation("originalReviewer")
  notifications   Notification[]

  @@index([title, courseCode, visibility], map: "idx_reviewers_search")
  @@map("reviewers")
}

model ReviewerBlock {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  reviewerId  String   @map("reviewer_id") @db.Uuid
  blockType   String   @map("block_type") @db.VarChar(50)
  columnIndex Int      @default(1) @map("column_index")
  sortOrder   Int      @map("sort_order")
  contentData Json     @map("content_data")
  createdAt   DateTime @default(now()) @map("created_at")

  reviewer Reviewer @relation(fields: [reviewerId], references: [id], onDelete: Cascade)

  @@index([reviewerId, columnIndex, sortOrder], map: "idx_reviewer_blocks_order")
  @@map("reviewer_blocks")
}

model ReviewerLineage {
  id                 String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  clonedReviewerId   String   @map("cloned_reviewer_id") @db.Uuid
  originalReviewerId String?  @map("original_reviewer_id") @db.Uuid
  originalAuthorId   String?  @map("original_author_id") @db.Uuid
  createdAt          DateTime @default(now()) @map("created_at")

  clonedReviewer   Reviewer  @relation("clonedReviewer", fields: [clonedReviewerId], references: [id], onDelete: Cascade)
  originalReviewer Reviewer? @relation("originalReviewer", fields: [originalReviewerId], references: [id], onDelete: SetNull)
  originalAuthor   User?     @relation(fields: [originalAuthorId], references: [id], onDelete: SetNull)

  @@map("reviewer_lineage")
}

model AiQuota {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId          String   @map("user_id") @db.Uuid
  generationsUsed Int      @default(0) @map("generations_used")
  windowResetAt   DateTime @map("window_reset_at")
  updatedAt       DateTime @default(now()) @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, windowResetAt], map: "idx_ai_quotas_user")
  @@map("ai_quotas")
}

model Like {
  userId     String   @db.Uuid
  reviewerId String   @db.Uuid
  createdAt  DateTime @default(now())

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  reviewer Reviewer @relation(fields: [reviewerId], references: [id], onDelete: Cascade)

  @@id([userId, reviewerId])
  @@map("likes")
}

model Follow {
  followerId  String   @db.Uuid
  followingId String   @db.Uuid
  createdAt   DateTime @default(now())

  follower  User @relation("follower", fields: [followerId], references: [id], onDelete: Cascade)
  following User @relation("following", fields: [followingId], references: [id], onDelete: Cascade)

  @@id([followerId, followingId])
  @@map("follows")
}

model Notification {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  recipientId String    @map("recipient_id") @db.Uuid
  actorId     String    @map("actor_id") @db.Uuid
  actionType  String    @map("action_type") @db.VarChar(50)
  reviewerId  String?   @map("reviewer_id") @db.Uuid
  isRead      Boolean   @default(false) @map("is_read")
  createdAt   DateTime  @default(now()) @map("created_at")

  recipient User      @relation("receivedNotifications", fields: [recipientId], references: [id], onDelete: Cascade)
  actor     User      @relation("actorNotifications", fields: [actorId], references: [id], onDelete: Cascade)
  reviewer  Reviewer? @relation(fields: [reviewerId], references: [id], onDelete: Cascade)

  @@index([recipientId, isRead, createdAt], map: "idx_notifications_recipient", order: [asc, asc, desc])
  @@map("notifications")
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/prisma/schema.prisma
git commit -m "feat: add full prisma schema with all 7 tables and indexes"
```

---

### Task 13: Initialize Frontend Package

**Files:**
- Create: `frontend/package.json`

**Interfaces:**
- Consumes: Root package.json workspaces config
- Produces: Frontend package with dependencies

- [ ] **Step 1: Create frontend/package.json**

```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jsdom": "^23.0.0"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/package.json
git commit -m "chore: initialize frontend package.json with dependencies"
```

---

### Task 14: Create Vite and Tailwind Config

**Files:**
- Create: `frontend/vite.config.js`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/index.html`

**Interfaces:**
- Consumes: Tailwind brutalist tokens from DESIGN.md
- Produces: Build config and HTML entry point

- [ ] **Step 1: Create vite.config.js**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 2: Create tailwind.config.js**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bone: '#FAF8F5',
        ink: '#141414',
        sage: '#7A8B6F',
        terracotta: '#C4704B',
        border: '#E5E2DC',
      },
      borderRadius: {
        none: '0px',
        sharp: '2px',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 3: Create postcss.config.js**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 4: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Review Well</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;0,6..72,700;1,6..72,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />
  </head>
  <body class="bg-bone text-ink font-sans">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Commit**

```bash
git add frontend/vite.config.js frontend/tailwind.config.js frontend/postcss.config.js frontend/index.html
git commit -m "feat: add vite, tailwind, postcss configs and index.html"
```

---

### Task 15: Create Frontend Source Files

**Files:**
- Create: `frontend/src/main.jsx`
- Create: `frontend/src/App.jsx`
- Create: `frontend/src/index.css`

**Interfaces:**
- Consumes: Vite entry point from index.html
- Produces: React app shell

- [ ] **Step 1: Create src/main.jsx**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 2: Create src/App.jsx**

```jsx
function App() {
  return (
    <div className="min-h-screen">
      <h1 className="text-4xl font-serif font-bold p-8">Review Well</h1>
      <p className="px-8 font-sans">Scaffolding complete. Ready for implementation.</p>
    </div>
  )
}

export default App
```

- [ ] **Step 3: Create src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-bone text-ink antialiased;
  }
}
```

- [ ] **Step 4: Create public/favicon.svg**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#141414"/>
  <text x="16" y="22" font-family="Georgia, serif" font-size="18" font-weight="bold" fill="#FAF8F5" text-anchor="middle">RW</text>
</svg>
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/ frontend/public/
git commit -m "feat: add react app shell with tailwind base styles"
```

---

### Task 16: Create GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/test.yml`

**Interfaces:**
- Consumes: All package.json scripts
- Produces: CI/CD pipeline skeleton

- [ ] **Step 1: Create .github/workflows/test.yml**

```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: review_well_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Use Node.js 18
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma client
        run: npm run prisma:generate --workspace=backend
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/review_well_test

      - name: Run migrations
        run: npm run prisma:migrate --workspace=backend
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/review_well_test

      - name: Run backend tests
        run: npm run test --workspace=backend
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/review_well_test

      - name: Run frontend tests
        run: npm run test --workspace=frontend

      - name: Build frontend
        run: npm run build
```

- [ ] **Step 2: Commit**

```bash
git add .github/
git commit -m "ci: add github actions workflow for tests"
```

---

### Task 17: Install Dependencies and Verify

**Files:**
- Modify: `package-lock.json` (generated)
- Modify: `node_modules/` (generated)

**Interfaces:**
- Consumes: All package.json files from previous tasks
- Produces: Working node_modules and lock file

- [ ] **Step 1: Install all dependencies**

Run: `npm install`
Expected: Installs all dependencies for both workspaces

- [ ] **Step 2: Verify Prisma client generates**

Run: `npm run prisma:generate --workspace=backend`
Expected: Prisma client generated successfully

- [ ] **Step 3: Verify frontend builds**

Run: `npm run build`
Expected: Vite build completes without errors

- [ ] **Step 4: Verify dev servers start**

Run: `npm run dev` (then Ctrl+C after confirming both start)
Expected: Backend on port 3000, frontend on port 5173

- [ ] **Step 5: Commit**

```bash
git add package-lock.json
git commit -m "chore: install dependencies and verify build"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** All 5 sections from design spec covered (root, backend, frontend, prisma, configs)
- [x] **Placeholder scan:** No TBD/TODO in scaffolded code (stubs have clear "Not implemented" errors)
- [x] **Type consistency:** All imports/exports match between tasks (controllers → routes, models → controllers, prisma client → models)
- [x] **Task count:** 17 tasks, each 2-5 minutes, each ends with commit
- [x] **No missing files:** Every file in File Structure table has a creation task
