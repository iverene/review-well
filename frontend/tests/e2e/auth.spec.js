import { test, expect } from '@playwright/test'

import { dismissAnnouncements, mockSession } from './helpers'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await dismissAnnouncements(page)
    await mockSession(page, null)
  })

  test('should display login page when not authenticated', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { level: 1, name: 'Pick Your Study Mode' })).toBeVisible()
    await expect(page.getByRole('main').getByRole('button', { name: 'Sign in with Google' })).toBeVisible()
  })

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/create')

    await expect(page).toHaveURL('/login')
  })

  test('should display login button in header when not authenticated', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('banner').getByRole('button', { name: 'Sign in with Google' })).toBeVisible()
  })

  test('header sign-in starts Google OAuth directly', async ({ page }) => {
    await page.route('**/api/auth/google', (route) => route.abort())
    await page.goto('/')

    const [request] = await Promise.all([
      page.waitForRequest('**/api/auth/google'),
      page.getByRole('banner').getByRole('button', { name: 'Sign in with Google' }).click(),
    ])

    expect(request.url()).toContain('/api/auth/google')
  })
})
