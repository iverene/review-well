import { test, expect } from '@playwright/test'

test.describe('Social Features', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('**/api/auth/me', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'user-123',
            email: 'test@example.com',
            displayName: 'Test User',
            avatarUrl: null,
          },
        }),
      })
    })

    // Mock notifications count
    await page.route('**/api/social/notifications/unread-count', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 3 }),
      })
    })
  })

  test('should show notification badge with count', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('text=3')).toBeVisible()
  })

  test('should navigate to notifications page', async ({ page }) => {
    await page.goto('/')

    await page.click('a[href="/notifications"]')

    await expect(page).toHaveURL('/notifications')
  })

  test('should show notifications list', async ({ page }) => {
    await page.route('**/api/social/notifications*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          notifications: [
            {
              id: 'notif-1',
              actor: { displayName: 'John Doe', avatarUrl: null },
              actionType: 'like',
              reviewer: { title: 'Test Reviewer' },
              isRead: false,
              createdAt: new Date().toISOString(),
            },
          ],
          total: 1,
        }),
      })
    })

    await page.goto('/notifications')

    await expect(page.locator('text=John Doe')).toBeVisible()
    await expect(page.locator('text=liked your reviewer')).toBeVisible()
  })
})
