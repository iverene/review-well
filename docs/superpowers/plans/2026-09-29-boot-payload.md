# Boot Payload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut 1.5MB+ off the cold-start payload with no visible or behavioral change.

**Architecture:** Three independent tasks (images, vendor chunk, fonts) plus a verification task. Binary assets are optimized in place with Pillow (already available as `python3 -c "import PIL"`); visual equivalence is checked with Playwright screenshots against pre-change baselines. No new dependencies.

**Tech Stack:** Vite 5 + Rollup manualChunks, Pillow, Playwright chromium (already in devDependencies, browsers present), vitest, eslint. All commands run from `C:\Users\Iverene Grace\Projects\review-well` unless a step says `frontend/`.

## Global Constraints

- No new dependencies.
- Keep both image filenames (pre-cache, favicon, login, splash, announcement art update with zero code changes).
- Logo stays 256px RGBA (4× its largest 64–96px render); character keeps its 546×457 dimensions.
- Poppins is the only font change (verified unreferenced 2026-09-29); weights and other families stay.
- Do not touch the Reviewer chunk, the PDF worker, or font self-hosting (later sub-projects).
- If any size gate fails, report NEEDS_CONTEXT — never degrade quality to hit a number.

---

## File Structure

- Modify binaries in place: `frontend/public/logo.png`, `frontend/src/assets/character-waving.png` (git history is the backup).
- Modify `frontend/vite.config.js` (add `build` section only).
- Modify `frontend/index.html` (font link only).
- Screenshots are throwaway verification artifacts in `C:\Users\IVEREN~1\AppData\Local\Temp\opencode` — never commit them.

---

### Task 1: Shrink images

**Files:**
- Modify: `frontend/public/logo.png` (1080×1080 RGBA, 1.3MB → 256×256 RGBA, under 50KB)
- Modify: `frontend/src/assets/character-waving.png` (546×457 RGBA, 300KB → same dimensions, under 120KB)

**Interfaces:**
- Consumes: Pillow via `python3`, Playwright chromium for screenshots.
- Produces: smaller binaries at identical paths/dimensions (logo dimensions change 1080→256; nothing references pixel size).

- [ ] **Step 1: Record baseline sizes and capture baseline screenshots**

Run:

```bash
python3 -c "from PIL import Image; [print(f, Image.open(f).size, Image.open(f).mode, len(open(f,'rb').read())//1024 + 1) for f in ['frontend/public/logo.png','frontend/src/assets/character-waving.png']]"
```

Expected: `logo.png (1080, 1080) RGBA ~1339KB`, `character-waving.png (546, 457) RGBA ~300KB`.

Then write `C:\Users\IVEREN~1\AppData\Local\Temp\opencode\shot_before.cjs`:

```js
const { chromium } = require('@playwright/test')

;(async () => {
  const browser = await chromium.launch()
  try {
    for (const [name, viewport, path] of [
      ['login-wide', { width: 1280, height: 720 }, '/login'],
      ['announce-narrow', { width: 390, height: 844 }, '/'],
    ]) {
      const context = await browser.newContext({ viewport })
      const page = await context.newPage()
      await page.route('**/api/auth/me', (route) =>
        route.fulfill({ status: 401, contentType: 'application/json', body: '{}' })
      )
      await page.goto(`http://localhost:4173${path}`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(2500)
      await page.screenshot({ path: `C:/Users/IVEREN~1/AppData/Local/Temp/opencode/${name}-before.png` })
      await context.close()
    }
    console.log('BASELINE_DONE')
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.log('SCREENSHOT_ERROR: ' + e.message)
  process.exit(1)
})
```

Run, with workdir `frontend/`:

```bash
Copy-Item -LiteralPath "C:\Users\IVEREN~1\AppData\Local\Temp\opencode\shot_before.cjs" -Destination ".\shot_before_tmp.cjs"; $preview = Start-Process -FilePath "npx.cmd" -ArgumentList "vite preview --port 4173 --strictPort" -PassThru; Start-Sleep -Seconds 8; node ".\shot_before_tmp.cjs" 2>&1 | Select-Object -Last 2; Stop-Process -Id $preview.Id -Force -ErrorAction SilentlyContinue; Remove-Item -LiteralPath ".\shot_before_tmp.cjs" -ErrorAction SilentlyContinue
```

Expected: `BASELINE_DONE` and two PNGs in the temp dir. (The `/login` shot covers the 64–96px logo; the `/` narrow shot covers the announcement illustration. If the announcement modal does not appear, seed it first with `addInitScript` localStorage removal — i.e. replace the init script with `window.localStorage.removeItem('review-well-announcement-v2-whats-new')` — then re-run.)

- [ ] **Step 2: Optimize both images**

Run, with workdir `C:\Users\Iverene Grace\Projects\review-well`:

```bash
python3 -c "from PIL import Image; logo = Image.open('frontend/public/logo.png'); logo.resize((256, 256), Image.LANCZOS).save('frontend/public/logo.png', optimize=True); img = Image.open('frontend/src/assets/character-waving.png').convert('RGBA'); r, g, b, a = img.split(); rgb = Image.merge('RGB', (r, g, b)).quantize(colors=255, method=Image.Quantize.MEDIANCUT).convert('RGB'); Image.merge('RGBA', (*rgb.split(), a)).save('frontend/src/assets/character-waving.png', optimize=True); print('OPTIMIZED')"
```

Expected: `OPTIMIZED`.

- [ ] **Step 3: Verify sizes and dimensions**

Run the Step 1 size command again.
Expected: `logo.png (256, 256) RGBA` under 50KB; `character-waving.png (546, 457) RGBA` under 120KB. If either gate fails, STOP and report NEEDS_CONTEXT with the actual numbers.

- [ ] **Step 4: Verify visually against baselines**

Re-run the Step 1 capture with output names `login-wide-after.png` and `announce-narrow-after.png`, then Read all four PNGs and compare: logo crisp with clean edges at login size, illustration colors/alpha identical to baseline. If anything looks degraded, STOP and report NEEDS_CONTEXT — do not ship a worse image.

- [ ] **Step 5: Run the frontend suite**

Run, with workdir `frontend/`:

```bash
npx vitest run tests/components/AnnouncementModal.test.jsx tests/pages/Login.test.jsx 2>&1 | Select-String -Pattern "Test Files|Tests "
```

Expected: all pass (these render the touched images; the full suite runs in Task 4).

- [ ] **Step 6: Commit**

```bash
git add frontend/public/logo.png frontend/src/assets/character-waving.png
git commit -m "perf: shrink logo and character artwork for faster boot"
```

---

### Task 2: Split vendor chunk

**Files:**
- Modify: `frontend/vite.config.js` (add `build` section; nothing else changes)

**Interfaces:**
- Consumes: Rollup `manualChunks` (built into Vite 5).
- Produces: `dist/assets/vendor-[hash].js` plus a smaller main chunk; chunk file names stay hashed.

- [ ] **Step 1: Add the build section**

Edit `frontend/vite.config.js`: after the `server: { ... },` block (before `resolve:`), insert:

```js
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
```

The file must then read (exact):

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
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
```

- [ ] **Step 2: Build and check the output**

Run, with workdir `C:\Users\Iverene Grace\Projects\review-well`:

```bash
npm --prefix frontend run build 2>&1 | Select-String -Pattern "vendor|index-.*\.js|Reviewer-.*\.js|built in"
```

Expected: a `vendor-[hash].js` line, a main `index-[hash].js` line visibly smaller than the pre-change 252KB, and no chunk-size warning naming the main index chunk. (A warning naming only the lazy `Reviewer-` chunk is expected and out of scope.)

- [ ] **Step 3: Smoke the production bundle**

Serve `frontend/dist` with `npx.cmd vite preview --port 4173 --strictPort` (workdir `frontend/`), load `http://localhost:4173/login`, confirm the page renders (no blank screen — a broken chunk split shows here). Stop the preview afterwards.

- [ ] **Step 4: Run the frontend suite**

Run, with workdir `frontend/`:

```bash
npx vitest run --pool=forks --maxWorkers=2 --minWorkers=2 2>&1 | Select-String -Pattern "Test Files|Tests "
```

Expected: 33 files / 171+ tests pass (counts grow only if earlier tasks added tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/vite.config.js
git commit -m "perf: split vendor chunk for long-term caching"
```

---

### Task 3: Drop the unused font family

**Files:**
- Modify: `frontend/index.html` line 17 (font link only)

**Interfaces:**
- Consumes: nothing. Produces: a Fonts request without Poppins.

- [ ] **Step 1: Remove Poppins from the font link**

In `frontend/index.html`, replace:

```html
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

with:

```html
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

(Poppins verified unreferenced 2026-09-29: the only repo match for `Poppins` is this link. Weights and other families stay.)

- [ ] **Step 2: Verify typography visually**

Capture `login-wide` and `/` narrow screenshots with the Task 1 method (names `font-login-after.png`, `font-home-after.png`) and Read them next to the Task 1 baselines: headings still rounded display type, body still humanist sans, code/mono bits still monospace. If any text falls back to a system font, STOP and report NEEDS_CONTEXT.

- [ ] **Step 3: Run lint plus the page suites**

Run, with workdir `frontend/`:

```bash
npx eslint src --ext .js,.jsx 2>&1 | Select-Object -First 3; echo lint-done; npx vitest run tests/pages/Home.test.jsx tests/pages/Login.test.jsx 2>&1 | Select-String -Pattern "Test Files|Tests "
```

Expected: no new lint errors (the pre-existing `vi is not defined` class in test files is untouched by this task), page tests pass.

- [ ] **Step 4: Commit**

```bash
git add frontend/index.html
git commit -m "perf: drop unused Poppins font family"
```

---

### Task 4: Verification and weight table

**Files:** none (verification only).

- [ ] **Step 1: Final measurements**

Run, with workdir `C:\Users\Iverene Grace\Projects\review-well`:

```bash
Get-ChildItem -LiteralPath "frontend/public/logo.png", "frontend/src/assets/character-waving.png" | Select-Object Name, @{N='KB';E={[math]::Round($_.Length/1KB)}}; npm --prefix frontend run build 2>&1 | Select-String -Pattern "dist/assets/.*\.(js|css)"
```

Record the before/after table in the report: logo 1339KB → actual, character 300KB → actual, main index chunk 252KB → actual, vendor chunk size, fonts 4 families → 3.

- [ ] **Step 2: Run the full frontend suite and lint**

Run, with workdir `frontend/`:

```bash
npx vitest run --pool=forks --maxWorkers=2 --minWorkers=2 2>&1 | Select-String -Pattern "Test Files|Tests "; npx eslint src --ext .js,.jsx 2>&1 | Select-Object -First 3; echo lint-done
```

Expected: full suite green, no new lint errors. If anything is red, do NOT fix it here — report BLOCKED with the failure, its output, and which task's change caused it.

---

## Self-Review

- **Spec coverage:** images (Task 1: sizes, dimensions, filenames, screenshot verification), vendor chunk (Task 2: manualChunks, smaller main bundle, warning gone for main), fonts (Task 3: Poppins only, visual check), testing (Task 4 + per-task suites; binary/build changes verified by measurement per the spec's Testing section).
- **Placeholder scan:** every step has exact code, commands, paths, and expected outputs. No TBD/TODO. The one conditional (announcement modal seeding in Task 1 Step 1) gives the exact fallback line.
- **Type consistency:** chunk names, file paths, and the `manualChunks` key (`vendor`) are used identically everywhere. Task 4's table references the exact baselines from exploration (1339KB, 300KB, 252KB, 4 families).
