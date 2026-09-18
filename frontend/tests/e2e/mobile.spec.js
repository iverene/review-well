import { test, expect } from '@playwright/test'

// Mobile responsiveness guard: at 390px wide, key pages must not overflow
// horizontally. Run with the mobile viewport project below.

test.use({ viewport: { width: 390, height: 844 } })

const completeUser = {
  id: 'user-1',
  displayName: 'Test User',
  email: 'test@example.com',
  avatarUrl: null,
  school: 'State University',
  program: 'BS Computer Science',
  major: 'Software',
  yearLevel: '3rd Year',
}

const mockAuthed = (page) => Promise.all([
  page.route('**/api/auth/me', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ user: completeUser }),
  })),
  page.route('**/api/reviewers/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ reviewers: [] }),
  })),
])

const expectNoHorizontalOverflow = async (page) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(0)
}

test.describe('mobile layout at 390px', () => {
  test('landing page fits without horizontal scroll', async ({ page }) => {
    await page.goto('/')
    await expectNoHorizontalOverflow(page)
  })

  test('login page fits without horizontal scroll', async ({ page }) => {
    await page.goto('/login')
    await expectNoHorizontalOverflow(page)
  })

  test('public reviewers page fits without horizontal scroll', async ({ page }) => {
    await page.goto('/reviewer/public')
    await expectNoHorizontalOverflow(page)
  })

  test('about and guide pages fit without horizontal scroll', async ({ page }) => {
    await page.goto('/about')
    await expectNoHorizontalOverflow(page)
    await page.goto('/guide')
    await expectNoHorizontalOverflow(page)
  })

  test('authenticated home and create fit without horizontal scroll', async ({ page }) => {
    await mockAuthed(page)
    await page.goto('/')
    await expectNoHorizontalOverflow(page)
    await page.goto('/create')
    await expectNoHorizontalOverflow(page)
  })
})
