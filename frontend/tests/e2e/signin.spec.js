import { test, expect } from '@playwright/test'

// Google OAuth itself cannot run headless (Google blocks automated browsers
// and the flow needs real credentials), so these tests verify the full
// sign-in journey around it: initiation hits the backend endpoint, and the
// post-login callback behaves correctly for a live, missing, or incomplete
// session (mocked at the /api/auth/me boundary).

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

const incompleteUser = {
  ...completeUser,
  school: null,
  program: null,
  major: null,
  yearLevel: null,
}

const mockSession = (page, user, status = 200) => page.route('**/api/auth/me', (route) => route.fulfill({
  status,
  contentType: 'application/json',
  body: JSON.stringify(user ? { user } : { error: 'Not authenticated' }),
}))

const mockLibrary = (page) => page.route('**/api/reviewers/**', (route) => route.fulfill({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify({ reviewers: [] }),
}))

test.describe('Google sign-in journey', () => {
  test('sign-in button requests the backend OAuth endpoint', async ({ page }) => {
    await mockSession(page, null, 401)
    // Stay in-app: observe the outbound OAuth request without following it to Google
    await page.route('**/api/auth/google', (route) => route.abort())
    await page.goto('/login')

    const [request] = await Promise.all([
      page.waitForRequest('**/api/auth/google'),
      page.getByRole('button', { name: 'Sign in with Google' }).click(),
    ])

    expect(request.url()).toContain('/api/auth/google')
  })

  test('callback with a live session lands on home authenticated', async ({ page }) => {
    await mockSession(page, completeUser)
    await mockLibrary(page)

    await test.step('complete the post-login callback', async () => {
      await page.goto('/auth/callback')
      await expect(page).toHaveURL('/')
    })

    await test.step('see authenticated UI', async () => {
      await expect(page.getByRole('button', { name: 'User menu' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Sign in with Google' })).toHaveCount(0)
    })
  })

  test('callback with an incomplete profile routes to onboarding', async ({ page }) => {
    await mockSession(page, incompleteUser)

    await page.goto('/auth/callback')

    await expect(page).toHaveURL('/onboarding')
  })

  test('callback without a session shows an error with a way back', async ({ page }) => {
    await mockSession(page, null, 401)

    await page.goto('/auth/callback')

    await expect(page.getByText('We could not complete Google sign-in. Please try again.')).toBeVisible()
    await page.getByRole('button', { name: 'Return to sign in' }).click()
    await expect(page).toHaveURL('/login')
  })

  test('protected routes stay accessible with a live session', async ({ page }) => {
    await mockSession(page, completeUser)
    await mockLibrary(page)

    await page.goto('/create')

    await expect(page).toHaveURL('/create')
  })
})
